/**
 * @alt-javascript/common — Shared kernel for the alt-javascript framework
 *
 * Single source of truth for:
 * - Environment detection (Node vs browser)
 * - Global reference resolution
 * - Boot context access
 * - Common utilities
 *
 * Previously duplicated in Boot.js, ApplicationContext.js, ConfigFactory.js,
 * and LoggerFactory.js (4 identical copies of ~20 lines each).
 */

/**
 * Detect whether we're running in a browser environment.
 * @returns {boolean}
 */
function detectBrowser() {
  return typeof window !== 'undefined';
}

/**
 * Get the global reference object (window in browser, globalThis in Node).
 * @returns {Object}
 */
function getGlobalRef() {
  if (detectBrowser()) {
    return window;
  }
  return typeof globalThis !== 'undefined' ? globalThis : global;
}

/**
 * Get a value from the boot root context.
 * @param {string} key — property name in boot.contexts.root
 * @returns {*} — the value, or undefined
 */
function getGlobalRoot(key) {
  const ref = getGlobalRef();
  return ref?.boot?.contexts?.root?.[key];
}

/**
 * Check if a value is a plain object (not a class instance, array, etc.)
 * @param {*} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true;
  let baseProto = proto;
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }
  return proto === baseProto;
}

var index = {
  detectBrowser,
  getGlobalRef,
  getGlobalRoot,
  isPlainObject,
};

export { index as default, detectBrowser, getGlobalRef, getGlobalRoot, isPlainObject };
