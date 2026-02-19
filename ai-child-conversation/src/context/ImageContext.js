import { createContext, useContext, useMemo, useState } from 'react';

const ImageContext = createContext();

const defaultImageData = {
  imageUrl: '/images/zoo.png',
  prompt: 'happy zoo animals playing together',
  scene: {
    location: 'zoo',
    timeOfDay: 'sunny daytime',
    mood: 'playful and friendly',
    description: 'A friendly zoo photo you uploaded.',
    colors: []
  },
  animals: []
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
