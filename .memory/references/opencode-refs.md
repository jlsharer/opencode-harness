# OpenCode Documentation References

Retrieval date: 2026-07-05

These URLs are the OpenCode documentation inventory used by this harness projection. Short descriptions are implementation notes from the delegated research evidence.

## Core

- https://opencode.ai/docs - Intro, install, initialize, basic usage, AGENTS.md creation.
- https://opencode.ai/docs/config - JSON/JSONC config, config locations, schema, plugins, instructions, permissions, compaction.
- https://opencode.ai/docs/providers - Provider credentials, provider config, local/remote model providers.
- https://opencode.ai/docs/network - Network/proxy/connectivity configuration.
- https://opencode.ai/docs/enterprise - Enterprise/organization configuration.
- https://opencode.ai/docs/troubleshooting - Common failures and fixes.
- https://opencode.ai/docs/windows-wsl - Recommended Windows setup via WSL.

## Usage

- https://opencode.ai/docs/go - OpenCode Go subscription/model access.
- https://opencode.ai/docs/tui - Terminal UI usage.
- https://opencode.ai/docs/cli - CLI commands, flags, environment variables.
- https://opencode.ai/docs/web - Web client/server usage.
- https://opencode.ai/docs/ide/ - IDE extension/integration.
- https://opencode.ai/docs/zen/ - OpenCode Zen model/provider service.
- https://opencode.ai/docs/share/ - Session sharing.
- https://opencode.ai/docs/github/ - GitHub Action/app integration.
- https://opencode.ai/docs/gitlab/ - GitLab integration.

## Configure

- https://opencode.ai/docs/tools - Built-in tool behavior.
- https://opencode.ai/docs/rules - AGENTS.md and custom instructions.
- https://opencode.ai/docs/agents - Primary agents, subagents, frontmatter/config fields.
- https://opencode.ai/docs/models/ - Model selection/configuration.
- https://opencode.ai/docs/themes/ - Theme configuration.
- https://opencode.ai/docs/keybinds/ - TUI keybind configuration.
- https://opencode.ai/docs/commands - Custom slash command files/config.
- https://opencode.ai/docs/formatters/ - Formatter configuration.
- https://opencode.ai/docs/permissions - Permission actions and granular rules.
- https://opencode.ai/docs/policies/ - Experimental policy configuration.
- https://opencode.ai/docs/lsp/ - LSP server configuration.
- https://opencode.ai/docs/mcp-servers - MCP server configuration.
- https://opencode.ai/docs/acp/ - ACP editor integration.
- https://opencode.ai/docs/skills - Agent skill layout and frontmatter.
- https://opencode.ai/docs/references - External local/Git references in config.
- https://opencode.ai/docs/custom-tools - Custom tool definitions.

## Develop

- https://opencode.ai/docs/sdk/ - JS/TS SDK.
- https://opencode.ai/docs/server/ - HTTP server/API.
- https://opencode.ai/docs/plugins - Local/npm plugins, hooks, event list.
- https://opencode.ai/docs/ecosystem/ - Community ecosystem/projects/plugins.

## Harness Implementation Notes

- Local project plugins belong in `.opencode/plugins/` and are automatically loaded at startup.
- `opencode.json` `plugin` entries are for npm packages, not local file paths.
- Plugin modules export plugin functions that receive context and return hooks. Hooks run in sequence.
- Agents can be Markdown files under `.opencode/agents/`; `description` is required and frontmatter supports `mode`, `model`, `temperature`, and `permission`.
- Commands can be Markdown files under `.opencode/commands/`; frontmatter defines properties and the body is a template.
- Skills live at `.opencode/skills/<name>/SKILL.md`; `name` and `description` are required.
- OpenCode custom instructions use `AGENTS.md`; `opencode.json` supports native `instructions` and `references` entries.
- No official native `.memory` directory protocol was found. This harness implements `.memory` as project-owned memory and exposes it through project instructions.
- `.opencode/plugins/index.js` is the only local plugin file in the auto-loaded plugin directory. It is a pure adapter for segmented plugin logic in `.opencode/plugin-modules/harness-lifecycle.js` and is not listed as a local path in `opencode.json`.
