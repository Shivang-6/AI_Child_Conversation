// Build a Pollinations image URL for lightweight, keyless generation.
// Using the flux model improves reliability; seed avoids caching.
export const buildGeneratedImageUrl = (prompt, opts = {}) => {
  const width = opts.width || 1024;
  const height = opts.height || 768;
  const seed = opts.seed || Date.now();
  const model = opts.model || 'flux';
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?model=${model}&width=${width}&height=${height}&seed=${seed}&nologo=true`;
};
