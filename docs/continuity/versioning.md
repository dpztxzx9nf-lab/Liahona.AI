# Continuity and Versioning

Liahona.AI uses git as the technical rollback system.

The website keeps only the data needed by the live front-end in:

- `src/data/cosmology.js`

Project continuity belongs in docs unless it is deliberately surfaced in the artifact experience.

Use continuity entries to explain why a change exists, not only what changed.

Recommended status labels:

- `stable` - safe current baseline.
- `experimental` - working but still being shaped.
- `planned` - direction only.
- `reverted` - intentionally backed out.
- `watching` - behavior needs observation.

Rollback rule:

If a visual or interaction experiment becomes confusing, revert the relevant git commit rather than layering compensating complexity on top.

## Experiment and Reversion Workflow

Use experiments to test a clear direction without making the homepage harder to reason about.

### Before starting

Define the experiment in one sentence:

- What is being tested.
- Which layer it belongs to: artifact experience, continuity device, documentation, or operations.
- What should stay unchanged.
- What would make the experiment successful.
- What would make it worth reverting.

For visual and interaction experiments, preserve the artifact-first hierarchy:

- The Liahona artifact remains the primary experience.
- The continuity device remains secondary.
- Scripture/source grounding points outward and does not imply authority.
- The homepage should stay quiet, restrained, and recoverable.

### Branching

Start from a clean baseline when possible:

```powershell
git status
git switch main
git pull
git switch -c experiment/short-name
```

If the working tree is not clean, identify whether the existing changes are part of the experiment. Do not mix unrelated cleanup, copy edits, and interaction experiments in the same commit.

### During the experiment

Keep the change small enough to revert cleanly:

- Prefer one experiment per branch.
- Touch the fewest files that can prove the idea.
- Avoid new dependencies unless the experiment is specifically about the dependency.
- Do not add hidden fallback systems to protect a weak idea.
- Remove abandoned UI remnants before calling the experiment complete.

Use documentation for uncertain concepts before implementing them. Major architectural, metaphysical, governance, source-layer, or continuity concepts should be stabilized in docs first.

### Checkpointing

Commit the experiment as a checkpoint before further polishing:

```powershell
git add index.html style.css src docs
git commit -m "Experiment: short description"
```

For meaningful site-visible experiments, add or update continuity records:

- `docs/architecture/decision-log.md` if the experiment changes a durable principle.
- `docs/continuity/versioning.md` if the experiment changes rollback or checkpoint policy.
- `src/data/cosmology.js` only when the live artifact fragments change.

Use `experimental` as the status until the change has survived review and use.

### Review

Review the experiment against the original success and reversion criteria.

Minimum review:

- Desktop first viewport.
- Mobile first viewport.
- Artifact click or flip behavior.
- Continuity device open and return behavior.
- Source links and grounding language.
- No dead script, unused asset, or abandoned CSS added by the experiment.

If browser verification is blocked, record that limitation and run the available syntax/reference checks.

### Promote

Promote an experiment only when it improves the experience without adding avoidable complexity.

Promotion steps:

```powershell
git switch main
git merge experiment/short-name
```

Then update continuity records from `experimental` to `stable` only when the baseline is actually stable.

### Revert

Prefer a clean git revert over compensating patches when the experiment fails:

```powershell
git status
git revert <commit>
```

Use reversion when:

- The artifact becomes secondary to UI chrome.
- The interaction is confusing on mobile or desktop.
- The design requires hidden explanatory text to make sense.
- The change creates dead code, duplicate logic, or unused assets.
- The implementation makes future rollback harder.
- The experience feels less reverent, restrained, or grounded.

After reverting, add a `reverted` continuity note explaining why. Keep it short and useful; do not memorialize noise.

### Clean Up

Before ending an experiment, remove iteration leftovers:

- Unused assets.
- Dead CSS selectors.
- Script tags for removed UI.
- Hidden sections that no longer have a path back into the experience.
- Duplicate helper logic.
- Temporary test files or screenshots.

The reversion workflow is part of the design discipline: a reverted experiment is successful if it preserves clarity and keeps the artifact experience recoverable.
