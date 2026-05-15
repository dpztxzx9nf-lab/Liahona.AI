function logDiagnostic(event, details = {}) {
  const { level = "info", ...fields } = details;

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields
  }));
}

function logError(event, details = {}, error) {
  logDiagnostic(event, {
    ...details,
    level: "error",
    errorMessage: error?.message || details.errorMessage
  });

  if (error) {
    console.error(event, error);
  }
}

module.exports = {
  logDiagnostic,
  logError
};
