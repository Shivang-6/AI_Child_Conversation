# AI Child Conversation App

A playful **voice-first AI conversation web app** designed for children (ages 3–7). The AI initiates the interaction, describes animals from a zoo image, and asks simple child-friendly questions — all through continuous speech.

The application uses image-grounded context so the AI only talks about animals and objects defined inside the picture.

## 🌐 Live Demo

**Deployed Link:**
https://ai-child-conversation-2nnzyhbz9-shivangs-projects-f8cf7eb3.vercel.app/

---

## ✨ Features

* **AI Initiates Conversation**
  The assistant automatically greets the child and starts talking about the zoo image.

* **Image-Grounded Responses**
  AI references only predefined animals and environment details (giraffe, elephant, lion, trees, sky, etc.).

* **Continuous Voice Loop**
  After the AI speaks, the microphone activates automatically.
  Two seconds of silence triggers the next AI reply.

* **Start / End Controls**
  Large touch-friendly buttons designed for kids.

* **60-Second Session Timer**
  Conversation ends automatically when time expires.

* **Minimal Dark UI**
  Distraction-free layout with:

  * Image preview
  * Chat bubbles
  * Voice feedback animations

* **No Backend Required**
  Groq API is called directly from the browser.

---

## 🧱 Project Structure

```
ai-child-conversation/
├── public/
│   └── images/
│       └── zoo.png
├── src/
│   ├── App.jsx
│   ├── index.js
│   ├── index.css
│   ├── components/
│   │   ├── ConversationInterface.jsx
│   │   ├── ImageDisplay.jsx
│   │   └── FeedbackAnimation.jsx
│   ├── context/
│   │   ├── ImageContext.js
│   │   └── imageContextData.js
│   ├── hooks/
│   │   └── useConversation.js
│   └── services/
│       └── aiService.js
├── .env
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

---

## ⚙️ Tech Stack

| Layer      | Technology                                           |
| ---------- | ---------------------------------------------------- |
| LLM        | Groq (llama-3.3-70b-versatile)                       |
| Frontend   | React 18, Tailwind CSS, Framer Motion                |
| Voice      | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| Deployment | Vercel                                               |
| API        | Groq REST API                                        |

---

## 📋 Prerequisites

* Node.js v18 or later
* npm v9 or later
* Groq API key (https://console.groq.com)
* Google Chrome (recommended for Speech API support)

---

## 🚀 Setup & Installation

### 1. Clone Repository

```
git clone <repo-url>
cd ai-child-conversation
```

### 2. Install Dependencies

```
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```
REACT_APP_GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run Development Server

```
npm start
```

Application will open at:

```
http://localhost:3000
```

---

## 🧠 Usage Flow

1. Open the deployed app or local server in Chrome.
2. Press **Start**.
3. AI greets the child and describes animals in the zoo image.
4. Microphone activates automatically after AI speech.
5. Child speaks → AI listens → AI responds.
6. Session ends after timer completion or when **End** is pressed.

---

## 🔐 Environment Variables

| Variable               | Description  | Required |
| ---------------------- | ------------ | -------- |
| REACT_APP_GROQ_API_KEY | Groq API Key | Yes      |

---

## 📌 Design Principles

* Kid-friendly interaction model
* Minimal cognitive load UI
* Voice-first conversational experience
* Context-restricted AI behavior
* Zero backend architecture

---

## 📦 Deployment

The project is deployed on **Vercel**:

https://ai-child-conversation-2nnzyhbz9-shivangs-projects-f8cf7eb3.vercel.app/

---

## 📄 License

This project is created for educational and experimental purposes.
