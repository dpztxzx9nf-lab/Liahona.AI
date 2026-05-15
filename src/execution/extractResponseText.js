function extractTextBlocks(content) {
  if (!Array.isArray(content)) {
    return [];
  }

  const parts = [];

  for (const block of content) {
    if (!block || typeof block !== "object") {
      continue;
    }

    if (
      (block.type === "output_text" || block.type === "text") &&
      typeof block.text === "string" &&
      block.text.trim()
    ) {
      parts.push(block.text);
    }
  }

  return parts;
}

function extractFromOutputArray(output) {
  if (!Array.isArray(output)) {
    return "";
  }

  const parts = [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    if (item.type === "message") {
      parts.push(...extractTextBlocks(item.content));
    }
  }

  return parts.join("\n").trim();
}

function extractResponseText(response) {
  const fromOutput = extractFromOutputArray(response?.output);

  if (fromOutput) {
    return fromOutput;
  }

  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  return "";
}

module.exports = {
  extractResponseText
};
