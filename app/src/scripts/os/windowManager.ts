/**
 * Re-export shim — all logic has moved to ./window/ modules.
 * This file preserves backward compatibility for existing imports.
 */
export { initWindowManager, openWindow, minimizeWindow } from './window/index';
