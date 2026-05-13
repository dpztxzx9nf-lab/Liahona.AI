# Redesign Preservation Manifest

This manifest defines what must be preserved during the full Liahona.AI website redesign.

The redesign may change the public surface, layout, interaction model, and visual system. It must not erase valuable project memory, source grounding, or recoverability.

## Preserve

### Canonical Artifact

Preserve the existing canonical artifact image:

- `assets/liahona-artifact.jpeg`

Do not replace, rename, regenerate, compress, or overwrite this file unless a future explicit image migration is approved and versioned.

### Source Grounding

Preserve outward source grounding.

At minimum, the public site or supporting docs should retain clear outward links to:

- 1 Nephi 16
- Alma 37
- Guide to the Scriptures: Liahona

Source references should point outward. They should not imply that Liahona is divine, prophetic, authoritative, or revelatory.

### Architectural Continuity

Preserve the docs that define project boundaries and design judgment:

- `docs/architecture/canonical-vs-interpretive.md`
- `docs/architecture/decision-log.md`
- `docs/architecture/experience-direction.md`
- `docs/architecture/git-as-continuity-spine.md`
- `docs/architecture/philosophy.md`
- `docs/continuity/versioning.md`
- `docs/sources/grounding-sources.md`

These files are continuity anchors. Redesign work should extend them when needed, not replace them casually.

### Recoverable Data

Some prior continuity data may not remain in the live public front-end, but it remains valuable as project memory.

Deleted-but-recoverable Git paths include:

- `src/data/projects.js`
- `src/data/logs.js`
- `src/data/versions.js`
- `src/data/behaviorLab.js`
- `src/data/cosmology.js`
- `src/data/decisions.js`

Before permanently discarding any of this data, decide whether it should become:

- Public site content.
- Documentation.
- A future data module.
- A historical Git-only artifact.

Do not recreate dashboard machinery just to preserve data. Preserve meaning first, runtime surface second.

### Git Recoverability

Git remains the technical continuity spine.

Before major redesign implementation:

- Check working tree status.
- Identify unrelated changes.
- Keep public surface changes isolated from documentation changes where practical.
- Make commits small enough to revert.
- Record why a redesign checkpoint exists.

If an experiment fails, revert the experiment rather than layering compensating complexity on top.

## Redesign Boundaries

The redesign may:

- Rebuild `index.html`.
- Rebuild `style.css`.
- Add a small public JavaScript file only if interaction genuinely requires it.
- Reintroduce data modules only if the public experience needs structured data.
- Rework the visible information hierarchy.

The redesign should not:

- Replace the canonical artifact image.
- Hide large dashboard systems in the public DOM.
- Add continuity UI with no clear use path.
- Add source language that sounds authoritative or revelatory.
- Mix unrelated cleanup with a major visual experiment.
- Treat deleted code as lost if Git can recover it.

## Redesign Checkpoint Questions

Before promoting a redesigned surface, answer:

- Is the artifact still the primary experience?
- Are source links still outward and clearly grounded?
- Is valuable continuity preserved somewhere recoverable?
- Can the redesign be reverted cleanly?
- Did the change add dead CSS, unused assets, or abandoned UI remnants?
- Is the public surface simpler after the redesign than before?

## Current Public Surface

The current public surface is intentionally minimal:

- `index.html`
- `style.css`
- `assets/liahona-artifact.jpeg`

It has no runtime JavaScript requirement.

Future redesign work can expand from this baseline, but expansion should be intentional and recoverable.
