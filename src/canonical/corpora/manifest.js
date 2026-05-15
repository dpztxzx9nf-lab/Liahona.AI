const path = require("path");

const CORPORA_ROOT = path.join("docs", "Eternal Sources");

const canonicalManifest = [
  {
    id: "church-of-jesus-christ",
    title: "Church of Jesus Christ",
    type: "church-website",
    path: path.join(CORPORA_ROOT, "Church-of-Jesus-Christ.txt"),
    authorityLevel: "church-authoritative",
    scope: ["church", "doctrine", "reference"]
  },
  {
    id: "gods-plan",
    title: "God's Plan",
    type: "church-teaching",
    path: path.join(CORPORA_ROOT, "God's-Plan.txt"),
    authorityLevel: "church-authoritative",
    scope: ["plan-of-salvation", "doctrine"]
  },
  {
    id: "gospel-library",
    title: "Gospel Library",
    type: "church-library",
    path: path.join(CORPORA_ROOT, "Gospel Library.txt"),
    authorityLevel: "church-authoritative",
    scope: ["scripture", "study", "conference", "church"]
  },
  {
    id: "guide-to-the-scriptures",
    title: "Guide to the Scriptures",
    type: "scripture-reference",
    path: path.join(CORPORA_ROOT, "Guide-to-the-Scriptures.txt"),
    authorityLevel: "church-authoritative",
    scope: ["scripture", "study", "reference"]
  },
  {
    id: "study-helps",
    title: "Study Helps",
    type: "study-help",
    path: path.join(CORPORA_ROOT, "Study-Helps.txt"),
    authorityLevel: "church-study",
    scope: ["study", "teaching", "reference"]
  },
  {
    id: "eternal-progression",
    title: "Eternal Progression",
    type: "church-teaching",
    path: path.join(CORPORA_ROOT, "eternal-progression.txt"),
    authorityLevel: "church-authoritative",
    scope: ["doctrine", "plan-of-salvation"]
  }
];

function getCanonicalManifest() {
  return canonicalManifest.map((entry) => ({ ...entry }));
}

function getCanonicalSourceById(id) {
  const entry = canonicalManifest.find((source) => source.id === id);
  return entry ? { ...entry } : null;
}

module.exports = {
  canonicalManifest,
  getCanonicalManifest,
  getCanonicalSourceById
};
