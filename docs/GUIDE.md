# Liahona Guide

Liahona is currently a lightweight Discord bot with a small runtime flow:

`message -> interpretMessage -> generateReply -> sendMessage`

It has no memory, embeddings, retrieval, source ingestion, or database-backed runtime yet.

## Why Liahona?

Liahona is intended to be an orienting conversational presence for KINDEX.
The name is inspired by the symbolic meaning of the Liahona in scripture. It should not be presented as divine, prophetic, authoritative, or revelatory.

> **Liahona**
>
> In the Book of Mormon, a brass ball with two pointers that gave directions&mdash;as a compass&mdash;and also spiritual instruction to Lehi and his followers when they were righteous. The Lord provided the Liahona and gave instructions through it.
>
> Lehi found a brass ball with two spindles that pointed the way that Lehi and his family should go, 1 Ne. 16:10.
>
> The ball worked according to faith and diligence, 1 Ne. 16:28&ndash;29 (Alma 37:40).
>
> Benjamin gave the ball to Mosiah, Mosiah 1:16.
>
> The ball or director was called the Liahona, Alma 37:38.
>
> The Liahona was compared to the word of Christ, Alma 37:43&ndash;45.
>
> The Three Witnesses of the Book of Mormon are to see the director given to Lehi, D&C 17:1.
>
> &mdash; Guide to the Scriptures

The name reflects direction, grounding, judgment, continuity, and guidance through context rather than constant output. Liahona should remain restrained, truthful, non-authoritative, and human-built.

## Intended Channel Behavior

These are planning notes for future tuning. They do not describe advanced behavior that exists today.

- Regular channels: mostly human space; Liahona should rarely speak unless directly useful.
- Showcase channels: light acknowledgment, usually brief and encouraging.
- Journal channels: intermittent connective reflection later, once memory and scheduling exist.
- Forums: structured synthesis later, especially across threads and replies.
- DMs: personal interaction now, with possible future digest delivery.

The current runtime still uses the simple message flow above. Future channel-specific behavior should be added incrementally and should preserve existing Discord login, generation, and delivery flow unless there is a clear reason to change it.

## Daily Workflow

Use PM2 for normal operation and `npm run dev` only while actively editing.

Before renaming or deleting project folders, stop PM2, Node, VS Code terminals, and any File Explorer windows using the project. Windows can keep handles open and block moves, deletes, or installs.

## Windows PM2 Setup

Run once on the machine:

```powershell
npm install pm2 -g
npm install pm2-windows-startup -g
pm2-startup install
npm run pm2:start
npm run pm2:save
```

## Commands

Start with Node:

```powershell
npm start
```

Start with PM2:

```powershell
npm run pm2:start
```

Restart after code or environment changes:

```powershell
npm run pm2:restart
```

Stop:

```powershell
npm run pm2:stop
```

View logs:

```powershell
npm run pm2:logs
```

Save the PM2 process list:

```powershell
npm run pm2:save
```

Check PM2 status:

```powershell
npm run pm2:status
```

Delete the PM2 process entry:

```powershell
npm run pm2:delete
```

Reset runtime data safely:

```powershell
npm run data:reset
```

This only clears runtime files inside `data/` and preserves `.gitkeep`.

## Observability And Safe Debugging

Check PM2 logs:

```powershell
pm2 logs liahona
pm2 logs liahona --lines 50
pm2 logs liahona --err
pm2 logs liahona --out
```

Stop log tailing with `Ctrl+C`.

Raw PM2 logs live at:

- `C:\Users\Golf\.pm2\logs\liahona-out.log`
- `C:\Users\Golf\.pm2\logs\liahona-error.log`

Lifecycle logs mark each message stage:

- `MESSAGE_RECEIVED`: Discord delivered a message event to the bot.
- `INTERPRETATION_RESULT`: judgment classified the message and decided whether to respond.
- `GENERATION_RESULT`: reply generation succeeded or failed.
- `DELIVERY_RESULT`: Discord reply delivery succeeded or failed.

These logs help diagnose whether failures come from judgment, generation, Discord delivery, permissions, DM routing, or channel/thread handling.

## Updating the Liahona.AI Website

The site files live at:

- `C:\Projects\Liahona.AI\index.html`
- `C:\Projects\Liahona.AI\style.css`

`index.html` controls content, layout, and sections.
`style.css` controls colors, spacing, and visual design.

Safe update workflow:

```powershell
cd C:\Projects\Liahona.AI
git status
git add index.html style.css
git commit -m "Update site"
git push origin main
```

GitHub Pages auto-deploys from `main` and the repository root. Updates may take 1-2 minutes to appear.

Live site: https://dpztxzx9nf-lab.github.io/Liahona.AI/

## What Not To Delete

Do not delete `src/`, `docs/`, `scripts/`, `package.json`, `package-lock.json`, `.env`, `.env.example`, `node_modules/`, or project folders while processes are using them.

## Troubleshooting

If the bot does not come online, check `DISCORD_TOKEN` in `.env`, then run:

```powershell
npm run pm2:logs
```

If code changes do not appear, restart PM2:

```powershell
npm run pm2:restart
```

If PM2 does not restore after reboot, rerun the Windows startup setup and save the process list again.

If file operations fail on Windows, close terminals, stop PM2, close VS Code and File Explorer windows that point at the project, then retry.

## Data Planning

Future data scopes are documented in [DATA.md](DATA.md). That file is planning only. It does not define schemas, memory behavior, retrieval, or ingestion.

## Current Development Priorities

- Keep runtime behavior lightweight and easy to inspect.
- Preserve direct-answer-first conversation.
- Keep internal runtime structure out of visible replies.
- Add operational safety before adding memory.
- Scope future data before implementing storage or retrieval.
