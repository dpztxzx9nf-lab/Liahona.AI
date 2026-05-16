Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

param(
  [int] $Port = 4177
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$Node = Get-Command node -ErrorAction SilentlyContinue

if (-not $Node) {
  throw "Node.js is required for local preview. No files were changed."
}

$Server = @'
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = Number(process.argv[1]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".md": "text/plain; charset=utf-8"
};

function resolvePath(requestUrl) {
  const url = new URL(requestUrl, `http://127.0.0.1:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const resolved = path.resolve(root, requested);

  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    return null;
  }

  return resolved;
}

http.createServer((request, response) => {
  const filePath = resolvePath(request.url);

  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(data);
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`Liahona.AI preview: http://127.0.0.1:${port}`);
  console.log("Press Ctrl+C to stop.");
});
'@

Write-Host "Starting local preview from $RepoRoot" -ForegroundColor Cyan
node -e $Server $Port
