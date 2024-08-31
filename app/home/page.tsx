"use client";

import { useEffect, useRef, useState } from 'react';
import * as handpose from '@mediapipe/hands';
import * as camUtils from '@mediapipe/camera_utils';

const HomePage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const handsRef = useRef<handpose.Hands | null>(null);
  const cameraRef = useRef<camUtils.Camera | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && isCameraOn) {
        try {
          // Start the camera stream first
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          streamRef.current = stream;

          // Initialize MediaPipe in parallel
          if (!handsRef.current) {
            handsRef.current = new handpose.Hands({
              locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            handsRef.current.setOptions({
              maxNumHands: 2,
              modelComplexity: 1,
              minDetectionConfidence: 0.5,
              minTrackingConfidence: 0.5,
            });

            handsRef.current.onResults(onResults);
          }

          // Start the MediaPipe camera processing after stream is loaded
          if (videoRef.current && !cameraRef.current) {
            cameraRef.current = new camUtils.Camera(videoRef.current, {
              onFrame: async () => {
                if (handsRef.current && videoRef.current) {
                  await handsRef.current.send({ image: videoRef.current });
                }
              },
            });
            cameraRef.current.start();
          }
        } catch (error) {
          console.error('Error accessing the camera:', error);
        }
      } else if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const onResults = (results: handpose.Results) => {
      if (canvasRef.current) {
        const canvasCtx = canvasRef.current.getContext('2d');
        canvasCtx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        canvasCtx?.drawImage(
          results.image,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            drawLandmarks(canvasCtx, landmarks);
          }
        }
      }
    };

    const drawLandmarks = (ctx: CanvasRenderingContext2D | null, landmarks: handpose.NormalizedLandmarkList) => {
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        for (let i = 0; i < landmarks.length; i++) {
          const x = landmarks[i].x * canvasRef.current!.width;
          const y = landmarks[i].y * canvasRef.current!.height;

          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }

      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
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
      <video
        ref={videoRef}
        width="640"
        height="480"
        autoPlay
        style={{ display: 'none' }}
      ></video>
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{
          transform: 'scaleX(-1)',
          marginTop: '20px',
        }}
      ></canvas>
    </div>
  );
};

export default HomePage;
