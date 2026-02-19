const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

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

app.post('/api/converse', async (req, res) => {
  try {
    const { userMessage, conversationHistory = [], imageContext } = req.body;

    if (!userMessage || !String(userMessage).trim()) {
      return res.status(400).json({ error: 'Empty message' });
    }
    const sceneSummary = formatImageContext(imageContext);
    
    const messages = [
      {
        role: 'system',
        content: `You are a friendly AI talking to a young child (age 3-7) about a picture. Use ONLY what is actually in the picture. If you are not sure something exists, say you don't see it and ask about what the child can see.
Context:
${sceneSummary}
Rules:
- Keep replies 1-2 short sentences, simple words, warm and encouraging.
- Start by describing something visible and asking about it.
- If the child mentions something NOT in the picture, gently correct and point to animals that are present.
- Ask about colors, counts, and actions of the animals in the image.
- Use the suggested questions to guide the chat and sprinkle in fun facts from the list.
       - Do not invent new animals or objects beyond the context.
       - Keep the 1-minute interaction lively and image-focused.
       - Always provide a short text reply (no emojis) that can be spoken aloud; do not request animations or tool calls.`
      },
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
