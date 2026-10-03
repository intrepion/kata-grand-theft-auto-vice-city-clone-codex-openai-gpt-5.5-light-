import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const fileDir = path.resolve("dist-file");

await rm(fileDir, { force: true, recursive: true });
await mkdir(fileDir, { recursive: true });
await cp(distDir, fileDir, { recursive: true });

const builtHtmlPath = await findFirstHtml(fileDir);
if (!builtHtmlPath) {
  throw new Error(`No HTML file found in ${fileDir}`);
}
const html = await readFile(builtHtmlPath, "utf8");
const scriptMatches = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)];
const styleMatches = [...html.matchAll(/<link[^>]+href="([^"]+)"[^>]*>/g)];

let directHtml = html;

for (const match of scriptMatches) {
  const assetPath = path.join(distDir, match[1].replace(/^\//, ""));
  const source = await readFile(assetPath, "utf8");
  const encoded = Buffer.from(source).toString("base64");
  directHtml = directHtml.replace(
    match[0],
    `<script type="module">import("data:text/javascript;base64,${encoded}");</script>`
  );
}

for (const match of styleMatches) {
  const assetPath = path.join(distDir, match[1].replace(/^\//, ""));
  const source = await readFile(assetPath, "utf8");
  directHtml = directHtml.replace(match[0], `<style>\n${source}\n</style>`);
}

const indexPath = path.join(fileDir, "index.html");
await writeFile(indexPath, directHtml);
await writeFile(path.join(distDir, "index.html"), directHtml);
await writeFile(path.resolve("index.html"), directHtml);

async function findFirstHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const found = await findFirstHtml(entryPath);
      if (found) return found;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      return entryPath;
    }
  }
  return null;
}
