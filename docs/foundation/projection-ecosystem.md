# Projection Ecosystem

This document defines how the current Liahona projection surfaces should eventually coexist in one coherent website architecture.

It is design guidance only. It does not change routes, rewrite frontends, or implement integration.

## Current Projections

### Public Liahona.AI Projection

URL: `https://dpztxzx9nf-lab.github.io/Liahona.AI/`

Role:
- public-facing Liahona.AI presence
- orientation surface
- project identity and experience direction
- eventual home for the main public artifact experience

This surface should stay calm, minimal, and public-safe.

### Omma Artifact Prototype

URL: `https://omma.build/p/cosmic-artifact-interactive-experience-d-iphwcg`

Role:
- interactive artifact prototype
- visual and experiential exploration
- candidate source for future public interaction patterns

This is not production architecture yet. Treat it as design evidence and prototype material.

### Private Dev Continuity Portal

URL: `http://localhost:3000/dev`

Role:
- private operational continuity view
- runtime observability surface
- architecture/status/continuity reader
- local tool for debugging and development understanding

This is private infrastructure and should remain read-only, local/private, and non-public.

## Public vs Private Boundaries

Public surfaces may show:
- project identity
- public orientation
- carefully curated source grounding
- public continuity summaries
- artifact interaction
- non-sensitive project history

Private surfaces may show:
- local runtime status
- operational logs
- implementation checkpoints
- failure summaries
- private development notes
- diagnostic metadata

Private surfaces must not leak into public projection.

## Runtime, Continuity, Projection

Runtime:
- Discord/OpenAI bot
- Express server
- logging and diagnostics
- message handling and delivery

Continuity:
- curated checkpoints
- operational summaries
- provenance
- architecture/status records
- meaningful project evolution

Projection:
- how meaning is surfaced to humans
- public artifact experience
- private dev continuity view
- future source cards or public summaries

The dev portal is a private projection over runtime and continuity. The public website is a public projection over identity, orientation, and curated continuity.

## Future Route Structure

Possible future structure:

- `/`
  - public Liahona.AI landing/orientation
- `/artifact`
  - public artifact interaction
- `/sources`
  - public-safe source grounding
- `/continuity`
  - curated public continuity summaries
- `/dev`
  - private read-only dev continuity portal

These are future design directions, not current routes.

## What Stays Separate

Keep separate:
- public artifact experience and private dev portal
- raw logs and curated continuity
- prototype experiments and production routes
- source references and runtime secrets
- KINDEX human continuity and Liahona operational continuity
- archive material and active governance

Do not merge private diagnostics into the public website.

## Prototype Relationship

The Omma artifact prototype may inform:
- visual language
- interaction patterns
- motion feel
- artifact-centered navigation
- public orientation design

It should not be copied wholesale into production without review for:
- accessibility
- performance
- security
- source grounding
- maintainability
- privacy boundaries

Prototype value is directional, not authoritative.

## Public Continuity

Public continuity should be curated and minimal.

It may show:
- major milestones
- architectural direction
- public project updates
- source-grounded summaries
- non-sensitive evolution

It should not show:
- raw logs
- private operational failures
- private Discord content
- tokens or environment details
- internal debugging traces
- user profiling

Public continuity should explain meaningful evolution without exposing private operations.

## Dev Portal Public Safety

The dev portal must never expose publicly:
- `.env` values
- API keys or tokens
- raw private logs
- raw DM content
- private channel content
- admin controls
- deploy/restart buttons
- write/edit/delete actions
- unreviewed AI summaries of sensitive content
- long-term user memory
- behavioral profiling

The dev portal exists for autonomy, clarity, precision, continuity, and grounding.

## Minimal Migration Path

1. Keep current public site, Omma prototype, and local dev portal separate.
2. Document which public artifact behaviors are worth preserving.
3. Create a public-safe continuity summary format before adding public continuity routes.
4. Keep `/dev` read-only and private.
5. Avoid shared data stores until boundaries are clear.
6. Only integrate prototype interaction patterns after accessibility, performance, and security review.
7. Move toward one coherent site architecture gradually, with public/private routes clearly separated.

## Risks And Open Tensions

- Public artifact design may outpace runtime maturity.
- Private observability could accidentally expose sensitive operational data.
- Prototype code may not match production maintainability needs.
- Public continuity may become too abstract or too revealing.
- Dev portal convenience could drift into admin controls or surveillance.
- Multiple projection surfaces may confuse project identity if their roles are not documented.
- Future integration could blur source grounding, runtime behavior, and symbolic projection.

The safest path is separation first, then deliberate integration.
