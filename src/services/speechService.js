// Speech utilities kept minimal; extend as needed for custom voices or locales.
export const getVoices = () => {
  if (!window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
};

export const speakOnce = (text, voice) => {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) {
    utterance.voice = voice;
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};
