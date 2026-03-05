// frontend/src/components/FaceLogin.js
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import * as tf from "@tensorflow/tfjs";

const TECHNG_LOCATION = { lat: 13.0115, lng: 80.2368 }; // Office location

const FaceLogin = ({ onFaceEnroll }) => {
  const videoRef = useRef(null);

  const [status, setStatus] = useState("Initializing AI...");
  const [loading, setLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);

  const [descriptor, setDescriptor] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // ================= INIT MODELS =================
  useEffect(() => {
    const init = async () => {
      try {
        await tf.setBackend("webgl");
        await tf.ready();

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models")
        ]);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;

        setModelsReady(true);
        setStatus("Face Login Ready ✅");
      } catch (err) {
        console.error(err);
        setStatus("AI Initialization Failed ❌");
      }
    };
    init();
  }, []);

  // ================= FACE SCAN =================
  const scanFaceDescriptor = async () => {
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;

    const leftEye = detection.landmarks.getLeftEye();
    const rightEye = detection.landmarks.getRightEye();

    if (!eyesOpen(leftEye) || !eyesOpen(rightEye)) {
      setStatus("Eyes must be open ❌");
      return null;
    }

    return Array.from(detection.descriptor);
  };

  const eyesOpen = (eye) => {
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const A = dist(eye[1], eye[5]);
    const B = dist(eye[2], eye[4]);
    const C = dist(eye[0], eye[3]);
    const ear = (A + B) / (2.0 * C);
    return ear > 0.25;
  };

  const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ================= LOGIN =================
  const handleLogin = async () => {
    if (!modelsReady || loading) return;
    setLoading(true);
    setStatus("Scanning face... 👀");

    try {
      const scannedDescriptor = await scanFaceDescriptor();
      if (!scannedDescriptor || scannedDescriptor.length !== 128) {
        setLoading(false);
        return;
      }
      setDescriptor(scannedDescriptor);

      const location = { ...TECHNG_LOCATION };
      const distance = getDistanceMeters(location.lat, location.lng, TECHNG_LOCATION.lat, TECHNG_LOCATION.lng);
      console.log("Distance from office (meters):", distance);

      const response = await fetch("http://localhost:5050/api/face/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceDescriptor: scannedDescriptor, location })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setStatus(data.message || "Login successful ✅");

        // Add to UserDetails automatically if not already stored
        await fetch("http://localhost:5050/api/admin/add-user-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: data.user.name, 
            email: data.user.email, 
            employeeId: data.user.employeeId, 
            faceDescriptor: scannedDescriptor 
          })
        });

        setLoading(false);
        setTimeout(() => { window.location.href = "/dashboard"; }, 800);
      } else if (data.newUser) {
        setStatus("New face detected — Register now");
        setShowRegister(true);
        setLoading(false);
      } else {
        setStatus(data.message || "Login failed ❌");
        setLoading(false);
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setStatus("Server error ❌");
      setLoading(false);
    }
  };

  // ================= REGISTER =================
  const handleRegister = async () => {
    if (!name || !email) {
      setStatus("Name & Email required ❌");
      return;
    }

    if (!email.endsWith("@gmail.com")) {
      setStatus("Email is invalid ❌");
      return;
    }

    if (!descriptor) {
      setStatus("Face scan missing ❌");
      return;
    }

    setLoading(true);
    setStatus("Registering face... 📝");

    try {
      // 1️⃣ Check unique email
      const checkRes = await fetch(`http://localhost:5050/api/admin/check-email?email=${email}`);
      const checkData = await checkRes.json();
      if (!checkData.success) {
        setStatus("Email already exists ❌");
        setLoading(false);
        return;
      }

      // 2️⃣ Register face & user info
      const response = await fetch("http://localhost:5050/api/face/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceDescriptor: descriptor, name, email, location: TECHNG_LOCATION })
      });
      const data = await response.json();

      if (data.success) {
        // 3️⃣ Send descriptor to parent AddUser
        if (onFaceEnroll) onFaceEnroll(descriptor);

        // 4️⃣ Add to UserDetails with employeeId
        await fetch("http://localhost:5050/api/admin/add-user-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name, 
            email, 
            employeeId: data.user.employeeId, 
            faceDescriptor: descriptor 
          })
        });

        setStatus("Registration successful ✅");
      } else {
        setStatus(data.message || "Registration failed ❌");
      }
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setStatus("Server error ❌");
    }
    setLoading(false);
  };

  // ================= UI =================
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>TechNg Nexus 💙</h2>
        <p>{status}</p>

        <video
          ref={videoRef}
          autoPlay
          muted
          width="320"
          height="240"
          style={styles.video}
        />

        {!showRegister && (
          <button onClick={handleLogin} style={styles.button}>
            {loading ? "Scanning..." : "Login Scan"}
          </button>
        )}

        {showRegister && (
          <div>
            <input
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
            <input
              placeholder="Enter Gmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleRegister} style={styles.button}>
              {loading ? "Registering..." : "Register & Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ================= STYLES =================
const styles = {
  page: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#eef4ff" },
  card: { background: "#fff", padding: "30px", borderRadius: "20px", width: "400px", textAlign: "center", boxShadow: "0 8px 25px rgba(0,0,0,0.08)" },
  video: { borderRadius: "12px", border: "2px solid #1565c0" },
  input: { width: "100%", padding: "10px", marginTop: "10px", borderRadius: "8px", border: "1px solid #ccc" },
  button: { width: "100%", padding: "12px", marginTop: "15px", background: "#1565c0", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }
};

export default FaceLogin;