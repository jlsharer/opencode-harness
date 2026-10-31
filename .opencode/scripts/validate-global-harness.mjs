import fs from "node:fs";
import path from "node:path";
import { globalManifest } from "../../bin/global-harness.mjs";
export function validateGlobalHarness(root = process.cwd()) {
    const manifest = globalManifest(root);
    for (const asset of manifest.assets) {
        const target = path.join(root, asset.source);
        const stat = fs.lstatSync(target);
        if (!stat.isFile() || stat.isSymbolicLink())
            throw new Error("invalid global asset: " + asset.source);
    }
    for (const [directory, expected] of [
        ["agents", 4],
        ["commands", 5],
    ]) {
        if (manifest.assets.filter((a) => a.discovery?.startsWith(directory + "/")).length !== expected)
            throw new Error("global discovery count mismatch: " + directory);
    }
    if (manifest.assets.filter((a) => a.discovery?.endsWith("/SKILL.md")).length !== 4)
        throw new Error("global skills incomplete");
    const indexed = new Set(manifest.assets.map((a) => a.release));
    const visited = new Set();
    function closure(relative) {
        if (visited.has(relative))
            return;
        visited.add(relative);
        if (!indexed.has(relative))
            throw new Error("global import missing from manifest: " + relative);
        if (/\/(?:managed-execution|managed-dispatch|v2-native-plugin|trace-root-permissions|harness-lifecycle|role-model-routing-enforcement)\.js$/.test(relative))
            throw new Error("broad guard in global closure: " + relative);
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        for (const match of text.matchAll(/(?:from\s*|import\s*\()\s*["'](\.[^"']+)["']/g)) {
            closure(path.posix.normalize(path.posix.join(path.posix.dirname(relative), match[1])));
        }
    }
    closure(".opencode/plugin-modules/global-native-plugin.js");
    closure(".opencode/plugin-modules/global-utilities.js");
    return {
        profile: manifest.profile,
        assetCount: manifest.assets.length,
        importClosure: [...visited].sort(),
    };
}
if (process.argv[1]?.endsWith("validate-global-harness.mjs"))
    console.log(JSON.stringify(validateGlobalHarness(process.argv[2] ?? process.cwd())));
