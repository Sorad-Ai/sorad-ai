"use client";

import { useEffect, useRef, useState } from 'react';

const HomePage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && isCameraOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          streamRef.current = stream;
        } catch (error) {
          console.error('Error accessing the camera:', error);
        }
      } else if (videoRef.current) {
        // Clear the video source if camera is turned off
        videoRef.current.srcObject = null;
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track); // Debug log
          track.stop();
        });
        streamRef.current = null; // Clear the stream reference
      }
    };
  }, [isCameraOn]);

  const handleCheckboxChange = () => {
    setIsCameraOn(prevState => !prevState);
  };

  return (
    <div>
      <h1>Home Page</h1>
      <label>
        <input
          type="checkbox"
          checked={isCameraOn}
          onChange={handleCheckboxChange}
        />
        Turn Camera {isCameraOn ? 'Off' : 'On'}
      </label>
      <video ref={videoRef} width="640" height="480" autoPlay></video>
    </div>
  );
};

export default HomePage;
