import { projects } from "./data/projects.js";
import { logs } from "./data/logs.js";
import { behaviorLab } from "./data/behaviorLab.js";
import { versions } from "./data/versions.js";

const statusLabels = {
  active: "Active",
  experimental: "Experimental",
  stable: "Stable",
  planned: "Planned",
  forming: "Forming",
  reverted: "Reverted",
  watching: "Watching"
};

function text(value) {
  return value || "Not set";
}

function statusText(status) {
  return statusLabels[status] || status;
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
}

function renderProjects() {
  const container = document.querySelector("[data-projects-list]");

  if (!container) {
    return;
  }

  container.innerHTML = projects.map((project) => `
    <article class="project-card">
      <div class="card-topline">
        <h3>${project.name}</h3>
        <span class="status-pill status-${project.status}">${statusText(project.status)}</span>
      </div>
      <p>${project.description}</p>
      <dl class="detail-list">
        <div>
          <dt>Version</dt>
          <dd>${text(project.version)}</dd>
        </div>
        <div>
          <dt>Latest update</dt>
          <dd>${text(project.latestUpdate)}</dd>
        </div>
      </dl>
    </article>
  `).join("");
}

function populateFilters(items, filterRoot) {
  if (!filterRoot) {
    return;
  }

  const projectFilter = filterRoot.querySelector("[data-filter-project]");
  const areaFilter = filterRoot.querySelector("[data-filter-area]");

  if (projectFilter) {
    uniqueValues(items, "project").forEach((project) => {
      projectFilter.appendChild(createOption(project, project));
    });
  }

  if (areaFilter) {
    uniqueValues(items, "area").forEach((area) => {
      areaFilter.appendChild(createOption(area, area));
    });
  }
}

function matchesFilters(item, filterRoot) {
  const project = filterRoot?.querySelector("[data-filter-project]")?.value || "all";
  const area = filterRoot?.querySelector("[data-filter-area]")?.value || "all";

  return (project === "all" || item.project === project) && (area === "all" || item.area === area);
}

function renderLogs() {
  const container = document.querySelector("[data-log-list]");
  const filterRoot = document.querySelector("[data-log-filters]");

  if (!container) {
    return;
  }

  const visibleLogs = logs.filter((entry) => matchesFilters(entry, filterRoot));

  container.innerHTML = visibleLogs.map((entry) => `
    <article class="timeline-entry">
      <div class="entry-meta">
        <time datetime="${entry.date}">${entry.date}</time>
        <span>${entry.project}</span>
        <span>${entry.area}</span>
        <span class="status-pill status-${entry.status}">${statusText(entry.status)}</span>
      </div>
      <h3>${entry.title}</h3>
      <p>${entry.summary}</p>
      <p><strong>Purpose:</strong> ${entry.purpose}</p>
      ${entry.commit ? `<p class="entry-tag">Commit/tag: ${entry.commit}</p>` : ""}
    </article>
  `).join("") || `<p class="empty-state">No entries match the selected filters.</p>`;
}

function renderBehaviorLab() {
  const container = document.querySelector("[data-behavior-list]");
  const filterRoot = document.querySelector("[data-behavior-filters]");

  if (!container) {
    return;
  }

  const visibleEntries = behaviorLab.filter((entry) => matchesFilters(entry, filterRoot));

  container.innerHTML = visibleEntries.map((entry) => `
    <article class="lab-entry">
      <div class="entry-meta">
        <time datetime="${entry.date}">${entry.date}</time>
        <span>${entry.project}</span>
        <span>${entry.area}</span>
        <span class="status-pill status-${entry.status}">${statusText(entry.status)}</span>
      </div>
      <h3>${entry.context}</h3>
      <dl class="lab-list">
        <div><dt>Input</dt><dd>${entry.input}</dd></div>
        <div><dt>Output</dt><dd>${entry.output}</dd></div>
        <div><dt>Worked</dt><dd>${entry.worked}</dd></div>
        <div><dt>Failed</dt><dd>${entry.failed}</dd></div>
        <div><dt>Expected behavior</dt><dd>${entry.expectedBehavior}</dd></div>
      </dl>
    </article>
  `).join("") || `<p class="empty-state">No behavior notes match the selected filters.</p>`;
}

function renderVersions() {
  const container = document.querySelector("[data-version-list]");

  if (!container) {
    return;
  }

  container.innerHTML = versions.map((version) => `
    <article class="version-card">
      <div class="card-topline">
        <div>
          <h3>${version.label}</h3>
          <p>${version.project} / ${version.area} / ${version.date}</p>
        </div>
        <span class="status-pill status-${version.status}">${statusText(version.status)}</span>
      </div>
      <p>${version.summary}</p>
      <dl class="detail-list">
        <div><dt>Safe use</dt><dd>${version.safeUse}</dd></div>
        <div><dt>Rollback</dt><dd>${version.rollback}</dd></div>
        ${version.tag ? `<div><dt>Tag/checkpoint</dt><dd>${version.tag}</dd></div>` : ""}
      </dl>
    </article>
  `).join("");
}

function bindFilter(rootSelector, render) {
  const root = document.querySelector(rootSelector);

  if (!root) {
    return;
  }

  root.addEventListener("change", render);
}

renderProjects();
populateFilters(logs, document.querySelector("[data-log-filters]"));
populateFilters(behaviorLab, document.querySelector("[data-behavior-filters]"));
renderLogs();
renderBehaviorLab();
renderVersions();
bindFilter("[data-log-filters]", renderLogs);
bindFilter("[data-behavior-filters]", renderBehaviorLab);
