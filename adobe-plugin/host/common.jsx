/**
 * Common utilities shared between Premiere Pro and After Effects
 */

/**
 * Safely parse JSON string
 */
function safeJSONParse(jsonStr, defaultValue) {
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return defaultValue || null;
  }
}

/**
 * Get system info
 */
function getSystemInfo() {
  return JSON.stringify({
    os: $.os,
    version: $.version,
    appVersion: app.version,
    appName: app.name
  });
}
