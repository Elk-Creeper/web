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
          Help Center
        </h4>
      </div>

      <div className="terms">
        <p>
          Welcome to the Help Center. If you have any questions or need
          assistance, you've come to the right place.
        </p>

        <section>
          <ul>
            <li>
              <strong>
                1. <a href="#navigate">How to navigate the website:</a>
              </strong>{" "}
            </li>
            <li>
              <strong>
                2. <a href="#settings">Account settings and customization:</a>
              </strong>
            </li>
            <li>
              <strong>
                3. <a href="#troubleshoot">Troubleshooting common issues:</a>
              </strong>{" "}
            </li>
            <li>
              <strong>
                4. <a href="#contact">Contacting support:</a>
              </strong>{" "}
            </li>
          </ul>
        </section>

        <section>
          <h3>Can't Find What You Need?</h3>
          <p>
            If you can't find the information you need, feel free to contact our
            support team:
          </p>
          <ul>
            <li>
              Email: <a href="bytetech000@gmail.com">bytetech000@gmail.com</a>
            </li>
            <li>Phone: 09925691965</li>
          </ul>
          <p>
            Our support team is available during business hours to assist you.
          </p>
        </section>

        <section id="navigate">
          <h3>How to Navigate the Website</h3>
          <p>
            Here's a step-by-step guide on navigating the various features
            available to you:
          </p>
          <h4>1. Login:</h4>
          <p>
            Start by accessing the employee portal login page. Enter your
            designated username and password to securely log in.
          </p>
          <h4>2. Dashboard:</h4>
          <p>
            Upon login, you'll be greeted by the dashboard, your central hub for
            managing tasks and notifications. The dashboard provides an overview
            of your daily activities, pending approvals, and any important
            announcements.
          </p>
          <h4>3. Work Schedule:</h4>
          <p>
            Check your work schedule in the "Schedule" or "Work Calendar". Here,
            you can view your shifts, breaks, and any upcoming events related to
            your duties.
          </p>
          <h4>4. Appointments:</h4>
          <p>
            Navigate to the "Appointments" section to review and manage
            scheduled appointments. Here, you can approve or disapprove
            appointments based on availability and other relevant factors.
          </p>
          <h4>5. Service Requests:</h4>
          <p>
            Process service requests efficiently by accessing the "Service
            Requests" section. Review incoming requests, update their status,
            and ensure timely responses to citizen inquiries.
          </p>
          <h4>6. Transaction Records:</h4>
          <p>
            Check and manage transaction records in the dedicated "Transactions"
            area. This section allows you to track and update the status of
            various transactions, ensuring accurate and transparent
            record-keeping.
          </p>
          <h4>7. News Management:</h4>
          <p>
            Stay connected with citizens by utilizing the "News" section. Here,
            you can create, edit, and delete news articles. Keep the community
            informed about important updates, events, and initiatives.
          </p>
          <h4>8. Profile Management:</h4>
          <p>
            Ensure that your personal information is up-to-date by navigating to
            the "Profile" section. This includes contact details, emergency
            contacts, and other relevant information.
          </p>
          <h4>9. Account Settings:</h4>
          <p>
            For account-related activities, navigate to the "Security" or
            "Account Settings" section. Here, you can change your password and
            update other security preferences.
          </p>
          <h4>10. FAQ and Support:</h4>
          <p>
            If you have questions or encounter issues, explore the "FAQ" section
            for answers to common queries. For personalized assistance, contact
            the IT support team using the provided contact details.
          </p>
          <h4>11. Logout:</h4>
          <p>
            Always conclude your session by securely logging out. This ensures
            the confidentiality of sensitive information and maintains the
            integrity of your account.
          </p>
        </section>

        <section id="settings">
          <h3>Account Settings and Customization</h3>
          <p>
            This guide will help you personalize your experience and manage your
            account settings efficiently.
          </p>
          <h4>1. Accessing Account Settings:</h4>
          <p>
            Begin by logging into the employee portal with your username and
            password. Look for the "Account Settings" or "Profile" section.
          </p>
          <h4>2. Profile Information:</h4>
          <p>
            Update your personal information, including contact details and
            emergency contacts. Ensure that all information is accurate and
            up-to-date.
          </p>
          <h4>3. Security Settings:</h4>
          <p>
            In the "Security" section, you can enhance your account's security:
            Change your password regularly for added protection. Enable
            two-factor authentication if available for an extra layer of
            security.
          </p>
          <h4>4. Email Preferences:</h4>
          <p>
            Manage email notifications and communication preferences. Choose the
            types of emails you want to receive and the frequency of updates.
          </p>
          <h4>5. Save Changes:</h4>
          <p>
            After making adjustments, be sure to save your changes. Some
            modifications may require you to log out and log back in for the
            updates to take effect.
          </p>
          <h4>6. Help and Support:</h4>
          <p>
            If you encounter any challenges or have questions about account
            settings, refer to the Help Center or FAQ section. For personalized
            assistance, contact our IT support team using the provided contact
            details.
          </p>
        </section>

        <section id="troubleshoot">
          <h3>Troubleshooting Common Issues</h3>
          <p>
            If you encounter issues while using the employee panel, follow these
            steps to address common problems:
          </p>
          <h4>1. Login Issues:</h4>
          <h4>Problem:</h4>
          <p>Unable to log in.</p>
          <h4>Solution:</h4>
          <p>Verify that you are using the correct username and password.</p>
          <p>Ensure that CAPS LOCK is turned off.</p>
          <p>
            If forgotten, use the "Forgot Password" option or contact IT support
            for assistance.
          </p>
          <h4>2. Dashboard Not Loading:</h4>
          <h4>Problem:</h4>
          <p>Dashboard is not displaying.</p>
          <h4>Solution:</h4>
          <p>Check your internet connection.</p>
          <p>Clear browser cache and cookies.</p>
          <p>Try accessing the panel from a different browser or device.</p>
          <h4>3. Slow Performance:</h4>
          <h4>Problem:</h4>
          <p>Panel is slow to respond.</p>
          <h4>Solution:</h4>
          <p>Close unnecessary tabs or applications.</p>
          <p>Clear browser cache and history.</p>
          <p>Ensure your device meets the platform's system requirements.</p>
          <h4>4. Error Messages:</h4>
          <h4>Problem:</h4>
          <p>Encounter error messages.</p>
          <h4>Solution:</h4>
          <p>Note the error message and try to replicate the issue.</p>
          <p>
            Check the Help Center or contact IT support with details about the
            error.
          </p>
          <h4>5. Appointment Approval Issues:</h4>
          <h4>Problem:</h4>
          <p>Unable to approve appointments.</p>
          <h4>Solution:</h4>
          <p>Ensure you have the necessary permissions.</p>
          <p>Check for conflicting schedules or resource availability.</p>
          <p>Review the appointment details for accuracy.</p>
          <h4>6. Service Request Processing:</h4>
          <h4>Problem:</h4>
          <p> Issues with processing service requests.</p>
          <h4>Solution:</h4>
          <p>Verify that all required information is provided.</p>
          <p>Check for any system notifications or updates.</p>
          <p>Contact relevant departments for assistance if needed.</p>
          <h4>7. News Management Problems:</h4>
          <h4>Problem:</h4>
          <p>Difficulty creating, editing, or deleting news.</p>
          <h4>Solution:</h4>
          <p>Confirm that you have the appropriate permissions.</p>
          <p>Check for any restrictions on news creation or editing.</p>
          <p>Review the content guidelines for news articles.</p>
          <h4>8. System Downtime:</h4>
          <h4>Problem:</h4>
          <p>Platform is temporarily unavailable.</p>
          <h4>Solution:</h4>
          <p>Check for announcements or status updates on the platform.</p>
          <p>
            If the issue persists, contact IT support for further assistance.
          </p>
        </section>

        <section id="contact">
          <h3>Contacting Support</h3>
          <p>
            {" "}
            If you encounter challenges or have questions that require
            assistance, follow these steps to get in touch with our dedicated
            support team:
          </p>
          <h4>1. Help Center:</h4>
          <p>
            First Stop: Before reaching out to support, explore the Help Center
            or Frequently Asked Questions (FAQ) section. Many common queries are
            addressed here, and you might find a quick solution to your issue.
          </p>
          <h4>2. Contact Information:</h4>
          <p>
            IT Support: If you cannot find the answer in the Help Center,
            contact our IT support team directly. Look for the provided contact
            details, which may include phone numbers, or email addresses.
          </p>
          <h4>3. Provide Details:</h4>
          <p>
            Be Specific: When contacting support, be as specific as possible
            about the issue you are facing. Include error messages, relevant
            dates, and any steps you have taken to troubleshoot.
          </p>
          <h4>4. Office Hours:</h4>
          <p>
            Check Availability: Confirm the operating hours of the support team.
            If it's outside regular office hours, check if there are alternative
            methods for urgent issues.
          </p>
          <h4>5. Emergency Issues:</h4>
          <p>
            Emergency Contacts: For critical issues or emergencies, ensure you
            have access to emergency contact information. Follow the established
            protocols for urgent matters.
          </p>
          <h4>6. Feedback Channels:</h4>
          <p>
            User Feedback: If you have feedback or suggestions, consider using
            designated channels within the platform. Your input is valuable for
            ongoing improvements.
          </p>
          <h4>7. Follow-Up:</h4>
          <p>
            Stay Informed: After reaching out to support, stay informed about
            the progress of your inquiry.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
