function coerceReplyText(generation) {
  if (typeof generation === "string") {
    return generation;
  }

  if (!generation || typeof generation !== "object") {
    return "";
  }

  if (typeof generation.text === "string") {
    return generation.text;
  }

  return "";
}

function prepareReplyText(generation) {
  const rawText = coerceReplyText(generation);
  const cleanedText = rawText.trim();

  return {
    rawText,
    cleanedText,
    raw_generation_text_length: rawText.length,
    cleaned_text_length: cleanedText.length
  };
}

module.exports = {
  coerceReplyText,
  prepareReplyText
};
