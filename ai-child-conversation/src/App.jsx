import { useEffect, useState } from 'react';
import AudioControls from './components/AudioControls';
import ConversationInterface from './components/ConversationInterface';
import FeedbackAnimation from './components/FeedbackAnimation';
import ImageDisplay from './components/ImageDisplay';
import { ImageProvider, useImageContext } from './context/ImageContext';
import { ConversationProvider } from './hooks/useConversation';
import { subscribeToAnimations } from './services/toolService';

const AppContent = () => {
  const { imageData } = useImageContext();
  const [showAnimation, setShowAnimation] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAnimations((payload) => setShowAnimation(payload));
    return () => unsubscribe();
  }, []);

  return (
    <ConversationProvider imageContext={imageData}>
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-100 to-amber-100 px-4 py-10 md:px-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <header className="text-center space-y-2">
            <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur shadow-sm text-indigo-600 font-semibold text-sm">💬 Playful Voice Buddy</p>
            <h1 className="text-4xl md:text-5xl font-bold text-indigo-700 drop-shadow-sm">Let’s Talk About Your Picture</h1>
            <p className="text-indigo-500 text-lg">A friendly AI that chats with kids about the animals they see.</p>
          </header>

          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/* Image + info */}
            <div className="space-y-4">
              <ImageDisplay />
              <div className="grid sm:grid-cols-2 gap-3">
                <InfoCard title="Scene" text={imageData.scene?.description || 'Tell me about this picture!'} icon="🌈" />
                <InfoCard title="Mood" text={imageData.scene?.mood || 'Happy vibes'} icon="😊" />
              </div>
              <AudioControls />
            </div>

            {/* Voice panel */}
            <ConversationInterface onShowAnimation={setShowAnimation} />
          </div>

          {/* Animation Area */}
          {showAnimation && (
            <div className="mt-2">
              <FeedbackAnimation 
                type={showAnimation.type}
                data={showAnimation}
                onComplete={() => setShowAnimation(null)}
              />
            </div>
          )}
        </div>
      </div>
    </ConversationProvider>
  );
};

const InfoCard = ({ title, text, icon }) => (
  <div className="rounded-2xl bg-white/70 backdrop-blur shadow-md p-4 border border-white/60 hover:shadow-lg transition-shadow duration-200">
    <div className="flex items-center gap-3 mb-1">
      <span className="text-lg">{icon}</span>
      <p className="text-sm font-semibold text-indigo-700">{title}</p>
    </div>
    <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
  </div>
);

function App() {
  return (
    <ImageProvider>
      <AppContent />
    </ImageProvider>
  );
}

export default App;
