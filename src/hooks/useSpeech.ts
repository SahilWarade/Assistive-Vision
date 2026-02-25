import React, { useState, useCallback, useRef, useEffect } from 'react';

export const LANGUAGE_CONFIG = {
  'English': { code: 'en-IN', voice: 'meera', confirmText: 'I will now speak in English.' },
  'Hindi': { code: 'hi-IN', voice: 'meera', confirmText: 'अब मैं हिंदी में बात करूँगा।' },
  'Marathi': { code: 'mr-IN', voice: 'meera', confirmText: 'आता मी मराठीत बोलेन.' },
  'Tamil': { code: 'ta-IN', voice: 'meera', confirmText: 'இப்போது நான் தமிழில் பேசுவேன்.' },
  'Telugu': { code: 'te-IN', voice: 'meera', confirmText: 'ఇప్పుడు నేను తెలుగులో మాట్లాడతాను.' },
  'Bengali': { code: 'bn-IN', voice: 'meera', confirmText: 'এখন আমি বাংলায় কথা বলব।' }
};

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

  return { speak, listen, stopSpeaking, stopListening, isListening, isSpeaking, transcript };
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
