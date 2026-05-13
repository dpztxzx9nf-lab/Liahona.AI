# Git as Continuity Spine

Git is the technical continuity spine for Liahona.AI.

The site may present symbolic continuity through the artifact, fragments, source links, and documentation, but Git remains the durable record of what actually changed.

## Purpose

Git gives the project a recoverable memory:

- What changed.
- When it changed.
- Why a checkpoint existed.
- Which experiments were promoted.
- Which experiments were reverted.

Documentation explains meaning. Git preserves state.

## Relationship to Documentation

Documentation should not replace Git history.

Git records the exact code and content changes. Docs explain the architectural reason a change matters.

Use both:

- Git commit: the technical checkpoint.
- Architecture doc: the durable principle.
- Continuity note: the human-readable transition.
- Revert commit: the clean recovery path.

## Experiments

Experiments should be easy to isolate and easy to remove.

Use Git branches or small commits for experiments. Do not bury experimental work inside unrelated cleanup.

A good experiment commit has:

- A narrow purpose.
- A small file surface.
- A clear success condition.
- A clear reversion condition.
- No abandoned UI remnants.

If an experiment fails, revert the experiment. Do not layer compensating complexity on top of it.

## Reversions

A reversion is not a failure of continuity. It is continuity doing its job.

Revert when a change makes the artifact less central, the interface less clear, or the implementation harder to reason about.

After reverting:

- Keep the revert commit.
- Record the reason if it changes future judgment.
- Remove leftover assets, selectors, scripts, and data modules.
- Avoid preserving noise just because it happened.

## What Belongs in Git

Git should preserve:

- Source code.
- Static assets intentionally used by the site.
- Documentation.
- Durable content and data files.
- Experiment checkpoints worth reviewing.

Git should not become a dumping ground for:

- Generated leftovers.
- Temporary screenshots.
- Dead CSS.
- Unused experimental scripts.
- Duplicate assets.
- Hidden UI systems with no active path back into the experience.

## Working Rule

Before changing the front-end, know what would be reverted.

Before promoting an experiment, know what should be kept.

Before deleting remnants, know whether they are meaningful continuity or just iteration debris.

The artifact experience should remain light enough that Git can clearly show its evolution.
