// frontend/src/components/FaceEnroll.js
import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";
import * as tf from "@tensorflow/tfjs";
import { useSearchParams } from "react-router-dom";

const TECHNG_LOCATION = { lat: 13.0115, lng: 80.2368 };

const FaceEnroll = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState("Ready to scan your face");
  const [loading, setLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [scannedDescriptor, setScannedDescriptor] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const [searchParams] = useSearchParams();
  const name = searchParams.get("name") || "";
  const email = searchParams.get("email") || "";
  const empId = searchParams.get("empId") || "";

  // ================= INIT MODELS =================
  useEffect(() => {
    const initModels = async () => {
      try {
        await tf.setBackend("webgl");
        await tf.ready();
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsReady(true);
        setStatus("AI Models Ready ✅ Click 'Scan Face'");
      } catch (err) {
        console.error("Model load error:", err);
        setStatus("AI Initialization Failed ❌");
      }
    };
    initModels();
  }, []);

  // ================= START / STOP CAMERA =================
  const startCamera = async () => {
    if (!modelsReady) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          resolve();
        };
      });
      setCameraActive(true);
      setStatus("Camera is active. Look at the camera 👀");
    } catch (err) {
      console.error("Camera error:", err);
      setStatus("Camera access denied ❌");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // ================= SCAN FACE =================
  const scanFaceDescriptor = async () => {
    setLoading(true);
    await startCamera();
    setStatus("Scanning face...");

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          clearInterval(interval);
          const descriptor = Array.from(detection.descriptor);

          if (descriptor.length !== 128) {
            setStatus("Face not detected properly ❌ Try again");
            setLoading(false);
            return;
          }

          setScannedDescriptor(descriptor);
          setStatus("Face scanned ✅ Ready to register");
          stopCamera();
          setLoading(false);
          resolve(descriptor);
        }
      }, 500);
    });
  };

  // ================= REGISTER FACE =================
  const handleRegister = async () => {
    if (!name || !email) {
      setStatus("Name & Email missing ❌");
      return;
    }

    if (!scannedDescriptor || scannedDescriptor.length !== 128) {
      setStatus("Please scan your face first ❌");
      return;
    }

    setLoading(true);
    setStatus("Registering... 📝");

    try {
      const payload = {
        employeeId: empId || null,
        name,
        email,
        faceDescriptor: scannedDescriptor,
        location: TECHNG_LOCATION,
      };

      console.log("Sending payload:", payload);

      const response = await fetch("http://localhost:5050/api/admin/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("Backend response:", data);

      if (data.success) {
        setStatus("Registration successful ✅");
      } else {
        setStatus(data.message || "Registration failed ❌");
      }
    } catch (err) {
      console.error("Register Error:", err);
      setStatus("Server error ❌");
    }
    setLoading(false);
  };

  return (
    <div style={styles.card}>
      <h2>Face Enrollment</h2>
      <p>{status}</p>

      <div style={styles.videoWrapper}>
        <video
          ref={videoRef}
          autoPlay
          muted
          width="320"
          height="240"
          style={{ ...styles.video, display: cameraActive ? "block" : "none" }}
        />
        {!cameraActive && (
          <img
            src="/placeholder.png"
            alt="Face placeholder"
            width="320"
            height="240"
            style={{ ...styles.video, objectFit: "contain" }}
          />
        )}
      </div>

      <button onClick={scanFaceDescriptor} style={styles.button}>
        {loading ? "Scanning..." : "Scan Face"}
      </button>
      <button onClick={handleRegister} style={styles.button}>
        {loading ? "Registering..." : "Register & Save"}
      </button>
    </div>
  );
};

const styles = {
  card: {
    maxWidth: "400px",
    margin: "30px auto",
    padding: "20px",
    borderRadius: "12px",
    background: "#fff",
    textAlign: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  videoWrapper: {
    position: "relative",
    width: "320px",
    height: "240px",
    margin: "0 auto 15px auto",
  },
  video: {
    borderRadius: "12px",
    border: "2px solid #1abc9c",
    width: "320px",
    height: "240px",
  },
  button: {
    width: "100%",
    padding: "12px",
    marginTop: "15px",
    backgroundColor: "#1abc9c",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default FaceEnroll;