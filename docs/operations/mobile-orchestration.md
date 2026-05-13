# Mobile Orchestration Workflow

This note describes a future operating pattern where the PC remains the guarded execution and storage node, while the phone becomes a safe orchestration interface through ChatGPT, Codex, GitHub, and Liahona.AI.

## PC Role

The PC remains the execution infrastructure.

- Local development environment.
- Runtime and storage node.
- PM2 process host.
- File system source of truth when needed.

The PC should continue to hold risky operations behind explicit approval and visible checkpoints.

## Phone Role

The phone becomes the light orchestration surface.

- Idea capture.
- ChatGPT planning.
- Codex prompt orchestration.
- GitHub and Codex review.
- Continuity navigation through Liahona.AI.

The phone can guide, review, and approve work without becoming the runtime host.

## Workflow Principle

The phone can guide and approve work.

The PC remains guarded execution infrastructure.

Do not automate risky runtime or deployment actions yet.

This protects local files, PM2 processes, environment settings, tokens, and deployment state while still allowing mobile-first planning and continuity review.

## Future Direction

Near-term direction:

- Semi-remote workflow first.
- Remote approval before automation.
- GitHub-backed checkpoints.
- Clear review steps before runtime changes.

Later direction:

- Deployment/status visibility inside Liahona.AI.
- Safer continuity views for recent commits, checks, and operational state.
- Explicit approval surfaces before any restart, deployment, or persistent runtime change.

The goal is orchestration without turning the phone into an unsafe deployment console.
