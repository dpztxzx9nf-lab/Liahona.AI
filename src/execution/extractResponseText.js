function extractResponseText(response) {
  if (typeof response?.output_text === "string") {
    return response.output_text;
  }

  if (!Array.isArray(response?.output)) {
    return "";
  }

  const parts = [];

  for (const item of response.output) {
    if (item.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }

    for (const block of item.content) {
      if (block.type === "output_text" && block.text) {
        parts.push(block.text);
      }
    }
  }

  return parts.join("\n");
}

module.exports = {
  extractResponseText
};
