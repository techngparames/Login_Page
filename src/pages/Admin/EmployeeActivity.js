import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EmployeeActivity = () => {
  const [activity, setActivity] = useState([]);

  // ================= FETCH ACTIVITY =================
  const fetchActivity = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5050/api/admin/employee-activity"
      );

      if (res.data.success) {
        setActivity(res.data.activity);
      }
    } catch (err) {
      console.error("Activity fetch error:", err);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  // ================= EXPORT ALL PDF =================
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("Employee Activity Report", 14, 15);

    const tableColumn = [
      "Date",
      "Employee Name",
      "Login Time",
      "Logout Time",
      "Total Hours",
    ];

    const tableRows = [];

    activity.forEach((emp) => {
      tableRows.push([
        emp.date,
        emp.name,
        emp.loginTime,
        emp.logoutTime,
        emp.totalHours,
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("employee_activity_report.pdf");
  };

  // ================= EXPORT SINGLE EMPLOYEE PDF =================
  const exportSinglePDF = (emp) => {
    const doc = new jsPDF();

    doc.text(`Employee Report - ${emp.name}`, 14, 15);

    const tableColumn = [
      "Date",
      "Employee Name",
      "Login Time",
      "Logout Time",
      "Total Hours",
    ];

    const tableRows = [
      [
        emp.date,
        emp.name,
        emp.loginTime,
        emp.logoutTime,
        emp.totalHours,
      ],
    ];

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save(`${emp.name}_report.pdf`);
  };

  return (
    <AdminLayout>
      <div style={{ fontFamily: "'Poppins', sans-serif" }}>
        <h1 style={{ color: "#0047ab", marginBottom: "20px" }}>
          Employee Activity
        </h1>

        {/* Export Full Report */}
        <button
          onClick={exportPDF}
          style={{
            backgroundColor: "#1a73e8",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          Export Report
        </button>

        {/* Activity Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#0047ab", color: "#fff" }}>
                <th style={{ padding: "10px" }}>Date</th>
                <th style={{ padding: "10px" }}>Employee Name</th>
                <th style={{ padding: "10px" }}>Login Time</th>
                <th style={{ padding: "10px" }}>Logout Time</th>
                <th style={{ padding: "10px" }}>Total Hours</th>
                <th style={{ padding: "10px" }}>Export</th>
              </tr>
            </thead>

            <tbody>
              {activity.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                    No Activity Found
                  </td>
                </tr>
              ) : (
                activity.map((emp, index) => (
                  <tr key={index} style={{ textAlign: "center" }}>
                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                      {emp.date}
                    </td>

                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                      {emp.name}
                    </td>

                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                      {emp.loginTime}
                    </td>

                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                      {emp.logoutTime}
                    </td>

                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                      {emp.totalHours}
                    </td>

                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                      <button
                        onClick={() => exportSinglePDF(emp)}
                        style={{
                          backgroundColor: "#20c997",
                          color: "#fff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmployeeActivity;