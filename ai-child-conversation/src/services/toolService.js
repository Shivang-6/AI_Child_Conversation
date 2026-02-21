// Simple event bridge so components can react to tool calls.
export const subscribeToAnimations = (handler) => {
  const listener = (event) => handler(event.detail);
  window.addEventListener('showAnimation', listener);
  return () => window.removeEventListener('showAnimation', listener);
};
