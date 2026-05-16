# Hidden Dev Portal Foundation

The hidden Liahona.AI dev portal exists to preserve human-readable continuity, provenance, grounding, and operational understanding behind Liahona.AI.

It is not the public experience. It is the protected continuity layer behind the public surface.

## Public Front End vs Hidden Dev Portal

The public front end should be calm, minimal, and user-facing.

The hidden dev portal should be practical, private, and operational.

Public front end:
- presents the Liahona experience
- orients users
- avoids exposing internal machinery

Hidden dev portal:
- preserves implementation history
- summarizes runtime behavior
- tracks source grounding
- records continuity checkpoints
- helps humans understand and recover the system

## Continuity And Provenance

The portal should answer:
- what changed
- why it changed
- where it came from
- what evidence supports it
- what remains unresolved
- how to recover or continue safely

It should preserve continuity through summaries, provenance notes, links to commits, source references, runtime observations, and implementation records.

## Relationship To KINDEX

KINDEX is the human continuity layer.

The hidden dev portal should not replace KINDEX. It should help Liahona stay aware of the project’s operational and architectural continuity while KINDEX preserves broader human context, conversations, and lived history.

KINDEX grounds human continuity. The dev portal organizes project continuity.

## Relationship To Tools

Git is the recovery and history layer.

Cursor and VS Code are implementation workspaces.

Codex, Claude, and other AI tools are assistants for bounded work, synthesis, and review.

The dev portal may summarize outputs from these tools, but it should not treat any tool as authority. Human review remains responsible for governance, deployment, source judgment, and final decisions.

## Source Grounding

The portal should preserve source clarity.

It should distinguish:
- canonical sources
- interpretive project notes
- runtime observations
- AI-generated summaries
- operational logs
- human decisions

Source grounding means the portal should show where claims came from and what authority they carry.

## Implementation History

The portal should help future maintainers understand:
- major architecture changes
- runtime behavior changes
- deployment checkpoints
- failures and recoveries
- observability findings
- source and governance updates
- decisions that should not be lost

It should summarize meaningful change, not preserve every noisy detail.

## Observability And Privacy

The portal may display summaries from local logs or runtime diagnostics, but it should remain privacy-aware.

It should prefer metadata and summaries over raw user content.

It should not expose:
- secrets
- `.env` values
- private message content
- raw credentials
- public dashboards of sensitive logs
- user profiling or surveillance views

Observability exists to support debugging, continuity awareness, and recovery.

## What It Must Never Become

The hidden dev portal must never become:
- a public admin dashboard
- a surveillance system
- a replacement for Git history
- a replacement for KINDEX
- a replacement for human judgment
- a secret source of doctrine or authority
- an uncontrolled memory store
- a place where logs become user profiling
- a feature factory that increases complexity without purpose

## Guardrail Question

Before adding anything to the portal, ask:

Does this preserve autonomy, clarity, precision, continuity, or grounding?

If not, it probably does not belong.
