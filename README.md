# AI Child Conversation App

A playful voice conversation app where an AI talks with kids (ages 3-7) about a zoo picture. The AI initiates the conversation, describes animals in the image, and asks child-friendly questions — all through voice.

Powered by **Groq LLM**, **Web Speech API** (STT + TTS), **React**, and **Tailwind CSS**.

---

## Features

- **AI speaks first** — the AI greets the child and starts talking about the picture automatically
- **Image-grounded conversation** — the AI only references animals and objects defined in the image context (giraffe, elephant, lion, etc.)
- **Continuous voice loop** — after the AI speaks, the mic starts automatically; 2-second silence triggers the next AI turn
- **Start / End controls** — large touch-friendly buttons to begin and end the session
- **60-second timer** — session auto-ends when time runs out
- **Minimal dark UI** — distraction-free interface with image preview, chat bubbles, and one action button
- **No backend needed** — calls the Groq API directly from the browser

---

## Project Structure

```
ai-child-conversation/
├── public/
│   └── images/
│       └── zoo.png            # The zoo picture shown to the child
├── src/
│   ├── App.jsx                # Root layout (image + conversation panel)
│   ├── index.js               # React entry point
│   ├── index.css              # Tailwind + dark theme styles
│   ├── components/
│   │   ├── ConversationInterface.jsx  # Chat bubbles, timer, Start/End buttons
│   │   ├── ImageDisplay.jsx           # Minimal image preview
│   │   └── FeedbackAnimation.jsx      # Reward animations
│   ├── context/
│   │   ├── ImageContext.js            # React context for image data
│   │   └── imageContextData.js        # IMAGE_CONTEXT (animals, environment, rules)
│   ├── hooks/
│   │   └── useConversation.js         # STT, TTS, Groq API calls, session logic
│   └── services/
│       └── aiService.js               # Groq REST API integration
├── .env                       # REACT_APP_GROQ_API_KEY
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- A **Groq API key** (free at [console.groq.com](https://console.groq.com))
- **Google Chrome** (recommended — best Web Speech API support)

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd ai-child-conversation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
REACT_APP_GROQ_API_KEY=your_groq_api_key_here
```

### 4. Start the dev server

```bash
npm start
```

The React app opens at `http://localhost:3000`.

---

## Usage

1. Open `http://localhost:3000` in Chrome.
2. Click the green **Start** button.
3. The AI greets the child and describes something in the zoo picture.
4. After the AI finishes speaking, the microphone activates automatically.
5. The child talks — after 2 seconds of silence the AI responds.
6. The conversation continues until the timer runs out or the red **End** button is pressed.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `REACT_APP_GROQ_API_KEY` | Groq API key for LLM calls | *(required)* |

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Groq (`llama-3.3-70b-versatile`) |
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| API | Groq REST API (called directly from browser) |
