import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");

const buildInputs = ["index.html", "favicon.ico", "assets", "css", "js"];

async function copyRecursive(sourcePath, destinationPath) {
  const sourceStats = await stat(sourcePath);

  if (sourceStats.isDirectory()) {
    await mkdir(destinationPath, { recursive: true });
    const entries = await readdir(sourcePath);

    for (const entry of entries) {
      await copyRecursive(path.join(sourcePath, entry), path.join(destinationPath, entry));
    }

    return;
  }

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await copyFile(sourcePath, destinationPath);
}

async function ensureInputExists(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);

  try {
    await stat(absolutePath);
  } catch {
    throw new Error(`Missing build input: ${relativePath}`);
  }
}

async function buildDist() {
  for (const input of buildInputs) {
    await ensureInputExists(input);
  }

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  for (const input of buildInputs) {
    const sourcePath = path.join(rootDir, input);
    const destinationPath = path.join(distDir, input);
    await copyRecursive(sourcePath, destinationPath);
  }

  console.log("Build complete: dist/");
}

buildDist().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
