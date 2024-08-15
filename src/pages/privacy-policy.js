import React, { useState, useEffect } from "react";
import "./dashboard.css";
import logo from "../assets/logo.png";
import Footer from "../components/footer";
import notification from "../assets/icons/Notification.png";
import useAuth from "../components/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Link, useHistory } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  where,
} from "firebase/firestore";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const Dashboard = ({ count }) => {
  // State to hold the fetched data
  const [userEmail, setUserEmail] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const history = useHistory();

  // Function for the account name
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserEmail = () => {
      if (user) {
        const email = user.email;
        const truncatedEmail =
          email.length > 11 ? `${email.substring(0, 11)}..` : email;
        setUserEmail(truncatedEmail);
      }
    };

    fetchUserEmail();
  }, [user]);

  // Function to toggle dropdown
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout(); // Call the logout function
    history.push("/login"); // Redirect to the login page after logout
    window.scrollTo(0, 0);
  };

  return (
    <div className="container">
      <div className="header">
        <img src={logo} alt="logo" className="SidebarLogo" />
        <div className="SidebarTitle">
          <span className="muni">MUNI</span>
          <span className="serve">SERVE</span>
        </div>

        <nav className="horizontal-nav">
          <ul>
            <li>
              <a href="home">Home</a>
            </li>
            <li className="dropdown">
              <a>Services</a>
              <div className="dropdown-content">
                <a href="/birthReg">Certificate of Live Birth</a>
                <a href="/marriageCert">Marriage Certificate</a>
                <a href="/deathCert">Death Certificate</a>
                <a href="/job">Job Application</a>
              </div>
            </li>
            <li>
              <a href="/appointments">Appointments</a>
            </li>
            <li>
              <a href="/news">News</a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
            <li className="dropdown">
              <a>Settings</a>
              <div className="dropdown-content">
                <a href="/faq">FAQ</a>
                <a href="/helps">Helps</a>
                <a href="/privacy-policy">Privacy Policy</a>
              </div>
            </li>
          </ul>
        </nav>

        <div className="icons">
          <img
            src={notification}
            alt="Notification.png"
            className="notif-icon"
          />

          <div className="account-name">
            <h1>{userEmail}</h1>
            <div className="dropdown-arrow" onClick={toggleDropdown}>
              <FontAwesomeIcon icon={faCaretDown} />
            </div>
          </div>
          {dropdownOpen && (
            <div className="modal-content">
              <ul>
                <li>
                  <a href="/account-settings">Account Settings</a>
                </li>
                <li>
                  <a onClick={handleLogout}>Logout</a>
                </li>
              </ul>
              <button className="close-buttons" onClick={toggleDropdown}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="containers">
        <h1>Privacy Policy</h1>
      </div>

      <p style={{
          lineHeight: "2",
          textAlign: "center",
          marginTop: "-10px"
        }}>
        This Privacy Policy outlines how we collect, use, disclose, and manage
          your personal information. 
          <br/> Your privacy is important to us, and we are
          committed to protecting the confidentiality and security of your
          personal data. 
          <br/> By using the Del Gallego, Camarines Sur E-Service Platform Employee
        Portal, you agree to the terms outlined in this Privacy Policy.
      </p>

      <div
        className="terms"
        style={{
          lineHeight: "1.6",
          textAlign: "justify",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "10px",
          backgroundColor: "#10643e13",
          marginTop: "20px",
        }}
      >

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "15px",
              backgroundColor: "white",
            }}
          >
            <h3
              style={{ borderBottom: "1px solid #ccc", paddingBottom: "10px" }}
            >
              Information We Collect:
            </h3>
            <ul style={{ listStyleType: "none", paddingLeft: "0" }}>
              <li>
                <strong>Employee Identification:</strong> We collect personal
                information, including your name, contact details, employee ID,
                and other relevant identification details for employee portal
                access.
              </li>
              <li>
                <strong>Employment Records:</strong> Information related to your
                employment, including job title, department, and work
                schedule, is collected and stored securely.
              </li>
              <li>
                <strong>Authentication Data:</strong> To ensure the security of
                your account, we collect and store authentication data,
                including usernames and encrypted passwords.
              </li>
            </ul>
          </div>

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "15px",
              backgroundColor: "white",
            }}
          >
            <h3
              style={{ borderBottom: "1px solid #ccc", paddingBottom: "10px" }}
            >
              How We Use Your Information:
            </h3>
            <ul style={{ listStyleType: "none", paddingLeft: "0" }}>
              <li>
                <strong>Employee Services:</strong> Your information is used for
                facilitating employee services, including payroll processing,
                benefits administration, and communication related to employment
                matters.
              </li>
              <li>
                <strong>Portal Security:</strong> Authentication data is used to
                ensure secure access to the employee portal, protecting your
                personal information from unauthorized access.
              </li>
              <li>
                <strong>Compliance with Employment Laws:</strong> We may process
                your data to comply with local employment laws and regulations.
              </li>
            </ul>
          </div>

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "15px",
              backgroundColor: "white",
            }}
          >
            <h3
              style={{ borderBottom: "1px solid #ccc", paddingBottom: "10px" }}
            >
              Changes to the Privacy Policy:
            </h3>
            <p>
              This Privacy Policy may be updated periodically to reflect changes
              in our practices. We will notify you of significant changes.
            </p>
          </div>

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "15px",
              backgroundColor: "white",
            }}
          >
            <h3
              style={{ borderBottom: "1px solid #ccc", paddingBottom: "10px" }}
            >
              Contact Information:
            </h3>
            <ul style={{ listStyleType: "none", paddingLeft: "0" }}>
              <li>
                <strong>Email:</strong>{" "}
                <a href="bytetech000@gmail.com">bytetech000@gmail.com</a>
              </li>
              <li>
                <strong>Phone:</strong> 09925691965
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
