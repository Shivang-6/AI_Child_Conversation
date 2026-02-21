import { useEffect, useState } from 'react';
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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 items-stretch">
          {/* Image preview */}
          <ImageDisplay />

          {/* Conversation panel */}
          <div className="flex flex-col h-[540px]">
            <ConversationInterface />
          </div>
        </div>

        {/* Feedback animation overlay */}
        {showAnimation && (
          <FeedbackAnimation
            type={showAnimation.type}
            data={showAnimation}
            onComplete={() => setShowAnimation(null)}
          />
        )}
      </div>
    </ConversationProvider>
  );
};

function App() {
  return (
    <ImageProvider>
      <AppContent />
    </ImageProvider>
  );
}

export default App;