"use client";

import { useEffect, useRef, useState } from 'react';
import * as handpose from '@mediapipe/hands';
import * as camUtils from '@mediapipe/camera_utils';

const HomePage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const handsRef = useRef<handpose.Hands | null>(null);
  const cameraRef = useRef<camUtils.Camera | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initMediaPipe = async () => {
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
    };

    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && isCameraOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          streamRef.current = stream;

          if (!cameraRef.current && videoRef.current) {
            cameraRef.current = new camUtils.Camera(videoRef.current, {
              onFrame: async () => {
                if (handsRef.current && videoRef.current) {
                  try {
                    await handsRef.current.send({ image: videoRef.current });
                  } catch (error) {
                    console.error('Error sending frame to MediaPipe:', error);
                  }
                }
              },
            });

            cameraRef.current.start();
          }
        } catch (error) {
          console.error('Error accessing the camera:', error);
        }
      } else {
        stopCamera();
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

      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }

      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }

      if (canvasRef.current) {
        const canvasCtx = canvasRef.current.getContext('2d');
        if (canvasCtx) {
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    };

    const onResults = (results: handpose.Results) => {
      if (canvasRef.current) {
        const canvasCtx = canvasRef.current.getContext('2d');
        if (canvasCtx) {
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          canvasCtx.drawImage(
            results.image,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );

          if (results.multiHandLandmarks) {
            results.multiHandLandmarks.forEach((landmarks) => {
              drawLandmarks(canvasCtx, landmarks);
            });
          }
        }
      }
    };

    const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: handpose.NormalizedLandmarkList) => {
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        landmarks.forEach((landmark) => {
          const x = landmark.x * canvasRef.current!.width;
          const y = landmark.y * canvasRef.current!.height;

          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        });
      }
    };

    const manageCamera = async () => {
      if (isCameraOn) {
        // Delay MediaPipe initialization and camera start
        await new Promise(resolve => setTimeout(resolve, 100)); // Adjust delay if needed
        await initMediaPipe();
        await startCamera();
      } else {
        stopCamera();
      }
    };

    manageCamera();

    return () => {
      stopCamera();
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
        style={{ display: 'none' }} // Hide the video element
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
