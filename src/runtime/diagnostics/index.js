const { logDiagnostic, logError, setRuntimeSessionId } = require("./logger");
const { getMessageDiagnostics, validateMessage } = require("./messageContext");
const {
  validateEnvironment,
  isRuntimeHealthy,
  updateRuntimeState,
  getRuntimeState
} = require("./health");

module.exports = {
  logDiagnostic,
  logError,
  setRuntimeSessionId,
  getMessageDiagnostics,
  validateMessage,
  validateEnvironment,
  isRuntimeHealthy,
  updateRuntimeState,
  getRuntimeState
};
