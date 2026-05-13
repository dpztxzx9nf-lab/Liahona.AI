# Deployment Workflow

Liahona.AI deploys through GitHub Pages from the `main` branch.

Safe update workflow:

```powershell
cd C:\Projects\Liahona.AI
git status
git fetch origin
git add index.html style.css script.js src docs
git commit -m "Update site"
git push origin main
```

GitHub Pages usually updates within a few minutes after push.

Do not force push unless there is a specific recovery reason.

Do not delete `README.md`, site assets, or data files as part of normal deployment.
