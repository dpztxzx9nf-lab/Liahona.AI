# Continuity and Versioning

Liahona.AI uses git as the technical rollback system.

The website also keeps human-readable continuity data in:

- `src/data/logs.js`
- `src/data/versions.js`
- `src/data/projects.js`
- `src/data/behaviorLab.js`
- `src/data/cosmology.js`

Use continuity entries to explain why a change exists, not only what changed.

Recommended status labels:

- `stable` - safe current baseline.
- `experimental` - working but still being shaped.
- `planned` - direction only.
- `reverted` - intentionally backed out.
- `watching` - behavior needs observation.

Rollback rule:

If a visual or interaction experiment becomes confusing, revert the relevant git commit rather than layering compensating complexity on top.
