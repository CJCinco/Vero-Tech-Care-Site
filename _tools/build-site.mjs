import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repoRoot, "dist");

const publicNames = new Set([
  "_headers",
  "_redirects",
  "_routes.json",
  "robots.txt",
  "sitemap.xml"
]);

const publicExtensions = new Set([
  ".css",
  ".html",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".pdf",
  ".png",
  ".svg",
  ".webp"
]);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const entries = await readdir(repoRoot, { withFileTypes: true });
const copiedFiles = [];

for (const entry of entries) {
  if (!entry.isFile()) continue;
  if (!publicNames.has(entry.name) && !publicExtensions.has(path.extname(entry.name).toLowerCase())) {
    continue;
  }

  await cp(path.join(repoRoot, entry.name), path.join(outputDirectory, entry.name));
  copiedFiles.push(entry.name);
}

if (!copiedFiles.includes("index.html")) {
  throw new Error("Build failed: index.html was not copied.");
}

if (!copiedFiles.includes("_headers") || !copiedFiles.includes("_redirects")) {
  throw new Error("Build failed: Cloudflare routing files were not copied.");
}

console.log(`Built ${copiedFiles.length} public files in dist/.`);
