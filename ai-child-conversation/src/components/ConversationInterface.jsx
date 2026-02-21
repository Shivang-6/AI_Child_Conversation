import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { FaMicrophone, FaStop, FaVolumeUp } from 'react-icons/fa';
import { useImageContext } from '../context/ImageContext';
import { useConversation } from '../hooks/useConversation';

const ConversationInterface = ({ onShowAnimation }) => {
  const {
    isListening,
    aiMessage,
    userMessage,
    startListening,
    stopListening,
    speak,
    conversationHistory,
    timer,
    imageContext
  } = useConversation();
  const { imageData, setSelectedAnimal } = useImageContext();

  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const messagesEndRef = useRef(null);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      stopListening();
      speak("Great talking with you! Bye bye! 👋");
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, stopListening, speak]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Highlight animals mentioned by the assistant
  useEffect(() => {
    const last = conversationHistory[conversationHistory.length - 1];
    if (last?.role === 'assistant') {
      const content = (last.content || '').toLowerCase();
      const match = imageData?.animals?.find(a => content.includes(a.name.toLowerCase()));
      if (match) {
        setSelectedAnimal(match);
      }
    }
  }, [conversationHistory, imageData, setSelectedAnimal]);

  const handleStartConversation = () => {
    setIsActive(true);
    setTimeLeft(60);
    startListening();
    
    // AI initiates conversation about the image
    setTimeout(() => {
      const firstAnimal = imageData?.animals?.[0]?.name;
      if (firstAnimal) {
        speak(`Hi there! Let's talk about the picture. I see a ${firstAnimal}. What do you notice?`);
      } else {
        speak('Hi there! Let us look at the picture together. What do you see?');
      }
    }, 500);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-blue-50 rounded-2xl p-4 shadow-inner space-y-4">
      {/* Timer */}
      <div className="text-center">
        <div className="inline-block bg-white rounded-full px-6 py-2 shadow-md">
          <span className="text-2xl font-bold text-blue-600">
            ⏰ {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Conversation Display */}
      <div className="h-[520px] overflow-y-auto p-3 bg-white rounded-xl shadow-sm">
        <AnimatePresence>
          {conversationHistory.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-green-400 text-white rounded-br-none'
                    : 'bg-violet-200 text-violet-900 rounded-bl-none border border-violet-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {msg.role === 'assistant' && <FaVolumeUp className="text-white" />}
                  <span>{msg.content}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Current Speech Indicator */}
      <div className="text-center">
        {isListening && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="inline-flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-full"
          >
            <FaMicrophone className="animate-pulse" />
            <span>Listening...</span>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {!isActive ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartConversation}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center space-x-2"
          >
            <FaMicrophone />
            <span>Start Talking!</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsActive(false);
              stopListening();
              speak("Bye bye! 👋");
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center space-x-2"
          >
            <FaStop />
            <span>Stop</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default ConversationInterface;
