import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

const AudioControls = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // You would implement actual mute logic here
  };

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl p-4 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleMute}
            className="text-2xl text-purple-600 hover:text-purple-800 transition-colors"
          >
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
          <span className="font-semibold text-gray-700">Sound</span>
        </div>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-32 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mt-3 text-center text-sm text-gray-500">
        <p>🔊 Listen carefully! Your AI friend wants to talk! 🗣️</p>
      </div>
    </motion.div>
  );
};

export default AudioControls;
