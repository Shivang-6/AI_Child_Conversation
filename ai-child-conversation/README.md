# AI Child Conversation App

A playful 1-minute voice conversation app that chats with kids about a picture, powered by OpenAI, Web Speech API, and React.

## Project Structure
```
ai-child-conversation/
├── backend/              # Express + OpenAI proxy
├── public/
│   └── images/
├── src/
│   ├── components/
│   ├── hooks/
│   └── services/
└── package.json          # Frontend
```

## Prerequisites
- Node.js 18+
- A Groq API key

## Setup
### Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env with your Groq key (GROQ_API_KEY)
npm run dev
```

### Frontend
```bash
# in project root
npm install
npm start
```

## How it works
- Child taps **Start Talking!** to begin.
- Browser speech recognition captures the child's voice and streams text to the backend.
- Backend uses OpenAI with tool-calling to return a short, warm reply and optional UI actions.
- Text-to-speech reads the AI reply; tool calls trigger animations (happy face, stars).
- A 60-second timer keeps the interaction short and fun.

## Environment
- Backend listens on `http://localhost:5001` by default. Override with `PORT`.
- Backend expects `GROQ_API_KEY`.
- Frontend expects `REACT_APP_API_URL` if you host the backend elsewhere.

## Notes
- Web Speech API support varies by browser; Chrome provides the best experience.
- Replace the demo image URL in `src/components/ImageDisplay.jsx` if you want a local image (put it in `public/images`).
