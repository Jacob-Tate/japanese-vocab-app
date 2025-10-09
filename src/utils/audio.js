// src/utils/audio.js
export const playAudio = (word) => {
  if (word.audio_filename) {
    const audio = new Audio(`/audio/${word.audio_filename}`);
    audio.play().catch(error => {
      console.error("Error playing custom audio:", error);
      // Fallback if custom audio fails to play for some reason
      speakTTS(word.japanese);
    });
  } else {
    speakTTS(word.japanese);
  }
};

const speakTTS = (text, lang = 'ja-JP') => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech to prevent overlap
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Sorry, your browser does not support text-to-speech.');
  }
};
