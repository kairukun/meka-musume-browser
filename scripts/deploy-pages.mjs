import { execSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = "https://github.com/kairukun/meka-musume-browser.git";
const BASE = "/meka-musume-browser/";

process.env.VITE_BASE = BASE;
console.log(`Building with base ${BASE}…`);
execSync("npm run build", { stdio: "inherit", env: process.env });

const dir = mkdtempSync(join(tmpdir(), "meka-pages-"));
try {
  cpSync("dist", dir, { recursive: true });
  writeFileSync(join(dir, ".nojekyll"), "");
  const git = (cmd) => execSync(cmd, { cwd: dir, stdio: "inherit" });
  git("git init -b gh-pages");
  git('git -c user.name="kairukun" -c user.email="kairukun@users.noreply.github.com" add -A');
  git(
    'git -c user.name="kairukun" -c user.email="kairukun@users.noreply.github.com" commit -m "Deploy GitHub Pages"',
  );
  git(`git remote add origin ${REPO}`);
  git("git push -f origin gh-pages");
  console.log(`Live: https://kairukun.github.io${BASE}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
