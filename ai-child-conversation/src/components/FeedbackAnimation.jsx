import { motion } from 'framer-motion';
import { useEffect } from 'react';

const FeedbackAnimation = ({ type, data, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, (data.duration || 2) * 1000);

    return () => clearTimeout(timer);
  }, [data.duration, onComplete]);

  if (type === 'animation' && data.name === 'happy') {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
      >
        <div className="text-8xl animate-bounce">
          😊
        </div>
        <div className="text-4xl text-yellow-500 mt-4">
          Great job!
        </div>
      </motion.div>
    );
  }

  if (type === 'reward' && data.name === 'stars') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
      >
        <div className="flex space-x-2">
          {[...Array(data.count || 3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.2 }}
              className="text-6xl animate-pulse"
            >
              ⭐
            </motion.div>
          ))}
        </div>
        <div className="text-3xl text-purple-600 mt-4 text-center">
          You're a star!
        </div>
      </motion.div>
    );
  }

  return null;
};

export default FeedbackAnimation;
