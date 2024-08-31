// app/page.tsx
"use client"; // This directive ensures the file is run on the client-side

import { useState, useRef, useEffect } from 'react';

export default function HomePage() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Request video stream with 360p resolution
          const constraints = {
            video: {
              width: { ideal: 640 }, // Use 'ideal' to allow higher resolutions if available
              height: { ideal: 360 } // Use 'ideal' to allow higher resolutions if available
            }
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream; // Store the stream reference
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        } catch (error) {
          console.error('Error accessing the camera:', error);
        }
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera(); // Clean up the camera stream on component unmount
    };
  }, [isCameraOn]);

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={isCameraOn}
          onChange={() => setIsCameraOn(prev => !prev)}
        />
        Toggle Camera
      </label>
      {isCameraOn && (
        <video
          ref={videoRef}
          style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
          autoPlay
        />
      )}
    </div>
  );
}
