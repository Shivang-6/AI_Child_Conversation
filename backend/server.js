const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();
const { IMAGE_CONTEXT } = require('./imageContextData');

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Tool definitions for UI actions
const tools = [
  {
    type: 'function',
    function: {
      name: 'show_happy_animation',
      description: 'Show a happy animation when the child says something positive',
      parameters: {
        type: 'object',
        properties: {
          duration: {
            type: 'number',
            description: 'Duration of animation in seconds'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'show_star_reward',
      description: 'Show a star reward when the child participates well',
      parameters: {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            description: 'Number of stars to show'
          }
        }
      }
    }
  }
];

function formatImageContext(ctx = {}) {
  if (!ctx || typeof ctx !== 'object') {
    return 'Scene: friendly picture. Animals: (not provided). Colors: (not provided).';
  }

  const scene = ctx.scene || {};
  const animals = Array.isArray(ctx.animals) ? ctx.animals : [];

  const sceneLine = `Scene: ${scene.description || 'a friendly picture'} (${scene.location || 'unknown'}, ${scene.timeOfDay || 'day'}, mood: ${scene.mood || 'happy'}). Colors: ${(scene.colors || []).join(', ') || 'not specified'}.`;
  const animalLines = animals.map((a) => {
    const qs = (a.questions || []).slice(0, 2).join(' | ');
    const facts = (a.funFacts || []).slice(0, 1).join(' | ');
    return `- ${a.name}: count ${a.count}, color ${a.color}, action ${a.action}, expression ${a.expression}, spot ${a.location || ''}. Questions: ${qs || 'ask about color/count/action.'} Fun fact: ${facts || 'share one fun fact.'}`;
  });

  return [sceneLine, 'Animals:', ...(animalLines.length ? animalLines : ['(no animals specified; only talk about visible things you actually see in the picture)'])].join('\n');
}

// Build the system prompt — grounded on IMAGE_CONTEXT so the AI
// talks ONLY about what is in the zoo picture.
function buildSystemPrompt(imageContext) {
  // Merge the static IMAGE_CONTEXT with any runtime context the client sends
  const ctx = (imageContext && typeof imageContext === 'object') ? imageContext : {};
  const mergedAnimals = IMAGE_CONTEXT.animals;
  const mergedEnv    = IMAGE_CONTEXT.environment;
  const legacySummary = formatImageContext(ctx);   // keep backward-compat detail

  return `You are a friendly AI guide talking to a young child (age 3-7) about a zoo picture.

IMAGE CONTEXT:
${JSON.stringify(IMAGE_CONTEXT, null, 2)}

Additional detail from runtime context:
${legacySummary}

Behavior Rules:
- Always describe animals from the image: ${mergedAnimals.join(', ')}.
- You may mention environment items: ${mergedEnv.join(', ')}.
- Ask short curious questions about animals, colors, and counts.
- Respond in simple playful language (1-2 short sentences).
- If the child mentions something NOT in the picture, gently correct and point to animals/things that ARE present.
- Never introduce animals or objects not listed above.
- Avoid scary or dangerous language.
- Always provide a short text reply (no emojis) that can be spoken aloud.
- Keep the interaction lively, image-focused, warm, and encouraging.`;
}

// AI-initiated greeting — called when a session starts so the child hears the AI first
app.post('/api/ai-start', async (req, res) => {
  try {
    const { imageContext } = req.body;
    const systemPrompt = buildSystemPrompt(imageContext);

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content:
          `The child just joined the session. Greet them warmly. Pick one animal from this list: ${IMAGE_CONTEXT.animals.join(', ')}. Describe it briefly and ask a simple question about it. Keep it to 1-2 short sentences.`
      }
    ];

    const result = await callWithTools(messages);
    res.status(200).json({ type: 'ai_start', message: result.message });
  } catch (error) {
    console.error('ai-start error:', error);
    res.status(error?.status || 500).json({ error: error?.message || 'Something went wrong' });
  }
});

app.post('/api/converse', async (req, res) => {
  try {
    const { userMessage, conversationHistory = [], imageContext } = req.body;

    if (!userMessage || !String(userMessage).trim()) {
      return res.status(400).json({ error: 'Empty message' });
    }
    const systemPrompt = buildSystemPrompt(imageContext);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const result = await callWithTools(messages);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    const message = error?.message || 'Something went wrong';
    const status = error?.status || 500;
    res.status(status).json({ error: message });
  }
});

async function callWithTools(messages) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 100,
      temperature: 0.4
    });
    const aiResponse = response.choices[0].message;
    const safeContent = aiResponse?.content?.trim() || 'What else do you notice in the picture?';
    return { message: safeContent };
  } catch (err) {
    // If tool use fails, retry once without tools to keep UX smooth
    if (err?.code === 'tool_use_failed' || err?.error?.code === 'tool_use_failed') {
      const fallback = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 100,
        temperature: 0.7
      });
      const aiResponse = fallback.choices[0].message;
      const safeContent = aiResponse?.content?.trim() || 'Want to tell me more about what you see?';
      return { message: safeContent };
    }
    throw err;
  }
}

async function processToolCalls(toolCalls) {
  const results = [];
  
  for (const toolCall of toolCalls) {
    const args = JSON.parse(toolCall.function.arguments || '{}');
    
    switch (toolCall.function.name) {
      case 'show_happy_animation':
        results.push({
          type: 'animation',
          name: 'happy',
          duration: Number(args.duration) || 2
        });
        break;
        
      case 'show_star_reward':
        results.push({
          type: 'reward',
          name: 'stars',
          count: Number(args.count) || 3
        });
        break;
      default:
        break;
    }
  }
  
  return results;
}

// ─── WebSocket layer ────────────────────────────────────────
const http = require('http');
const { WebSocketServer } = require('ws');

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[ws] client connected');

  // Per-connection session state
  const session = { history: [], imageContext: null, active: false };

  ws.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // ── ai_start: generate greeting and stream it back ──
    if (msg.type === 'ai_start') {
      session.imageContext = msg.imageContext || null;
      session.history = [];
      session.active = true;

      const systemPrompt = buildSystemPrompt(session.imageContext);
      const messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            `The child just joined the session. Greet them warmly. Pick one animal from this list: ${IMAGE_CONTEXT.animals.join(', ')}. Describe it briefly and ask a simple question about it. Keep it to 1-2 short sentences.`
        }
      ];

      try {
        const result = await callWithTools(messages);
        session.history.push({ role: 'assistant', content: result.message });
        ws.send(JSON.stringify({ type: 'ai_greeting', message: result.message }));
      } catch (err) {
        console.error('[ws] ai_start error', err);
        const fallback = "Hi there! Let's look at this picture together. What do you see?";
        session.history.push({ role: 'assistant', content: fallback });
        ws.send(JSON.stringify({ type: 'ai_greeting', message: fallback }));
      }
    }

    // ── end_turn: child finished speaking, generate next AI reply ──
    if (msg.type === 'end_turn' && session.active) {
      const userText = (msg.transcript || '').trim();
      if (!userText) return;

      session.history.push({ role: 'user', content: userText });

      const systemPrompt = buildSystemPrompt(session.imageContext);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...session.history
      ];

      try {
        const result = await callWithTools(messages);
        session.history.push({ role: 'assistant', content: result.message });
        ws.send(JSON.stringify({ type: 'ai_reply', message: result.message }));
      } catch (err) {
        console.error('[ws] end_turn error', err);
        const fallback = 'What else do you see in the picture?';
        session.history.push({ role: 'assistant', content: fallback });
        ws.send(JSON.stringify({ type: 'ai_reply', message: fallback }));
      }
    }

    // ── end_session: clean up ──
    if (msg.type === 'end_session') {
      console.log('[ws] session ended by client');
      session.active = false;
      session.history = [];
      session.imageContext = null;
      ws.send(JSON.stringify({ type: 'session_ended' }));
    }
  });

  ws.on('close', () => {
    console.log('[ws] client disconnected');
    session.active = false;
    session.history = [];
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (HTTP + WS)`);
});
