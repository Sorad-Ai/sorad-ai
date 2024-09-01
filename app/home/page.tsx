// app/page.tsx
"use client"; // This directive ensures the file is run on the client-side

import { useState, useRef, useEffect } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';

export default function HomePage() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null); // Store the media stream to stop the camera

  useEffect(() => {
    let camera: Camera | null = null;
    let hands: Hands | null = null;

    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        mediaStreamRef.current = stream; // Store the stream reference

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          // Wait for video to be ready before setting up the canvas and hand tracking
          videoRef.current.onloadedmetadata = () => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;

              // Initialize MediaPipe Hands
              hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
              });

              hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7,
              });

              hands.onResults((results) => {
                // Safeguard to check for null references
                if (canvasRef.current && videoRef.current) {
                  const canvasCtx = canvasRef.current.getContext('2d');
                  if (canvasCtx) {
                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    canvasCtx.drawImage(
                      videoRef.current,
                      0,
                      0,
                      canvasRef.current.width,
                      canvasRef.current.height
                    );

                    if (results.multiHandLandmarks) {
                      for (const landmarks of results.multiHandLandmarks) {
                        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
                        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
                      }
                    }
                    canvasCtx.restore();
                  }
                }
              });

              camera = new Camera(videoRef.current, {
                onFrame: async () => {
                  if (hands && videoRef.current) {
                    await hands.send({ image: videoRef.current });
                  }
                },
                width: 640,
                height: 480,
              });
              camera.start();
            }
          };
        }
      }
    };

    const stopCamera = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop()); // Stop all tracks to turn off the camera
        mediaStreamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (hands) {
        hands.close();
      }

      if (camera) {
        camera.stop();
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
      <div style={{ position: 'relative' }}>
        {isCameraOn && (
          <>
            <video ref={videoRef} style={{ display: 'none' }} />
            <canvas ref={canvasRef} style={{ width: '100%' }} />
          </>
        )}
      </div>
    </div>
  );
}
