const { logDiagnostic, logError } = require("./logger");
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
  getMessageDiagnostics,
  validateMessage,
  validateEnvironment,
  isRuntimeHealthy,
  updateRuntimeState,
  getRuntimeState
};
