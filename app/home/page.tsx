"use client"; // This directive ensures the file is run on the client-side

import { useState, useRef, useEffect } from 'react';

export default function HomePage() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadScripts = async () => {
      // Load TensorFlow.js
      const tfScript = document.createElement('script');
      tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js';
      document.body.appendChild(tfScript);

      // Load MediaPipe Hands
      const mpHandsScript = document.createElement('script');
      mpHandsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.3.1620558014/hands.min.js';
      document.body.appendChild(mpHandsScript);

      return new Promise<void>((resolve) => {
        tfScript.onload = () => {
          mpHandsScript.onload = () => {
            resolve();
          };
        };
      });
    };

    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    };

    const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
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

  useEffect(() => {
    const runHandTracking = async () => {
      if (!isCameraOn || !videoRef.current || !canvasRef.current) return;

      await loadScripts();

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Initialize MediaPipe Hands
      const hands = new (window as any).Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.3.1620558014/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results: any) => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            drawHandLandmarks(context, landmarks);
          }
        }
      });

      const detectHands = async () => {
        while (isCameraOn) {
          await hands.send({ image: video });
          await new Promise(requestAnimationFrame);
        }
      };

      detectHands();
    };

    runHandTracking();
  }, [isCameraOn]);

  const drawHandLandmarks = (context: CanvasRenderingContext2D, landmarks: any) => {
    context.strokeStyle = '#FF0000';
    context.lineWidth = 2;
    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i];
      context.beginPath();
      context.arc(landmark.x * context.canvas.width, landmark.y * context.canvas.height, 5, 0, 2 * Math.PI);
      context.stroke();
    }
  };

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
        <>
          <video ref={videoRef} style={{ width: '100%', display: 'none' }} />
          <canvas ref={canvasRef} style={{ width: '100%' }} />
        </>
      )}
    </div>
  );
}
