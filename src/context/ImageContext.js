import { createContext, useContext, useMemo, useState } from 'react';
import { IMAGE_CONTEXT } from './imageContextData';

const ImageContext = createContext();

const defaultImageData = {
  imageUrl: '/images/zoo.png',
  prompt: IMAGE_CONTEXT.title,
  scene: {
    location: 'zoo',
    timeOfDay: 'sunny daytime',
    mood: IMAGE_CONTEXT.mood,
    description: `A ${IMAGE_CONTEXT.style} zoo picture.`,
    colors: []
  },
  animals: IMAGE_CONTEXT.animals,
  environment: IMAGE_CONTEXT.environment,
  imageContext: IMAGE_CONTEXT
};

export const ImageProvider = ({ children }) => {
  const [imageData, setImageData] = useState(defaultImageData);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  const value = useMemo(() => ({
    imageData,
    setImageData,
    selectedAnimal,
    setSelectedAnimal
  }), [imageData, selectedAnimal]);

  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  );
};

export const useImageContext = () => {
  const ctx = useContext(ImageContext);
  if (!ctx) {
    throw new Error('useImageContext must be used within ImageProvider');
  }
  return ctx;
};
