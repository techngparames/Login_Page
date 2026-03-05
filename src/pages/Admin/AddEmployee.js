// frontend/src/pages/Admin/AddEmployee.js
import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { FaEnvelope } from "react-icons/fa";
import axios from "axios";

const AddEmployee = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteId, setInviteId] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");

  // ================= SEND INVITE FUNCTION =================
  const handleSendInvite = async () => {
    if (!inviteName || !inviteEmail || !inviteId) {
      setInviteStatus("Please fill all fields ❌");
      return;
    }

    setInviteStatus("Sending invite... 📧");
    try {
      const faceLoginLink = `http://localhost:3000/face-login?name=${encodeURIComponent(
        inviteName
      )}&email=${encodeURIComponent(inviteEmail)}&empId=${encodeURIComponent(inviteId)}`;

      const response = await axios.post("http://localhost:5050/api/admin/send-invite", {
        name: inviteName,
        email: inviteEmail,
        empId: inviteId,
        faceLoginLink,
      });

      setInviteStatus(response.data.message || "Invite sent ✅");
      setInviteName("");
      setInviteEmail("");
      setInviteId("");
    } catch (err) {
      console.error(err);
      setInviteStatus("Failed to send invite ❌");
    }
  };

  return (
    <AdminLayout>
      <div style={styles.page}>
        <h1 style={styles.heading}>Add Employee</h1>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
          {/* SEND INVITE CARD */}
          <div
            style={{ ...styles.card, backgroundColor: "#f39c12", minWidth: "300px" }} // Vibrant orange & wider
            onClick={() => setActiveSection(activeSection === "invite" ? null : "invite")}
          >
            <FaEnvelope size={40} style={{ marginBottom: "10px" }} />
            <div style={{ fontSize: "20px", fontWeight: 600 }}>Send Invite Mail</div>
            <div style={{ fontSize: "16px" }}>Send login invitation</div>
          </div>
        </div>

        {/* ================= INVITE FORM ================= */}
        {activeSection === "invite" && (
          <div style={styles.formCard}>
            <h3 style={{ color: "#f39c12", marginBottom: "15px" }}>Send Invite</h3>
            <input
              type="text"
              placeholder="Employee Name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              style={styles.input}
            />
            <input
              type="email"
              placeholder="Employee Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Employee ID"
              value={inviteId}
              onChange={(e) => setInviteId(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleSendInvite} style={styles.button}>
              Send Invite
            </button>
            {inviteStatus && (
              <p
                style={{
                  marginTop: "15px",
                  color: inviteStatus.includes("sent") ? "green" : "red",
                }}
              >
                {inviteStatus}
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const styles = {
  page: { minHeight: "80vh", background: "#f4f7ff", padding: "40px" },
  heading: { textAlign: "center", marginBottom: "30px", color: "#1565c0" },
  card: {
    flex: "1",
    minWidth: "250px",
    maxWidth: "350px", // made card broader
    margin: "15px",
    padding: "25px",
    borderRadius: "15px",
    color: "#fff",
    boxShadow: "0 8px 16px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  formCard: {
    marginTop: "30px",
    padding: "25px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    maxWidth: "500px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#f39c12",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default AddEmployee;