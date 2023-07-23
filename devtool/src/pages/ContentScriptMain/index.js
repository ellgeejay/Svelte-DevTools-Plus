import {
  getNode,
  addNodeListener,
  startProfiler,
  stopProfiler,
  getSvelteVersion,
  getRootNodes,
} from 'svelte-listener';
import { getAllNodes } from 'svelte-listener/src';

// Stolen from another Svelte DevTool to access props
function clone(value, seen = new Map()) {
  switch (typeof value) {
    case 'function':
      return { __isFunction: true, source: value.toString(), name: value.name };
    case 'symbol':
      return { __isSymbol: true, name: value.toString() };
    case 'object': {
      if (value === window || value === null) return null;
      if (Array.isArray(value)) return value.map((o) => clone(o, seen));
      if (seen.has(value)) return {};
      const o = {};
      seen.set(value, o);
      for (const [key, v] of Object.entries(value)) {
        o[key] = clone(v, seen);
      }
      return o;
    }
    default:
      return value;
  }
}
function gte(major, minor, patch) {
  const version = (getSvelteVersion() || '0.0.0')
    .split('.')
    .map((n) => parseInt(n));
  return (
    version[0] > major ||
    (version[0] == major &&
      (version[1] > minor || (version[1] == minor && version[2] >= patch)))
  );
}

let _shouldUseCapture = null;
function shouldUseCapture() {
  return _shouldUseCapture == null
    ? (_shouldUseCapture = gte(3, 19, 2))
    : _shouldUseCapture;
}
// End of stolen code

// ALEX'S TODO LIST:
// Have app respond to changes in the DOM

// Changing tabs doesn't update the devtool panel. It does update the popup window though
// I believe this is because the popup window closes when I change tabs
// When I change tabs, the devtool window doesn't reset. Can I force it to reset
// whenever the user switches tabs?

// How can we split up tasks in the Devtool?
// Style Component steps
// Profiler tab
// modify state and props
// D3 component tree
// Fix icon color change
// Highlight selected component
// Style nav bar; default selection should be step

//KNOWN ISSUES WE'RE IGNORING:
// webpack dev server gives us many ugly red errors when we load a page. Ignore them. They're harmless
// flipping the https option to true in webserver.js fixes this problem, but creates a worse one
// This issue doesn't come up in production anyway, so it's safe to ignore

// A global variable to let us know when the page has been loaded or not
let pageLoaded = false;
// At this time, this content script only gets Svelte component data once
window.addEventListener('load', (event) => {
  pageLoaded = true;
});

const rootComponentHistory = [];

// Gets the root component from svelte listener and returns
// a component tree starting with the root component
function traverseComponent(node) {
  let components = [];
  node.children.forEach((child) => {
    if (child.type === 'component' && child.detail.$$) {
      const serialized = {
        id: child.id,
        type: child.type,
        tagName: child.tagName,
        componentState: JSON.parse(
          JSON.stringify(child.detail.$capture_state())
        ),
        children: traverseComponent(child),
      };
      // I stole this code from another Svelte DevTool because I didn't
      // know how to access props
      const internal = child.detail.$$;
      const props = Array.isArray(internal.props)
        ? internal.props // Svelte < 3.13.0 stored props names as an array
        : Object.keys(internal.props);
      let ctx = clone(
        shouldUseCapture() ? child.detail.$capture_state() : internal.ctx
      );
      if (ctx === undefined) ctx = {};
      serialized.detail = {
        attributes: props.flatMap((key) => {
          const value = ctx[key];
          delete ctx[key];
          return value === undefined
            ? []
            : { key, value, isBound: key in internal.bound };
        }),
        listeners: Object.entries(internal.callbacks).flatMap(
          ([event, value]) =>
            value.map((o) => ({ event, handler: o.toString() }))
        ),
        ctx: Object.entries(ctx).map(([key, value]) => ({ key, value })),
      };
      components.push(serialized);
    } else {
      components = components.concat(traverseComponent(child));
    }
  });
  return components;
}

// Gets component tree using svelte listener and sends it to the
// dev tool panel
function sendRootNodeToExtension(firstCall) {
  const rootNodes = getRootNodes();
  console.log('rootNodes', rootNodes);

  // Let's get the board component and see what we can do with it
  // const boardComponent = rootNodes[0].children[0].children[2];
  // console.log('boardComponent', boardComponent);
  // const result = boardComponent.detail.$capture_state();
  // console.log('result', result);

  const newRootNodes = traverseComponent({
    children: rootNodes,
    type: 'component',
  });
  if (!newRootNodes) {
    return;
  }
  // As far as I know, Svelte can only have one root node at a time
  const newRootNode = newRootNodes[0];

  console.log('newRootNode', newRootNode);
  const messageType = firstCall ? 'returnRootComponent' : 'updateRootComponent';
  // Sends a message to ContentScriptIsolated/index.js
  window.postMessage({
    // target: node.parent ? node.parent.id : null,
    type: messageType,
    rootComponent: newRootNode,
    source: 'ContentScriptMain/index.js',
  });
}

// Gets svelte version using svelte listener and sends it to
// the Popup box
function sendSvelteVersionToExtension() {
  const svelteVersion = getSvelteVersion();
  if (!svelteVersion) {
    return;
  }
  // Sends a message to ContentScriptIsolated/index.js
  window.postMessage({
    // target: node.parent ? node.parent.id : null,
    type: 'returnSvelteVersion',
    svelteVersion: svelteVersion,
    source: 'ContentScriptMain/index.js',
  });
}

function injectState(id, newState) {
  const component = getNode(id).detail
  component.$inject_state(newState);
}

// Listens to events from ContentScriptIsolated/index.js and
// responds based on the event's type
window.addEventListener('message', async (msg) => {
  if (
    typeof msg !== 'object' ||
    msg === null ||
    msg.data?.source !== 'ContentScriptIsolated/index.js'
  ) {
    return;
  }
  const data = msg.data;
  switch (data.type) {
    case 'getSvelteVersion':
      sendSvelteVersionToExtension();
      break;
    case 'getRootComponent':
      sendRootNodeToExtension(true);
      break;
    case 'injectState':
      injectState(data.componentId, data.newState);
      break;
  }
});

function sendUpdateToPanel() {
  // This should only happen after the DOM is fully loaded
  if (!pageLoaded) return;
  console.log('here comes an update!')

  // This needs a setTimeout because it MUST run AFTER the svelte-listener events fire
  // Send the devtool panel an updated root component whenever the Svelte DOM changes
  setTimeout(() => {
    sendRootNodeToExtension(false);
  }, 0);
}
// TODO: Okay here's the problem. Whenever I call this function, I send
// the updated root node to the DevTool panel. But what happens when
// the panel is closed? The app crashes.

// All the data I need is stored in svelte listener
// How do I send updated data to the extension as soon as it updates?
// Let's set up a listener for updates in the Devtool
// Whenever I get an update, send it to this listener from here

// How is this different from the setup I have now?
// In my current Devtool listener, it's set up to process data on page load
// I need to do something different to handle an update

window.document.addEventListener('SvelteRegisterComponent', sendUpdateToPanel);
window.document.addEventListener('SvelteRegisterBlock', sendUpdateToPanel);
window.document.addEventListener('SvelteDOMInsert', (e) => sendUpdateToPanel);
window.document.addEventListener('SvelteDOMRemove', sendUpdateToPanel);
// window.document.addEventListener('SvelteDOMAddEventListener', sendUpdateToPanel);
// window.document.addEventListener('SvelteDOMRemoveEventListener', sendUpdateToPanel);
// window.document.addEventListener("SvelteDOMSetData", sendUpdateToPanel);
// window.document.addEventListener("SvelteDOMSetProperty", sendUpdateToPanel);
// window.document.addEventListener('SvelteDOMSetAttribute', sendUpdateToPanel);
// window.document.addEventListener('SvelteDOMRemoveAttribute', sendUpdateToPanel);


//TODO NEXT: 
// Why are we getting so many updates at once?
// I suspect it's because when one state changes, multiple other components 
// have to update as well, so this triggers an event for each of those components
// I should try rewriting my logic so that when I get a bunch of events from 
// one action by the user, it only updates the Panel once. (But shouldn't it be the
// most recent one?)

