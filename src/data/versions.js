export const versions = [
  {
    project: "Website",
    area: "site",
    label: "v1 dashboard foundation",
    date: "2026-05-12",
    status: "experimental",
    summary: "Static modular dashboard sections driven by local JavaScript data files.",
    safeUse: "Safe for public website navigation and continuity mapping.",
    rollback: "Use git to return to the previous main checkpoint if the dashboard layout needs to be removed.",
    tag: ""
  },
  {
    project: "Website",
    area: "artifact",
    label: "artifact motion baseline",
    date: "2026-05-12",
    status: "experimental",
    summary: "Two-sided artifact card with motion permission, calibration, parallax, and link fixes.",
    safeUse: "Safe as static frontend behavior; no backend or external services.",
    rollback: "Revert the artifact-related website commit if mobile behavior regresses.",
    tag: "220183a"
  },
  {
    project: "Discord Systems",
    area: "delivery",
    label: "normal message delivery",
    date: "2026-05-12",
    status: "stable",
    summary: "Normal channel and DM messages are the default delivery style.",
    safeUse: "Stable for reducing reply clutter while keeping replies available in contextual cases.",
    rollback: "Use git history in the bot repository when a prior delivery behavior is needed.",
    tag: ""
  },
  {
    project: "Liahona",
    area: "retrieval",
    label: "semantic retrieval direction",
    date: "2026-05-12",
    status: "planned",
    summary: "Source-grounded retrieval is documented as direction, not claimed as complete.",
    safeUse: "Planning checkpoint only.",
    rollback: "No runtime rollback needed.",
    tag: ""
  }
];
