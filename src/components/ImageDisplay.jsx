import { motion } from 'framer-motion';
import { useImageContext } from '../context/ImageContext';

const ImageDisplay = () => {
  const { imageData } = useImageContext();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl overflow-hidden shadow-2xl h-[540px] bg-slate-800 flex items-center justify-center"
    >
      <img
        src={imageData.imageUrl}
        alt="Picture to talk about"
        className="w-full h-full object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
};

export default ImageDisplay;