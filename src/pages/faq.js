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
        <h4 style={{textAlign: "center",color: "black", marginBottom:"30px"}}>Frequently Asked Questions</h4>
      </div>
      
      <div className="terms">
        <h3>Question: 'How do I log in to the employee portal?'</h3> 
        <p>To log in, visit [your employee panel URL] and enter your username and password. If you encounter login issues, use the "Forgot Password" option or contact IT support at bytetech000@gmail.com </p>
      
        <br/><br/>
        <h3>Question: 'How can I update my personal information in the portal?'</h3> 
        <p>Navigate to the "Profile" section to update your personal details such as address, phone number, and emergency contact information. </p>

        <br/><br/>
        <h3>Question: 'Can I change my password, and how often should I do it?'</h3> 
        <p>Yes, you can change your password in the "Security" or "Account Settings" section. It is recommended to update your password regularly for security purposes. </p>

        <br/><br/>
        <h3>Question: 'Where can I find information about my work schedule?'</h3> 
        <p>The "Schedule" or "Work Calendar" section of the employee portal provides details about your work schedule. You can view your shifts, breaks, and any upcoming events. </p>

        <br/><br/>
        <h3>Question: 'What is the purpose of the municipality website?'</h3> 
        <p>The municipality website serves as a central hub for residents, businesses, and employees to access information, services, and resources related to local government activities. </p>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
