import { useRef, useState, useCallback, useEffect } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        // Try to get the rear camera first
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        attachStream(stream);
      } catch (err: any) {
        console.warn("Environment camera failed, falling back to default camera:", err);
        try {
          // Fallback to any available camera (fixes OverconstrainedError on laptops)
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
          attachStream(fallbackStream);
        } catch (fallbackErr: any) {
          setError(fallbackErr.message || 'Failed to access camera');
        }
      }
    }

    function attachStream(stream: MediaStream) {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
          setError(null);
        };
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !isReady) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, [isReady]);

  return { videoRef, isReady, error, captureImage };
}
