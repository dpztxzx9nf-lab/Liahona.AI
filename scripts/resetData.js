const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const dataDir = path.join(projectRoot, "data");
const preserved = new Set([".gitkeep"]);

function isInsideData(targetPath) {
  const relative = path.relative(dataDir, targetPath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function collectRuntimeFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (!isInsideData(fullPath)) {
      throw new Error(`Refusing to touch path outside data: ${fullPath}`);
    }

    if (entry.isDirectory()) {
      files.push(...collectRuntimeFiles(fullPath));
      continue;
    }

    if (entry.isFile() && !preserved.has(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir) || path.resolve(dir) === dataDir) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      removeEmptyDirs(path.join(dir, entry.name));
    }
  }

  if (fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}

const files = collectRuntimeFiles(dataDir);

if (files.length === 0) {
  console.log("No runtime data found.");
  process.exit(0);
}

for (const file of files) {
  fs.unlinkSync(file);
  console.log(`Deleted ${path.relative(projectRoot, file)}`);
}

for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
  if (entry.isDirectory()) {
    removeEmptyDirs(path.join(dataDir, entry.name));
  }
}
