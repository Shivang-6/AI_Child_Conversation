import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { FaPlay, FaStop } from 'react-icons/fa';
import { useConversation } from '../hooks/useConversation';

const ConversationInterface = () => {
  const {
    isListening,
    sessionActive,
    startSession,
    endSession,
    conversationHistory
  } = useConversation();

  const [timeLeft, setTimeLeft] = useState(60);
  const messagesEndRef = useRef(null);

  // Countdown timer — runs only while session is active
  useEffect(() => {
    if (!sessionActive) return;
    setTimeLeft(60);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive, endSession]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Timer pill — visible only during active session */}
      {sessionActive && (
        <div className="flex justify-center mb-4">
          <span className="px-5 py-1.5 rounded-full bg-white/10 text-cyan-300 font-mono text-lg tracking-wide">
            {formatTime(timeLeft)}
          </span>
        </div>
      )}

      {/* Chat bubbles */}
      <div className="flex-1 overflow-y-auto px-2 space-y-3 mb-4 scrollbar-thin">
        {conversationHistory.length === 0 && !sessionActive && (
          <p className="text-center text-white/40 text-lg mt-16">
            Press <span className="text-green-400 font-semibold">Start</span> to begin!
          </p>
        )}
        <AnimatePresence>
          {conversationHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-5 py-3 text-lg leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-500 text-white rounded-3xl rounded-br-md'
                    : 'bg-white/15 text-white rounded-3xl rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Listening indicator */}
      {isListening && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="text-center text-cyan-300 text-sm mb-3"
        >
          Listening…
        </motion.p>
      )}

      {/* Start / End buttons */}
      <div className="flex justify-center gap-4 pt-2 pb-1">
        {!sessionActive ? (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={startSession}
            className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold text-xl py-4 px-10 rounded-full shadow-lg transition-colors"
          >
            <FaPlay />
            <span>Start</span>
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={endSession}
            className="flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white font-bold text-xl py-4 px-10 rounded-full shadow-lg transition-colors"
          >
            <FaStop />
            <span>End</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default ConversationInterface;
