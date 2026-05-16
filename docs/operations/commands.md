# Operational Commands

Run these from Windows PowerShell.

```powershell
cd C:\Projects\Liahona.AI
```

## Safe Operations Layer

The repository includes a minimal PowerShell layer in `ops\`.

Read-only status:

```powershell
.\ops\status.ps1
```

Static checks:

```powershell
.\ops\check.ps1
```

Local preview:

```powershell
.\ops\serve.ps1
```

Then open:

```text
http://127.0.0.1:4177
```

Use a different port if needed:

```powershell
.\ops\serve.ps1 -Port 4180
```

Stop the preview server with `Ctrl+C`.

## Safety Boundaries

These scripts are intentionally narrow.

They do not:

- Delete files.
- Reset Git state.
- Commit changes.
- Push to GitHub.
- Install dependencies.
- Deploy the site.
- Modify the canonical artifact image.

They do:

- Report Git status.
- Check the current public surface.
- Verify `src\artifact.js` syntax.
- Run `git diff --check`.
- Verify that `index.html` still references `style.css`, `src\artifact.js`, the canonical artifact image, and the Continuity Device.
- Serve the static site locally from `127.0.0.1`.

## Manual Git Commands

Review the working tree:

```powershell
git status --short
git diff --stat
git diff --check
```

Create a checkpoint only after checks pass:

```powershell
git add index.html style.css src docs ops
git commit -m "Describe change"
```

Push only when the checkpoint is intentional:

```powershell
git push origin main
```

The live site is:

```text
https://dpztxzx9nf-lab.github.io/Liahona.AI/
```
