# Security Foundation

Security protects continuity.

Liahona.AI depends on trust, recoverability, source clarity, and careful operational boundaries. Security is not a separate feature layer; it preserves the conditions that let the system continue safely over time.

## Secrets And Environment Boundaries

Secrets belong outside the repository.

Do not commit:
- `.env`
- API keys
- Discord tokens
- OpenAI credentials
- deployment secrets
- local machine credentials

Environment files should remain local, ignored by Git, and documented only through safe examples or setup notes. Runtime code may read secrets, but documentation and logs should not expose them.

## Git As Recovery Layer

Git is the primary recovery layer for code and documentation.

Use Git to preserve:
- known-good states
- architecture checkpoints
- rollback paths
- implementation history
- recovery after experiments

Security incidents, broken deployments, or accidental changes should be recoverable through clear commits and careful review.

## Hidden Dev Portal Protection

Any future hidden dev portal should be treated as sensitive operational infrastructure.

It should start as read-only and private. It should not expose raw secrets, private message content, environment variables, admin controls, or public dashboards.

Access should be explicit, narrow, and easy to revoke.

## AI Tooling Boundaries

AI tools assist implementation and review. They should not become authority over secrets, production access, deployment decisions, or governance.

Do not paste secrets into AI tools. Do not grant broad access when a narrow task is enough. Treat AI-generated changes as proposals that require human review before deployment.

## Observability And Privacy

Observability should explain runtime behavior without over-preserving sensitive content.

Prefer metadata-first logs:
- event name
- timestamp
- runtime session
- success/failure
- reason
- message or projection identifiers

Avoid storing full user content by default, especially in DMs or sensitive channels. Logs should support debugging and continuity awareness, not surveillance or user profiling.

## Deployment Safety

Deployment should remain boring and recoverable.

Before changing deployment behavior:
- understand the current PM2/runtime state
- preserve `.env` boundaries
- avoid changing unrelated files
- keep rollback simple
- verify startup and basic Discord behavior
- check logs after restart

Do not combine deployment changes with unrelated architecture or documentation cleanup.

## Recovery Philosophy

A secure system is one that can recover.

Prefer:
- small changes
- clear commits
- local backups where appropriate
- explicit status docs
- readable logs
- simple rollback paths

Avoid:
- hidden complexity
- undocumented credentials
- irreversible cleanup
- broad permissions
- coupling security to memory or analytics systems

The goal is continuity with restraint: preserve what matters, protect what is sensitive, and keep the system understandable enough to repair.
