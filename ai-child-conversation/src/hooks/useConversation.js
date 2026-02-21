import axios from 'axios';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

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
  const [aiMessage, setAiMessage] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [timer, setTimer] = useState(60);
  const historyRef = useRef([]);
  
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);

  // Initialize speech recognition
  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false; // reduce duplicate phrases
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event) => {
        const result = event.results[event.resultIndex];
        const transcript = (result?.[0]?.transcript || '').trim();

        if (!transcript) return;

        setUserMessage(transcript);

        // If it's a final result, send to AI once
        if (result.isFinal) {
          await sendToAI(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          speak("I didn't hear you. Want to try again?");
          // Briefly pause then restart listening
          setTimeout(() => {
            try {
              recognitionRef.current && recognitionRef.current.start();
              setIsListening(true);
            } catch (err) {
              console.error('Error restarting recognition:', err);
            }
          }, 800);
        }
      };
    }
  };

  // Send message to AI
  const sendToAI = async (message) => {
    try {
      if (!message || !message.trim()) {
        return;
      }

      const trimmed = message.trim();
      const last = historyRef.current[historyRef.current.length - 1];
      if (last?.role === 'user' && last.content === trimmed) {
        return; // avoid sending identical consecutive user messages
      }

      const userEntry = { role: 'user', content: trimmed };
      const userHistory = [...historyRef.current, userEntry];
      setConversationHistory(userHistory);
      historyRef.current = userHistory;

      const response = await axios.post(process.env.REACT_APP_API_URL || 'http://localhost:5001/api/converse', {
        userMessage: message,
        conversationHistory: userHistory,
        imageContext: imageContext || 'happy zoo animals playing together'
      });

      const aiResponse = response.data.message;
      
      const withAi = [...userHistory, { role: 'assistant', content: aiResponse }];
      setConversationHistory(withAi);
      historyRef.current = withAi;
      
      // Speak the response
      speak(aiResponse);

      // Handle any tool calls
      if (response.data.toolCalls) {
        handleToolCalls(response.data.toolCalls);
      }
    } catch (error) {
      console.error('Error sending to AI:', error);
      speak("Oops! Something went wrong. Let's try again!");
    }
  };

  // Handle tool calls for UI actions
  const handleToolCalls = (toolCalls) => {
    toolCalls.forEach(tool => {
      // Trigger UI animations through a custom event
      window.dispatchEvent(new CustomEvent('showAnimation', { 
        detail: tool 
      }));
    });
  };

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      initSpeechRecognition();
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }, []);

  // Text to speech
  const speak = useCallback((text) => {
    if (synthesisRef.current) {
      // Cancel any ongoing speech
      synthesisRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure for child-friendly voice
      utterance.rate = 0.9; // Slightly slower
      utterance.pitch = 1.2; // Higher pitch, more engaging
      utterance.volume = 1;

      // Try to find a female voice for friendlier tone
      const voices = synthesisRef.current.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google UK English Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Female')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      synthesisRef.current.speak(utterance);
    }
  }, []);

  return (
    <ConversationContext.Provider value={{
      isListening,
      aiMessage,
      userMessage,
      conversationHistory,
      timer,
      imageContext,
      startListening,
      stopListening,
      speak,
      setTimer
    }}>
      {children}
    </ConversationContext.Provider>
  );
};
