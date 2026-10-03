import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const fileDir = path.resolve("dist-file");

await rm(fileDir, { force: true, recursive: true });
await mkdir(fileDir, { recursive: true });
await cp(distDir, fileDir, { recursive: true });

const indexPath = path.join(fileDir, "index.html");
const html = await readFile(indexPath, "utf8");
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

await writeFile(indexPath, directHtml);
