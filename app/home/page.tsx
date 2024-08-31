"use client"; // This directive ensures the file is run on the client-side

import { useState, useRef, useEffect } from 'react';
import Hands from '@mediapipe/hands';
import DrawingUtils from '@mediapipe/drawing_utils';

export default function HomePage() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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
      const hands = new Hands.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(results => {
        const canvas = canvasRef.current;
        if (canvas && results.multiHandLandmarks) {
          const canvasCtx = canvas.getContext('2d');
          if (canvasCtx) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            DrawingUtils.drawLandmarks(canvasCtx, results.multiHandLandmarks[0]);
          }
        }
      });

      const process = async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
          requestAnimationFrame(process);
        }
      };

      if (isCameraOn) {
        requestAnimationFrame(process);
      }
    };

    runHandTracking();
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
        <>
          <video ref={videoRef} style={{ width: '100%' }} />
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%' }} />
        </>
      )}
    </div>
  );
}
