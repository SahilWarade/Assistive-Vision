import { useState, useCallback } from 'react';

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Calm, slightly slower
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, []);

  const listen = useCallback((): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Explicitly request microphone permission first.
        // This helps prevent 'audio-capture' errors in iframes or certain browsers.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the tracks immediately since we only needed to trigger the permission prompt
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.warn("Microphone access denied or unavailable:", err);
        reject('audio-capture');
        return;
      }

      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        reject('Speech recognition not supported');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
        resolve(result);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        reject(event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, listen, stopSpeaking, isListening, isSpeaking, transcript };
}
