# Liahona Agent Notes

Liahona is a Node.js Discord/OpenAI runtime with supporting governance, continuity, and source documentation.

## Boundaries

- Do not change product/runtime behavior unless the task explicitly asks for it.
- Do not expose `.env`, Discord tokens, OpenAI keys, dev portal tokens, PM2 environment dumps, logs with sensitive content, or credential files.
- Do not delete `data/`, `logs/`, `legacy-archive/`, `docs/Eternal Sources/`, or runtime files without explicit owner approval.
- Treat governance docs in `core/` as active project direction. Treat `legacy-archive/` as historical reference, not active governance.
- Treat untracked `.obsidian/`, `.verb.md`, and `*.canvas` files as local workspace/editor artifacts unless the owner says otherwise.

## Runtime

- Entrypoint: `index.js`
- Development command: `npm run dev`
- Production command: `npm start`
- Default HTTP keepalive port: `3000`, unless `PORT` is set in the environment.
- PM2 process name: `liahona`

## PM2

- Existing package workflow:
  - `npm run pm2:start`
  - `npm run pm2:restart`
  - `npm run pm2:stop`
  - `npm run pm2:logs`
  - `npm run pm2:save`
  - `npm run pm2:status`
- Standardized ecosystem file: `ecosystem.config.cjs`
- PM2 persistence depends on saving the intended process list with `pm2 save`.

## Windows Persistence

This project currently relies on PM2 resurrection at Windows logon, usually through `pm2-windows-startup`.

Before changing persistence:

```powershell
pm2 status
pm2 save
Get-ScheduledTask | Where-Object {
  ($_.Actions.Execute + ' ' + $_.Actions.Arguments) -match 'pm2' -and
  ($_.Actions.Execute + ' ' + $_.Actions.Arguments) -match 'resurrect'
}
```

## Verification

Safe checks:

```powershell
npm run test:interpret
npm run test:continuity
npm run test:themes
npm run test:canonical
npm run test:canonical-sources
npm run test:projection
npm run pm2:status
```

If `pm2` is not on PATH in the current shell, report that and verify from the owner's normal PowerShell session.
