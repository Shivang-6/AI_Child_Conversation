import { IMAGE_CONTEXT } from '../context/imageContextData';

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function buildSystemPrompt(imageContext) {
  const animals = IMAGE_CONTEXT.animals;
  const environment = IMAGE_CONTEXT.environment;

  return `You are a friendly AI guide talking to a young child (age 3-7) about a zoo picture.

IMAGE CONTEXT:
${JSON.stringify(IMAGE_CONTEXT, null, 2)}

Behavior Rules:
- Always describe animals from the image: ${animals.join(', ')}.
- You may mention environment items: ${environment.join(', ')}.
- Ask short curious questions about animals, colors, and counts.
- Respond in simple playful language (1-2 short sentences).
- If the child mentions something NOT in the picture, gently correct and point to animals/things that ARE present.
- Never introduce animals or objects not listed above.
- Avoid scary or dangerous language.
- Always provide a short text reply (no emojis) that can be spoken aloud.
- Keep the interaction lively, image-focused, warm, and encouraging.`;
}

async function callGroq(messages) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 100,
      temperature: 0.4
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq API error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'What else do you notice in the picture?';
}

export async function getGreeting(imageContext) {
  const systemPrompt = buildSystemPrompt(imageContext);
  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `The child just joined the session. Greet them warmly. Pick one animal from this list: ${IMAGE_CONTEXT.animals.join(', ')}. Describe it briefly and ask a simple question about it. Keep it to 1-2 short sentences.`
    }
  ];

  try {
    return await callGroq(messages);
  } catch (err) {
    console.error('Greeting error:', err);
    return "Hi there! Let's look at this picture together. What do you see?";
  }
}

export async function converse({ userMessage, conversationHistory = [], imageContext }) {
  const systemPrompt = buildSystemPrompt(imageContext);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    return await callGroq(messages);
  } catch (err) {
    console.error('Converse error:', err);
    return 'What else do you see in the picture?';
  }
}
