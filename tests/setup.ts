/**
 * Test environment setup
 * Sets up DOM environment for tests that need document/window
 */

import { Window } from 'happy-dom';

// Create a window instance
const win = new Window();

// Set up global DOM environment
// @ts-ignore
globalThis.document = win.document;
// @ts-ignore
globalThis.window = win as unknown as Window & typeof globalThis;
// @ts-ignore
globalThis.HTMLElement = win.HTMLElement;
// @ts-ignore
globalThis.Node = win.Node;
// @ts-ignore
globalThis.Element = win.Element;
// @ts-ignore
globalThis.HTMLCollection = win.HTMLCollection;

console.log('[Test Setup] DOM environment initialized with happy-dom');
