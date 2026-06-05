const axios = require("axios");
const constants = require("../constants");

async function sendToApi(payload) {
  const url = constants.logServerURL;
  const token = constants.token;

  try {
    return await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error("Log send failed:", err.message || err);
    return null;
  }
}

function Log(stack, level, pkg, message) {
  const payload = {
    stack: stack || "app",
    level: level || "Info",
    package: pkg || "unknown",
    message: message || "",
  };

  // Fire-and-forget logging to remain non-blocking
  sendToApi(payload).catch((err) =>
    console.error("Log request failed:", err.message || err),
  );
}

module.exports = { Log };
