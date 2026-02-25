import React, { useState, useCallback, useRef, useEffect } from 'react';

export const LANGUAGE_CONFIG = {
  'English': { code: 'en-IN', voice: 'meera', confirmText: 'I will now speak in English.' },
  'Hindi': { code: 'hi-IN', voice: 'meera', confirmText: 'आपकी भाषा पसंद सुरक्षित कर दी गई है।' },
  'Marathi': { code: 'mr-IN', voice: 'meera', confirmText: 'तुमची भाषा निवड जतन केली आहे.' },
  'Tamil': { code: 'ta-IN', voice: 'meera', confirmText: 'உங்கள் மொழி விருப்பம் சேமிக்கப்பட்டது.' },
  'Telugu': { code: 'te-IN', voice: 'meera', confirmText: 'మీ భాష ఎంపిక సేవ్ చేయబడింది.' },
  'Bengali': { code: 'bn-IN', voice: 'meera', confirmText: 'আপনার ভাষা পছন্দ সংরক্ষণ করা হয়েছে।' }
};

export function parseSpokenNumber(text: string): number | null {
  const lower = text.toLowerCase().trim();
  if (lower.match(/\b(1|one|ek|एक|first)\b/)) return 1;
  if (lower.match(/\b(2|two|do|दो|second)\b/)) return 2;
  if (lower.match(/\b(3|three|teen|तीन|third)\b/)) return 3;
  if (lower.match(/\b(4|four|char|चार|fourth)\b/)) return 4;
  if (lower.match(/\b(5|five|panch|पांच|fifth)\b/)) return 5;
  if (lower.match(/\b(0|zero|shunya|शून्य|cancel)\b/)) return 0;
  
  const match = lower.match(/\d/);
  if (match) return parseInt(match[0], 10);
  
  return null;
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const speak = useCallback(async (text: string): Promise<void> => {
    setIsSpeaking(true);
    window.speechSynthesis.cancel();
    
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const currentLang = localStorage.getItem('appLanguage') || 'English';
      utterance.lang = LANGUAGE_CONFIG[currentLang as keyof typeof LANGUAGE_CONFIG]?.code || 'en-IN';
      utterance.rate = 0.9;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const listen = useCallback((): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        speak("Microphone permission required.");
        reject('audio-capture');
        return;
      }

      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        reject('Speech recognition not supported');
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      
      const currentLang = localStorage.getItem('appLanguage') || 'English';
      recognition.lang = LANGUAGE_CONFIG[currentLang as keyof typeof LANGUAGE_CONFIG]?.code || 'en-IN';

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
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
  }, [speak]);

  const speakAndListen = useCallback(async (text: string): Promise<string> => {
    await speak(text);
    return await listen();
  }, [speak, listen]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  return { speak, listen, speakAndListen, stopSpeaking, stopListening, isListening, isSpeaking, transcript };
}

export function useAccessibleButton(label: string, onActivate: () => void, speak: (text: string) => void) {
  const lastTapRef = useRef<number>(0);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent ghost clicks on mobile
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 500;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (navigator.vibrate) navigator.vibrate([50]);
      onActivate();
      lastTapRef.current = 0;
    } else {
      speak(label);
      lastTapRef.current = now;
    }
  }, [label, onActivate, speak]);

  return handleTap;
}
