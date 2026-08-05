/*
 * Darwin descriptor-relative writer for portable-core bootstrap protocol v1.
 *
 * The helper pins the target and every destination parent, rejects symlink
 * traversal, probes same-directory hard links in every parent before the
 * first publication, and publishes with linkat (no-clobber) or renameat
 * (explicit overwrite).  Like the Linux pinned-parent implementation, it is
 * race-detecting rather than an atomic "beneath root" guarantee: another
 * actor can rename an already pinned parent between reachability checks and a
 * mutation, in which case publication follows that directory object.
 */
#define _DARWIN_C_SOURCE 1

#include <sys/stat.h>
#include <sys/types.h>
#include <errno.h>
#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define REQUEST_MAGIC "OPDFREQ1"
#define RESPONSE_MAGIC "OPDFRES1"
#define PROTOCOL_VERSION 1u
#define HEADER_SIZE 48u
#define OP_HEADER_SIZE 16u
/* Protocol frames are strictly smaller than this exclusive 256 MiB limit. */
#define MAX_FRAME (256u * 1024u * 1024u)
#define MAX_PATH 4096u
#define MAX_OPERATIONS 4096u
#define FLAG_TEST_FAIL_LAST_PROBE 1u
#define FLAG_TEST_CREATE_FIRST_DESTINATION 2u
#define FLAG_TEST_SLEEP_BEFORE_PREFLIGHT 4u
#define FLAG_TEST_OUTPUT_BEFORE_PREFLIGHT 8u
#define FLAG_TEST_ASSERT_SANITIZED_ENV 16u
#define FLAG_TEST_FAIL_TEMP_WRITE 32u
#define ALLOWED_FLAGS (FLAG_TEST_FAIL_LAST_PROBE | FLAG_TEST_CREATE_FIRST_DESTINATION | \
                       FLAG_TEST_SLEEP_BEFORE_PREFLIGHT | FLAG_TEST_OUTPUT_BEFORE_PREFLIGHT | \
                       FLAG_TEST_ASSERT_SANITIZED_ENV | FLAG_TEST_FAIL_TEMP_WRITE)

enum phase { PHASE_ACTIVATION = 1, PHASE_ROOT_OPEN = 2, PHASE_PARENT_PREFLIGHT = 3,
             PHASE_PUBLICATION = 4, PHASE_CLEANUP = 5 };

struct operation {
  char *path;
  const unsigned char *content;
  uint64_t content_len;
  int overwrite;
  size_t parent_index;
};

struct parent {
  char *path;
  int fd;
  dev_t dev;
  ino_t ino;
};

struct created_dir {
  int parent_fd;
  char *name;
};

static uint32_t get_u32(const unsigned char *p) {
  return (uint32_t)p[0] | ((uint32_t)p[1] << 8) | ((uint32_t)p[2] << 16) | ((uint32_t)p[3] << 24);
}

static uint64_t get_u64(const unsigned char *p) {
  return (uint64_t)get_u32(p) | ((uint64_t)get_u32(p + 4) << 32);
}

static void put_u32(unsigned char *p, uint32_t value) {
  p[0] = (unsigned char)value; p[1] = (unsigned char)(value >> 8);
  p[2] = (unsigned char)(value >> 16); p[3] = (unsigned char)(value >> 24);
}

static int respond(int status, enum phase phase, uint32_t operation, int error_number,
                   int publication_started, const char *message) {
  unsigned char response[32] = {0};
  memcpy(response, RESPONSE_MAGIC, 8);
  put_u32(response + 8, PROTOCOL_VERSION);
  put_u32(response + 12, (uint32_t)status);
  put_u32(response + 16, (uint32_t)phase);
  put_u32(response + 20, operation);
  put_u32(response + 24, (uint32_t)error_number);
  put_u32(response + 28, (uint32_t)publication_started);
  (void)write(STDOUT_FILENO, response, sizeof(response));
  if (message != NULL) fprintf(stderr, "darwin-portable-fs: %.240s%s%s\n", message,
                               error_number ? ": " : "", error_number ? strerror(error_number) : "");
  return status == 0 ? 0 : 1;
}

static int write_all(int fd, const unsigned char *bytes, uint64_t length) {
  while (length > 0) {
    size_t chunk = length > (uint64_t)SIZE_MAX ? SIZE_MAX : (size_t)length;
    ssize_t written = write(fd, bytes, chunk);
    if (written < 0 && errno == EINTR) continue;
    if (written <= 0) return -1;
    bytes += (size_t)written;
    length -= (uint64_t)written;
  }
  return 0;
}

static int utf8_valid(const unsigned char *s, size_t n) {
  size_t i = 0;
  while (i < n) {
    unsigned char c = s[i++];
    if (c < 0x80) continue;
    unsigned need;
    uint32_t value;
    if ((c & 0xe0) == 0xc0) { need = 1; value = c & 0x1f; if (value < 2) return 0; }
    else if ((c & 0xf0) == 0xe0) { need = 2; value = c & 0x0f; }
    else if ((c & 0xf8) == 0xf0) { need = 3; value = c & 0x07; if (value > 4) return 0; }
    else return 0;
    if (i + need > n) return 0;
    while (need--) { unsigned char d = s[i++]; if ((d & 0xc0) != 0x80) return 0; value = (value << 6) | (d & 0x3f); }
    if ((value >= 0xd800 && value <= 0xdfff) || value > 0x10ffff) return 0;
    if ((value < 0x800 && c >= 0xe0) || (value < 0x10000 && c >= 0xf0)) return 0;
  }
  return 1;
}

static int safe_relative(const char *path) {
  const char *component = path;
  if (*path == '\0' || *path == '/') return 0;
  for (const char *p = path;; ++p) {
    if (*p == '\\') return 0;
    if (*p == '/' || *p == '\0') {
      size_t n = (size_t)(p - component);
      if (n == 0 || (n == 1 && component[0] == '.') ||
          (n == 2 && component[0] == '.' && component[1] == '.')) return 0;
      if (*p == '\0') return 1;
      component = p + 1;
    }
  }
}

static char *parent_path(const char *path) {
  const char *slash = strrchr(path, '/');
  if (slash == NULL) return strdup(".");
  size_t n = (size_t)(slash - path);
  char *out = malloc(n + 1);
  if (out != NULL) { memcpy(out, path, n); out[n] = '\0'; }
  return out;
}

static const char *basename_of(const char *path) {
  const char *slash = strrchr(path, '/');
  return slash == NULL ? path : slash + 1;
}

static int append_created(struct created_dir **created, size_t *count, int parent_fd, const char *name) {
  char *name_copy = strdup(name);
  int parent_copy = dup(parent_fd);
  if (name_copy == NULL || parent_copy < 0) {
    int saved = errno;
    free(name_copy);
    if (parent_copy >= 0) close(parent_copy);
    errno = saved == 0 ? ENOMEM : saved;
    return -1;
  }
  struct created_dir *next = realloc(*created, (*count + 1) * sizeof(**created));
  if (next == NULL) { int saved = errno; free(name_copy); close(parent_copy); errno = saved; return -1; }
  *created = next;
  next[*count].parent_fd = parent_copy;
  next[*count].name = name_copy;
  ++*count;
  return 0;
}

static int open_parent(int root_fd, const char *relative, int create,
                       struct created_dir **created, size_t *created_count) {
  int current = dup(root_fd);
  char *copy = NULL;
  char *cursor;
  if (current < 0) return -1;
  if (strcmp(relative, ".") == 0) return current;
  copy = strdup(relative);
  if (copy == NULL) { close(current); errno = ENOMEM; return -1; }
  cursor = copy;
  while (cursor != NULL && *cursor != '\0') {
    char *slash = strchr(cursor, '/');
    if (slash != NULL) *slash = '\0';
    int next = openat(current, cursor, O_RDONLY | O_DIRECTORY | O_NOFOLLOW);
    if (next < 0 && create && errno == ENOENT) {
      int made = 0;
      if (mkdirat(current, cursor, 0755) == 0) made = 1;
      else if (errno != EEXIST) goto fail;
      if (made && append_created(created, created_count, current, cursor) < 0) {
        int saved = errno;
        (void)unlinkat(current, cursor, AT_REMOVEDIR);
        errno = saved;
        goto fail;
      }
      next = openat(current, cursor, O_RDONLY | O_DIRECTORY | O_NOFOLLOW);
    }
    if (next < 0) goto fail;
    close(current);
    current = next;
    cursor = slash == NULL ? NULL : slash + 1;
  }
  free(copy);
  return current;
fail:
  { int saved = errno; free(copy); close(current); errno = saved; return -1; }
}

static int parent_reachable(int root_fd, const struct parent *parent) {
  struct stat st;
  int fd = open_parent(root_fd, parent->path, 0, NULL, NULL);
  if (fd < 0) return 0;
  int ok = fstat(fd, &st) == 0 && st.st_dev == parent->dev && st.st_ino == parent->ino;
  close(fd);
  return ok;
}

static int random_name(char *out, size_t size, const char *kind) {
  uint32_t a = arc4random(), b = arc4random();
  int n = snprintf(out, size, ".portable-%s-%08x%08x", kind, a, b);
  return n > 0 && (size_t)n < size ? 0 : -1;
}

static int probe_parent(const struct parent *parent) {
  char source[80], destination[88];
  int fd = -1, result = -1, saved = 0;
  if (random_name(source, sizeof(source), "probe") < 0) { errno = EINVAL; return -1; }
  if (snprintf(destination, sizeof(destination), "%s-linked", source) >= (int)sizeof(destination)) { errno = EINVAL; return -1; }
  fd = openat(parent->fd, source, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW, 0600);
  if (fd < 0) { saved = errno; goto done; }
  if (write_all(fd, (const unsigned char *)"probe\n", 6) < 0) {
    saved = errno; close(fd); fd = -1; goto done;
  }
  if (close(fd) < 0) {
    saved = errno; fd = -1; goto done;
  }
  fd = -1;
  if (linkat(parent->fd, source, parent->fd, destination, AT_SYMLINK_FOLLOW) < 0) { saved = errno; goto done; }
  result = 0;
done:
  if (fd >= 0) close(fd);
  (void)unlinkat(parent->fd, source, 0);
  (void)unlinkat(parent->fd, destination, 0);
  if (result < 0) errno = saved;
  return result;
}

static int publish(const struct parent *parent, const struct operation *operation, int force_write_failure) {
  char temporary[80];
  int fd = -1, result = -1, saved = 0;
  const char *destination = basename_of(operation->path);
  if (random_name(temporary, sizeof(temporary), "tmp") < 0) { errno = EINVAL; return -1; }
  fd = openat(parent->fd, temporary, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW, 0644);
  if (fd < 0) return -1;
  if (force_write_failure) {
    if (operation->content_len > 0) (void)write_all(fd, operation->content, 1);
    saved = EIO; close(fd); fd = -1; goto done;
  }
  if (write_all(fd, operation->content, operation->content_len) < 0) {
    saved = errno; close(fd); fd = -1; goto done;
  }
  if (close(fd) < 0) {
    saved = errno; fd = -1; goto done;
  }
  fd = -1;
  if (operation->overwrite) {
    if (renameat(parent->fd, temporary, parent->fd, destination) < 0) { saved = errno; goto done; }
  } else {
    if (linkat(parent->fd, temporary, parent->fd, destination, AT_SYMLINK_FOLLOW) < 0) { saved = errno; goto done; }
    if (unlinkat(parent->fd, temporary, 0) < 0) { saved = errno; goto done; }
  }
  result = 0;
done:
  if (fd >= 0) close(fd);
  (void)unlinkat(parent->fd, temporary, 0);
  if (result < 0) errno = saved;
  return result;
}

static unsigned char *read_request(size_t *length) {
  size_t used = 0, capacity = 65536;
  unsigned char *buffer = malloc(capacity);
  if (buffer == NULL) return NULL;
  for (;;) {
    if (used == capacity) {
      if (capacity >= MAX_FRAME) { free(buffer); errno = EFBIG; return NULL; }
      size_t next_capacity = capacity * 2 > MAX_FRAME ? MAX_FRAME : capacity * 2;
      unsigned char *next = realloc(buffer, next_capacity);
      if (next == NULL) { free(buffer); return NULL; }
      buffer = next; capacity = next_capacity;
    }
    ssize_t got = read(STDIN_FILENO, buffer + used, capacity - used);
    if (got < 0 && errno == EINTR) continue;
    if (got < 0) { int saved = errno; free(buffer); errno = saved; return NULL; }
    if (got == 0) break;
    used += (size_t)got;
    if (used >= HEADER_SIZE && memcmp(buffer, REQUEST_MAGIC, 8) == 0 && get_u64(buffer + 40) >= MAX_FRAME) {
      free(buffer); errno = EFBIG; return NULL;
    }
  }
  *length = used;
  return buffer;
}

static void cleanup_created(struct created_dir *created, size_t count) {
  while (count > 0) {
    --count;
    if (created[count].parent_fd >= 0) {
      (void)unlinkat(created[count].parent_fd, created[count].name, AT_REMOVEDIR);
      close(created[count].parent_fd);
    }
    free(created[count].name);
  }
  free(created);
}

int main(int argc, char **argv) {
  if (argc == 2 && strcmp(argv[1], "--self-test") == 0) {
#if defined(__arm64__)
    const char *arch = "arm64";
#elif defined(__x86_64__)
    const char *arch = "x86_64";
#else
    const char *arch = "unsupported";
#endif
    printf("OPDFSELF1 protocol=1 platform=darwin arch=%s\n", arch);
    return strcmp(arch, "unsupported") == 0;
  }
  if (argc != 1) return respond(1, PHASE_ACTIVATION, UINT32_MAX, EINVAL, 0, "unexpected arguments");

  size_t frame_length = 0, offset = HEADER_SIZE;
  unsigned char *frame = read_request(&frame_length);
  struct operation *operations = NULL;
  struct parent *parents = NULL;
  struct created_dir *created = NULL;
  size_t parent_count = 0, created_count = 0;
  int root_fd = -1, result = 1, publication_started = 0;
  enum phase failure_phase = PHASE_ACTIVATION;
  uint32_t failure_operation = UINT32_MAX;
  int failure_errno = EINVAL;
  const char *failure_message = "malformed request";

  if (frame == NULL || frame_length < HEADER_SIZE || memcmp(frame, REQUEST_MAGIC, 8) != 0 ||
      get_u32(frame + 8) != PROTOCOL_VERSION || get_u32(frame + 12) & ~ALLOWED_FLAGS ||
      get_u64(frame + 40) != frame_length || frame_length >= MAX_FRAME) goto done;
  uint32_t flags = get_u32(frame + 12), target_length = get_u32(frame + 32), operation_count = get_u32(frame + 36);
  uint64_t expected_dev = get_u64(frame + 16), expected_ino = get_u64(frame + 24);
  if (target_length == 0 || target_length > MAX_PATH || operation_count > MAX_OPERATIONS ||
      offset + target_length > frame_length || memchr(frame + offset, '\0', target_length) != NULL ||
      !utf8_valid(frame + offset, target_length)) goto done;
  char *target = malloc((size_t)target_length + 1);
  if (target == NULL) { failure_errno = ENOMEM; goto done; }
  memcpy(target, frame + offset, target_length); target[target_length] = '\0'; offset += target_length;
  if (target[0] != '/') { free(target); goto done; }

  operations = calloc(operation_count == 0 ? 1 : operation_count, sizeof(*operations));
  if (operations == NULL) { free(target); failure_errno = ENOMEM; goto done; }
  for (uint32_t i = 0; i < operation_count; ++i) {
    if (offset + OP_HEADER_SIZE > frame_length) { free(target); goto done; }
    unsigned overwrite = frame[offset];
    uint32_t path_length = get_u32(frame + offset + 4);
    uint64_t content_length = get_u64(frame + offset + 8);
    offset += OP_HEADER_SIZE;
    if (overwrite > 1 || frame[offset - 15] || frame[offset - 14] || frame[offset - 13] ||
        path_length == 0 || path_length > MAX_PATH || content_length > MAX_FRAME ||
        (uint64_t)offset + path_length + content_length > frame_length ||
        memchr(frame + offset, '\0', path_length) != NULL || !utf8_valid(frame + offset, path_length)) { free(target); goto done; }
    operations[i].path = malloc((size_t)path_length + 1);
    if (operations[i].path == NULL) { free(target); failure_errno = ENOMEM; goto done; }
    memcpy(operations[i].path, frame + offset, path_length); operations[i].path[path_length] = '\0';
    if (!safe_relative(operations[i].path)) { free(target); goto done; }
    for (uint32_t j = 0; j < i; ++j) if (strcmp(operations[i].path, operations[j].path) == 0) { free(target); goto done; }
    offset += path_length;
    operations[i].content = frame + offset; operations[i].content_len = content_length; operations[i].overwrite = (int)overwrite;
    offset += (size_t)content_length;
  }
  if (offset != frame_length) { free(target); goto done; }
  if ((flags & FLAG_TEST_ASSERT_SANITIZED_ENV) &&
      (getenv("DYLD_INSERT_LIBRARIES") != NULL || getenv("DYLD_LIBRARY_PATH") != NULL ||
       getenv("DYLD_FRAMEWORK_PATH") != NULL || getenv("DYLD_PRINT_LIBRARIES") != NULL ||
       getenv("TMPDIR") != NULL)) {
    free(target); failure_message = "helper execution environment was not sanitized"; goto done;
  }

  failure_phase = PHASE_ROOT_OPEN;
  root_fd = open(target, O_RDONLY | O_DIRECTORY | O_NOFOLLOW);
  free(target);
  if (root_fd < 0) { failure_errno = errno; failure_message = "cannot open target root"; goto done; }
  struct stat root_stat;
  if (fstat(root_fd, &root_stat) < 0 || (uint64_t)root_stat.st_dev != expected_dev || (uint64_t)root_stat.st_ino != expected_ino) {
    failure_errno = errno ? errno : ESTALE; failure_message = "target root identity mismatch"; goto done;
  }
  if (flags & FLAG_TEST_SLEEP_BEFORE_PREFLIGHT) sleep(60);
  if (flags & FLAG_TEST_OUTPUT_BEFORE_PREFLIGHT) {
    unsigned char output[1024];
    memset(output, 'X', sizeof(output));
    for (unsigned i = 0; i < 80; ++i) if (write_all(STDOUT_FILENO, output, sizeof(output)) < 0) break;
    sleep(60);
  }

  failure_phase = PHASE_PARENT_PREFLIGHT;
  for (uint32_t i = 0; i < operation_count; ++i) {
    char *parent_name = parent_path(operations[i].path);
    if (parent_name == NULL) { failure_errno = ENOMEM; goto done; }
    size_t index;
    for (index = 0; index < parent_count; ++index) if (strcmp(parents[index].path, parent_name) == 0) break;
    if (index == parent_count) {
      struct parent *next = realloc(parents, (parent_count + 1) * sizeof(*parents));
      if (next == NULL) { free(parent_name); failure_errno = ENOMEM; goto done; }
      parents = next; memset(&parents[parent_count], 0, sizeof(parents[parent_count])); parents[parent_count].fd = -1;
      parents[parent_count].path = parent_name;
      parents[parent_count].fd = open_parent(root_fd, parent_name, 1, &created, &created_count);
      if (parents[parent_count].fd < 0) { failure_errno = errno; failure_message = "cannot prepare destination parent"; goto done; }
      struct stat parent_stat;
      if (fstat(parents[parent_count].fd, &parent_stat) < 0) { failure_errno = errno; goto done; }
      parents[parent_count].dev = parent_stat.st_dev; parents[parent_count].ino = parent_stat.st_ino;
      ++parent_count;
    } else free(parent_name);
    operations[i].parent_index = index;
  }
  for (size_t i = 0; i < parent_count; ++i) {
    if (!parent_reachable(root_fd, &parents[i])) { failure_errno = ESTALE; failure_message = "destination parent changed during preflight"; goto done; }
    if ((flags & FLAG_TEST_FAIL_LAST_PROBE) && i + 1 == parent_count) { failure_errno = ENOTSUP; failure_message = "test-requested last parent probe failure"; goto done; }
    if (probe_parent(&parents[i]) < 0) { failure_errno = errno; failure_message = "same-directory hard-link probe failed"; goto done; }
    if (!parent_reachable(root_fd, &parents[i])) { failure_errno = ESTALE; failure_message = "destination parent changed during preflight"; goto done; }
  }

  failure_phase = PHASE_PUBLICATION;
  if ((flags & FLAG_TEST_CREATE_FIRST_DESTINATION) && operation_count > 0) {
    struct operation *op = &operations[0];
    int fd = openat(parents[op->parent_index].fd, basename_of(op->path), O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW, 0644);
    if (fd >= 0) { (void)write_all(fd, (const unsigned char *)"concurrent destination\n", 23); close(fd); }
  }
  for (uint32_t i = 0; i < operation_count; ++i) {
    failure_operation = i;
    struct parent *parent = &parents[operations[i].parent_index];
    if (!parent_reachable(root_fd, parent)) { failure_errno = ESTALE; failure_message = "destination parent changed during write"; goto done; }
    publication_started = 1;
    if (publish(parent, &operations[i], (flags & FLAG_TEST_FAIL_TEMP_WRITE) != 0) < 0) { failure_errno = errno; failure_message = errno == EEXIST ? "destination appeared after preflight" : "publication failed"; goto done; }
    if (!parent_reachable(root_fd, parent)) { failure_errno = ESTALE; failure_message = "destination parent changed during write"; goto done; }
  }
  result = 0;

done:
  if (parents != NULL) for (size_t i = 0; i < parent_count; ++i) { if (parents[i].fd >= 0) close(parents[i].fd); free(parents[i].path); }
  free(parents);
  if (root_fd >= 0) close(root_fd);
  if (result != 0 && !publication_started) cleanup_created(created, created_count);
  else { for (size_t i = 0; i < created_count; ++i) { if (created[i].parent_fd >= 0) close(created[i].parent_fd); free(created[i].name); } free(created); }
  if (operations != NULL) {
    uint32_t count = frame_length >= HEADER_SIZE ? get_u32(frame + 36) : 0;
    if (count > MAX_OPERATIONS) count = MAX_OPERATIONS;
    for (uint32_t i = 0; i < count; ++i) free(operations[i].path);
    free(operations);
  }
  free(frame);
  return respond(result, result == 0 ? PHASE_CLEANUP : failure_phase, failure_operation,
                 result == 0 ? 0 : failure_errno, publication_started,
                 result == 0 ? NULL : failure_message);
}
