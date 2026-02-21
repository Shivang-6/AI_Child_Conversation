import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { getGreeting, converse } from '../services/aiService';

const ConversationContext = createContext();

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within ConversationProvider');
  }
  return context;
};

export const ConversationProvider = ({ children, imageContext }) => {
  const [isListening, setIsListening] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [timer, setTimer] = useState(60);

  const historyRef = useRef([]);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const silenceTimerRef = useRef(null);
  const turnBufferRef = useRef('');
  const sessionActiveRef = useRef(false);

  // ── helpers ────────────────────────────────────────────────

  const pushHistory = useCallback((entry) => {
    historyRef.current = [...historyRef.current, entry];
    setConversationHistory([...historyRef.current]);
  }, []);

  // ── Speech synthesis (TTS) ─────────────────────────────────

  const speak = useCallback((text, onDone) => {
    if (!synthesisRef.current) return;
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    utterance.volume = 1;

    const voices = synthesisRef.current.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google UK English Female') ||
      v.name.includes('Samantha') ||
      v.name.includes('Female')
    );
    if (preferred) utterance.voice = preferred;

    if (onDone) {
      utterance.onend = () => setTimeout(onDone, 300);
    }

    setAiMessage(text);
    synthesisRef.current.speak(utterance);
  }, []);

  // ── Send user turn to Groq ────────────────────────────────

  const sendTurn = useCallback(async (text) => {
    if (!text || !sessionActiveRef.current) return;

    pushHistory({ role: 'user', content: text });
    setUserMessage(text);

    const reply = await converse({
      userMessage: text,
      conversationHistory: historyRef.current,
      imageContext: imageContext?.imageContext || imageContext
    });

    if (!sessionActiveRef.current) return; // session may have ended during API call

    pushHistory({ role: 'assistant', content: reply });

    // Stop listening while AI speaks, restart after
    stopListeningInternal();
    speak(reply, () => {
      if (sessionActiveRef.current) {
        turnBufferRef.current = '';
        startListeningInternal();
      }
    });
  }, [imageContext, pushHistory, speak]);

  // ── Silence detection (2 s) ────────────────────────────────

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (!sessionActiveRef.current) return;
      const text = turnBufferRef.current.trim();
      if (text) {
        sendTurn(text);
      }
      turnBufferRef.current = '';
    }, 2000);
  }, [sendTurn]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // ── Speech recognition (STT) ──────────────────────────────

  const initRecognition = useCallback(() => {
    if (recognitionRef.current) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex];
      const transcript = (result?.[0]?.transcript || '').trim();
      if (!transcript || !result.isFinal) return;
      turnBufferRef.current = (turnBufferRef.current + ' ' + transcript).trim();
      resetSilenceTimer();
    };

    recognition.onerror = (event) => {
      const err = event.error;
      if ((err === 'no-speech' || err === 'aborted') && sessionActiveRef.current) {
        setTimeout(() => {
          try { recognition.start(); } catch {}
        }, 300);
        return;
      }
      console.error('STT error', err);
    };

    recognition.onend = () => {
      if (sessionActiveRef.current) {
        try { recognition.start(); } catch {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
  }, [resetSilenceTimer]);

  const startListeningInternal = useCallback(() => {
    initRecognition();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {}
    }
  }, [initRecognition]);

  const stopListeningInternal = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }
  }, [clearSilenceTimer]);

  // ── startSession() ────────────────────────────────────────

  const startSession = useCallback(async () => {
    // Reset state
    historyRef.current = [];
    turnBufferRef.current = '';
    setConversationHistory([]);
    setAiMessage('');
    setUserMessage('');
    setTimer(60);
    setSessionActive(true);
    sessionActiveRef.current = true;

    // Get AI greeting directly from Groq
    const greeting = await getGreeting(
      imageContext?.imageContext || imageContext || 'happy zoo animals playing together'
    );

    if (!sessionActiveRef.current) return; // session ended while waiting

    pushHistory({ role: 'assistant', content: greeting });

    // Speak the greeting, then start listening
    speak(greeting, () => {
      if (sessionActiveRef.current) {
        turnBufferRef.current = '';
        startListeningInternal();
      }
    });
  }, [imageContext, pushHistory, speak, startListeningInternal]);

  // ── endSession() ──────────────────────────────────────────

  const endSession = useCallback(() => {
    sessionActiveRef.current = false;
    setSessionActive(false);

    stopListeningInternal();
    clearSilenceTimer();
    turnBufferRef.current = '';

    synthesisRef.current?.cancel();
  }, [stopListeningInternal, clearSilenceTimer]);

  // ── context value ─────────────────────────────────────────

  return (
    <ConversationContext.Provider value={{
      isListening,
      sessionActive,
      aiMessage,
      userMessage,
      conversationHistory,
      timer,
      setTimer,
      imageContext,
      startListening: startListeningInternal,
      stopListening: stopListeningInternal,
      startSession,
      endSession,
      speak
    }}>
      {children}
    </ConversationContext.Provider>
  );
};
