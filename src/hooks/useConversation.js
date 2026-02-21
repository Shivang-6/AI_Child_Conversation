import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ConversationContext = createContext();

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within ConversationProvider');
  }
  return context;
};

const WS_URL = (process.env.REACT_APP_WS_URL || 'ws://localhost:5001');

export const ConversationProvider = ({ children, imageContext }) => {
  const [isListening, setIsListening] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [timer, setTimer] = useState(60);

  const historyRef = useRef([]);
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const silenceTimerRef = useRef(null);
  const turnBufferRef = useRef('');         // accumulates transcript for current turn
  const sessionActiveRef = useRef(false);   // avoids stale closure issues

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

  // ── Silence detection (2 s) ────────────────────────────────

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (!sessionActiveRef.current) return;
      const text = turnBufferRef.current.trim();
      if (text && wsRef.current?.readyState === WebSocket.OPEN) {
        // Send end_turn with accumulated transcript
        wsRef.current.send(JSON.stringify({ type: 'end_turn', transcript: text }));
        pushHistory({ role: 'user', content: text });
        setUserMessage(text);
      }
      turnBufferRef.current = '';
    }, 2000);
  }, [pushHistory]);

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
      console.error('STT error', event.error);
      if (event.error === 'no-speech' && sessionActiveRef.current) {
        // Restart automatically
        setTimeout(() => {
          try { recognition.start(); } catch {}
        }, 500);
      }
    };

    recognition.onend = () => {
      // Keep recognition alive while session is active
      if (sessionActiveRef.current) {
        try { recognition.start(); } catch {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
  }, [resetSilenceTimer]);

  const startListening = useCallback(() => {
    initRecognition();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {}
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }
  }, [clearSilenceTimer]);

  // ── WebSocket message handler ─────────────────────────────

  const handleWsMessage = useCallback((event) => {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }

    if (data.type === 'ai_greeting' || data.type === 'ai_reply') {
      pushHistory({ role: 'assistant', content: data.message });

      // Stop listening while AI speaks, restart after
      stopListening();
      speak(data.message, () => {
        if (sessionActiveRef.current) {
          turnBufferRef.current = '';
          startListening();
        }
      });
    }

    if (data.type === 'session_ended') {
      // Acknowledged by server
    }
  }, [pushHistory, speak, startListening, stopListening]);

  // ── startSession() ────────────────────────────────────────

  const startSession = useCallback(() => {
    // Reset state
    historyRef.current = [];
    turnBufferRef.current = '';
    setConversationHistory([]);
    setAiMessage('');
    setUserMessage('');
    setTimer(60);
    setSessionActive(true);
    sessionActiveRef.current = true;

    // Open WebSocket
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'ai_start',
        imageContext: imageContext?.imageContext || imageContext || 'happy zoo animals playing together'
      }));
    };

    ws.onmessage = handleWsMessage;

    ws.onclose = () => {
      if (sessionActiveRef.current) {
        // Unexpected close — mark inactive
        sessionActiveRef.current = false;
        setSessionActive(false);
        stopListening();
      }
    };

    ws.onerror = (err) => {
      console.error('WS error', err);
    };
  }, [imageContext, handleWsMessage, stopListening]);

  // ── endSession() ──────────────────────────────────────────

  const endSession = useCallback(() => {
    sessionActiveRef.current = false;
    setSessionActive(false);

    // Stop mic & timers
    stopListening();
    clearSilenceTimer();
    turnBufferRef.current = '';

    // Tell backend
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_session' }));
      wsRef.current.close();
    }
    wsRef.current = null;

    // Cancel any ongoing speech
    synthesisRef.current?.cancel();
  }, [stopListening, clearSilenceTimer]);

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
      startListening,
      stopListening,
      startSession,
      endSession,
      speak
    }}>
      {children}
    </ConversationContext.Provider>
  );
};
