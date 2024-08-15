import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import Footer from "../components/footer";
import notification from "../assets/icons/Notification.png";
import useAuth from "../components/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useHistory } from "react-router-dom";
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
      <style>
        {`
          .container {
            font-family: Arial, sans-serif;
            width: 100%;
            margin: 0 auto;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            backgroundColor: "#f0f0f0",
            padding: 20px;
            margin-bottom: 50px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 10px;
          }

          .SidebarLogo {
            width: 50px;
            height: 50px;
          }

          .SidebarTitle {
            font-size: 1.5rem;
            font-weight: bold;
            color: #333333;
          }

          .horizontal-nav ul {
            list-style-type: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .horizontal-nav ul li {
            margin-right: 20px;
          }

          .dropdown-content {
            display: none;
            position: absolute;
            background-color: #ffffff;
            min-width: 160px;
            box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
            z-index: 1;
            border-radius: 5px;
            padding: 10px 0;
          }

          .dropdown-content a {
            color: #333333;
            padding: 12px 16px;
            text-decoration: none;
            display: block;
          }

          .dropdown-content a:hover {
            background-color: #307A59;
          }

          .dropdown:hover .dropdown-content {
            display: block;
          }

          .icons {
            display: flex;
            align-items: center;
          }

          .notif-icon {
            width: 30px;
            height: auto;
            margin-right: 20px;
          }

          .account-name {
            display: flex;
            align-items: center;
          }

          .dropdown-arrow {
            cursor: pointer;
          }

          .modal-content {
            position: absolute;
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #cccccc;
            z-index: 1;
            top: 100%;
            right: 0;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .close-buttons {
            background-color: transparent;
            border: none;
            cursor: pointer;
            position: absolute;
            top: 10px;
            right: 10px;
          }

          .headings {
            margin-bottom: 40px; /
          }

          .faq-section {
            display: flex;
           flex-wrap: wrap;
           justify-content: center;
           gap: 30px;
           margin-bottom: 80px;
          }

          .faq-box {
            background-color: #ffffff; 
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            width: 300px;
            text-align: center; 
          }

          h3 {
            margin-bottom: 10px;
            font-size: 20px;
            color: #333333;
          }
        `}
      </style>

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

      <div>
        <h4
          style={{
            textAlign: "center",
            color: "#333",
            fontWeight: "bold",
            marginTop: "120px",
            marginBottom: "50px",
          }}
        >
          FREQUENTLY ASKED QUESTIONS
        </h4>
      </div>

      <div className="faq-section">
        <div className="faq-box">
          <h3>1. How do I log in to the employee portal?</h3>
          <p style={{lineHeight: "25px"}}>
            To log in, visit [your employee panel URL] and enter your username
            and password. If you encounter login issues, use the "Forgot
            Password" option or contact IT support at bytetech000@gmail.com
          </p>
        </div>

        <div className="faq-box">
          <h3>2. How can I update my personal information in the portal?</h3>
          <p>
            Navigate to the "Profile" section to update your personal details
            such as address, phone number, and emergency contact information.
          </p>
        </div>

        <div className="faq-box">
          <h3>3. Can I change my password, and how often should I do it?</h3>
          <p>
            Yes, you can change your password in the "Security" or "Account
            Settings" section. It is recommended to update your password
            regularly for security purposes.
          </p>
        </div>

        <div className="faq-box">
          <h3>4. Where can I find information about my work schedule?</h3>
          <p>
            The "Schedule" or "Work Calendar" section of the employee portal
            provides details about your work schedule. You can view your shifts,
            breaks, and any upcoming events.
          </p>
        </div>

        <div className="faq-box">
          <h3>5. What is the purpose of the municipality website?</h3>
          <p>
            The municipality website serves as a central hub for residents,
            businesses, and employees to access information, services, and
            resources related to local government activities.
          </p>
        </div>

        <div className="faq-box">
          <h3>6. How do I report technical issues or provide feedback?</h3>
          <p>
            To report technical issues or provide feedback, you can use the
            "Support" or "Feedback" section of the web portal. Submit your
            inquiry or feedback through the provided form, and our support team
            will assist you or address your feedback accordingly.
          </p>
        </div>

        <div className="faq-box">
          <h3>7. How do I submit feedback or suggestions for improvement?</h3>
          <p>
            To submit feedback or suggestions for improvement, you can use the
            "Feedback" or "Suggestions" section of the web portal. Provide
            detailed feedback about your experience, ideas for improvement, or
            suggestions for new features, and our team will review them for
            consideration.
          </p>
        </div>

        <div className="faq-box">
          <h3>8. How can I view my transaction history?</h3>
          <p>
            You can view your transaction history by accessing the
            "Transactions" section of the employee portal. This section provides
            a record of all your past transactions, including dates, types, and
            status updates.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;