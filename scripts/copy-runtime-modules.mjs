import fs from "node:fs";
import path from "node:path";

const nodeModules = path.resolve("node_modules");
const dest = process.env.RUNTIME_MODULES_DIR || "/opt/runtime-modules";
const roots = ["prisma", "pg", "@prisma/adapter-pg", "dotenv"];

function packageDir(name) {
  return path.join(nodeModules, ...name.split("/"));
}

function dependenciesOf(name) {
  const pkgFile = path.join(packageDir(name), "package.json");
  if (!fs.existsSync(pkgFile)) return [];
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
  return Object.keys(pkg.dependencies ?? {});
}

const needed = new Set();

function visit(name) {
  if (needed.has(name)) return;
  if (!fs.existsSync(packageDir(name))) return;
  needed.add(name);
  for (const dep of dependenciesOf(name)) visit(dep);
}

for (const root of roots) visit(root);

if (fs.existsSync(path.join(nodeModules, "@prisma"))) {
  for (const entry of fs.readdirSync(path.join(nodeModules, "@prisma"))) {
    visit(`@prisma/${entry}`);
  }
}

fs.mkdirSync(dest, { recursive: true });
for (const name of needed) {
  const from = packageDir(name);
  const to = path.join(dest, ...name.split("/"));
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

console.log(`Copied ${needed.size} packages to ${dest}`);
