import React, { useState, useEffect } from "react";
import "./dashboard.css";
import logo from "../assets/logo.png";
import Footer from "../components/footer";
import notification from "../assets/icons/Notification.png";
import useAuth from "../components/useAuth";
import Chart from "react-apexcharts";
import ReactApexChart from "react-apexcharts";
import "apexcharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faTimes } from "@fortawesome/free-solid-svg-icons";
import Gravatar from "react-gravatar";
import { Link, useLocation, useHistory } from "react-router-dom";
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

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsIqHHA8727cGeTjr0dUQQmttqJ2nW_IE",
  authDomain: "muniserve-4dc11.firebaseapp.com",
  projectId: "muniserve-4dc11",
  storageBucket: "muniserve-4dc11.appspot.com",
  messagingSenderId: "874813480248",
  appId: "1:874813480248:web:edd1ff1f128b5bb4a2b5cd",
  measurementId: "G-LS66HXR3GT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const Dashboard = ({ count }) => {
  // State to hold the fetched data
  const [data, setData] = useState([]);
  const [localData, setLocalData] = useState([]);
  const [dayTransactions, setDayTransactions] = useState(0);
  const [weekTransactions, setWeekTransactions] = useState(0);
  const [monthTransactions, setMonthTransactions] = useState(0);
  const [yearTransactions, setYearTransactions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const history = useHistory();

  // Function for the account name
  const { user } = useAuth();
  const [userEmail, setUserEmail] = useState("");

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
              <a href="dashboard">Home</a>
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

      <div className="headings">
        <h4
          style={{ textAlign: "center", color: "black", marginBottom: "30px" }}
        >
          Privacy Policy
        </h4>
      </div>

      <div className="terms">
        <p>
          This Privacy Policy outlines how we collect, use, disclose, and manage
          your personal information. Your privacy is important to us, and we are
          committed to protecting the confidentiality and security of your
          personal data.
        </p>
        <h4> Information We Collect:</h4>
        <h4>1. Employee Identification:</h4>
        <p>
          We collect personal information, including your name, contact details,
          employee ID, and other relevant identification details for employee
          portal access.
        </p>
        <h4>2. Employment Records:</h4>
        <p>
          Information related to your employment, including job title,
          department, salary, and work schedule, is collected and stored
          securely.
        </p>
        <h4>3. Authentication Data:</h4>
        <p>
          To ensure the security of your account, we collect and store
          authentication data, including usernames and encrypted passwords.
        </p>
        <h4>How We Use Your Information</h4>
        <h4>1. Employee Services:</h4>
        <p>
          Your information is used for facilitating employee services, including
          payroll processing, benefits administration, and communication related
          to employment matters.
        </p>
        <h4>2. Portal Security:</h4>
        <p>
          Authentication data is used to ensure secure access to the employee
          portal, protecting your personal information from unauthorized access.
        </p>
        <h4>3. Compliance with Employment Laws:</h4>
        <p>
          We may process your data to comply with local employment laws and
          regulations.
        </p>
        <h4>Information Sharing:</h4>
        <h4>1. Internal Sharing:</h4>
        <p>
          Your information may be shared within the municipality for
          administrative and operational purposes.
        </p>
        <h4>2. Third-Party Service Providers:</h4>
        <p>
          Certain tasks, such as payroll processing, may involve third-party
          service providers who adhere to confidentiality and data protection
          agreements.
        </p>
        <h4>Data Security:</h4>
        <h4>1. Security Measures:</h4>
        <p>
          Robust security measures are implemented to safeguard your personal
          information from unauthorized access, disclosure, alteration, and
          destruction.
        </p>
        <h4>2. Data Retention:</h4>
        <p>
          Your information is retained for the duration necessary to fulfill the
          purposes outlined in this policy or as required by law.
        </p>
        <h4>Your Rights:</h4>
        <h4>1. Access and Correction:</h4>
        <p>
          You have the right to access and correct your personal information.{" "}
        </p>
        <h4>2. Withdrawal of Consent:</h4>
        <p>
          You may withdraw consent for specific data processing activities,
          understanding that it may impact certain employee portal
          functionalities.
        </p>
        <h4>Changes to the Privacy Policy:</h4>
        <p>
          This Privacy Policy may be updated periodically to reflect changes in
          our practices. We will notify you of significant changes.
        </p>
        <h4>Contact Information:</h4>
        <p>
          For questions or concerns regarding this Privacy Policy, please
          contact:{" "}
        </p>
        <ul>
          <li>
            Email: <a href="bytetech000@gmail.com">bytetech000@gmail.com</a>
          </li>
          <li>Phone: 09925691965</li>
        </ul>
        <p>
          By using the Del Gallego, Camarines Sur E-Service Platform Employee
          Portal, you agree to the terms outlined in this Privacy Policy.
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
