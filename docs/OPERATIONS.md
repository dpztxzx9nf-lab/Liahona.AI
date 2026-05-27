# Liahona Operations

This document is the operational handoff for `C:\Projects\Liahona`.

## Inventory

- Project: Liahona.AI
- Type: Node.js Discord/OpenAI runtime
- Entrypoint: `index.js`
- GitHub: connected through `origin`
- PM2 process: `liahona`
- Default HTTP keepalive port: `3000`, unless `PORT` is set in the environment
- Local health response: `GET /` returns `Liahona is alive.`
- Runtime logs: `logs/runtime.jsonl`
- PM2 logs: `C:\Users\Golf\.pm2\logs\liahona-out.log` and `C:\Users\Golf\.pm2\logs\liahona-error.log`

## Commands

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Development mode | `npm run dev` |
| Production without PM2 | `npm start` |
| Start existing PM2 workflow | `npm run pm2:start` |
| Start from ecosystem file | `pm2 start ecosystem.config.cjs` |
| Restart PM2 process | `npm run pm2:restart` |
| Stop PM2 process | `npm run pm2:stop` |
| Delete PM2 process entry | `npm run pm2:delete` |
| PM2 logs | `npm run pm2:logs` |
| PM2 status | `npm run pm2:status` |
| Save PM2 process list | `npm run pm2:save` |
| Reset runtime data | `npm run data:reset` |

## Runtime Configuration

Runtime configuration is environment-driven. Do not print or commit environment values.

Known environment keys:

- `DISCORD_TOKEN`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `PORT`
- `DEV_PORTAL_TOKEN`

If `DISCORD_TOKEN` is missing, the Express keepalive server can still start, but the Discord client will not log in.

If `OPENAI_API_KEY` is missing, replies use local fallbacks.

If `PORT` is missing, the runtime defaults to `3000`.

## PM2 Layout

Current package scripts start the runtime directly:

```powershell
npm run pm2:start
```

The standardized ecosystem file is:

```text
C:\Projects\Liahona\ecosystem.config.cjs
```

It defines the same PM2 process name, entrypoint, and working directory:

- name: `liahona`
- script: `index.js`
- cwd: `C:/Projects/Liahona`
- watch: disabled
- autorestart: enabled

Use the ecosystem file when rebuilding PM2 state from scratch:

```powershell
cd C:\Projects\Liahona
pm2 delete liahona
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
```

Do not run the delete command unless you have confirmed the current PM2 state and are intentionally rebuilding it.

## Windows Reboot Persistence

Liahona currently relies on PM2 resurrection after Windows logon. The existing docs reference `pm2-windows-startup`.

Expected setup:

```powershell
npm install pm2 -g
npm install pm2-windows-startup -g
pm2-startup install
pm2 save
```

Verify the scheduled task from a normal user PowerShell session:

```powershell
Get-ScheduledTask | Where-Object {
  ($_.Actions.Execute + ' ' + $_.Actions.Arguments) -match 'pm2' -and
  ($_.Actions.Execute + ' ' + $_.Actions.Arguments) -match 'resurrect'
} | Select-Object TaskName,TaskPath,State
```

Fallback:

```powershell
schtasks /Query /FO LIST /V | Select-String -Pattern 'PM2|pm2|resurrect|liahona'
```

## Verification

Run from a normal user PowerShell session:

```powershell
cd C:\Projects\Liahona
git status --short --branch
npm run test:interpret
npm run test:continuity
npm run test:themes
npm run test:canonical
npm run test:canonical-sources
npm run test:projection
pm2 status
pm2 save
netstat -ano | Select-String -Pattern ':3000'
```

Optional local HTTP check:

```powershell
curl.exe -s http://127.0.0.1:3000/
```

Expected body:

```text
Liahona is alive.
```

## Dirty Worktree Notes

The previously observed dirty files were local workspace/editor artifacts:

- `.obsidian/`
- `.verb.md`
- `Untitled.canvas`

These are ignored by `.gitignore` after this standardization. Do not delete them unless the owner explicitly asks.

## Do Not Touch Casually

- `.env`
- `index.js`
- `src/runtime/`
- `src/interpretive/`
- `src/execution/`
- `src/projection/discord/`
- `src/ports/`
- `package-lock.json`
- `data/`
- `logs/`
- `docs/Eternal Sources/`
- `legacy-archive/`
- PM2 process state and Windows startup tasks
