import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useImageContext } from '../context/ImageContext';

const ImageDisplay = () => {
  const { imageData, selectedAnimal, setSelectedAnimal } = useImageContext();
  const [isLoading, setIsLoading] = useState(false);

  const randomFact = useMemo(() => {
    if (!selectedAnimal || !selectedAnimal.funFacts?.length) return null;
    const idx = Math.floor(Math.random() * selectedAnimal.funFacts.length);
    return selectedAnimal.funFacts[idx];
  }, [selectedAnimal]);

  return (
    <div className="space-y-4">
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur border border-white/60"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/30 via-white/10 to-amber-100/40 animate-pulse-slow pointer-events-none" />
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-indigo-200/50 blur-3xl" />
        <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-amber-200/60 blur-3xl" />

        <div className="h-[520px] w-full relative flex items-center justify-center overflow-hidden bg-white/90 border-2 border-indigo-200 rounded-2xl">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-indigo-600 font-semibold z-10">
              Loading picture...
            </div>
          )}
          <img 
            src={imageData.imageUrl}
            alt="Story prompt visual"
            className="w-full h-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />

          {/* Floating icons */}
          <motion.div className="absolute top-4 left-4 text-2xl" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
            🌈
          </motion.div>
          <motion.div className="absolute bottom-6 right-6 text-2xl" animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 4, delay: 0.6 }}>
            ✨
          </motion.div>

          {/* Hotspots */}
          {imageData.animals?.length > 0 && imageData.animals.map((animal) => (
            <button
              key={animal.name}
              type="button"
              onClick={() => setSelectedAnimal(animal)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition ${
                selectedAnimal?.name === animal.name ? 'bg-amber-400 text-white scale-105' : 'bg-white/85 text-indigo-800 hover:scale-105'
              }`}
              style={{ left: `${animal.position.x}%`, top: `${animal.position.y}%` }}
            >
              {animal.name}
            </button>
          ))}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-5">
          <p className="text-white text-xl font-semibold drop-shadow" title={imageData.prompt}>
            {imageData.prompt}
          </p>
          {imageData.animals?.length > 0 && (
            <p className="text-white/80 text-sm">Tap a friend to explore!</p>
          )}
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-white/70 shadow p-4">
          <p className="text-sm font-semibold text-indigo-700 flex items-center gap-2">🌟 Scene</p>
          <p className="text-sm text-slate-700 mt-1">{imageData.scene?.description || 'Tell me about this picture!'}</p>
          <p className="text-xs text-slate-500 mt-1">{imageData.scene?.timeOfDay || 'Daytime'} · {imageData.scene?.location || 'Unknown place'}</p>
        </div>

        {selectedAnimal && imageData.animals?.length > 0 ? (
          <div className="rounded-2xl bg-white/80 backdrop-blur border border-white/70 shadow p-4">
            <p className="text-sm font-semibold text-indigo-700 flex items-center gap-2">🦋 {selectedAnimal.name}</p>
            <p className="text-sm text-slate-700 mt-1">{selectedAnimal.action}</p>
            {randomFact && <p className="text-sm text-amber-700 mt-2">Fun fact: {randomFact}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedAnimal.questions?.slice(0, 2).map((q) => (
                <span key={q} className="text-xs bg-indigo-50 border border-indigo-100 rounded-full px-2 py-1 text-indigo-700">
                  {q}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/80 backdrop-blur border border-white/70 shadow p-4 flex items-center text-sm text-slate-600">
            👀 Tap the picture to explore together.
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDisplay;
