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
            marginTop: "100px",
          }}
        >
          HELP CENTER
        </h4>
      </div>

      <div className="terms" style={{ padding: "20px" }}>
        <p style={{ fontSize: "1.1rem", marginBottom: "20px" }}>
          Welcome to the Help Center. If you have any questions or need
          assistance, you've come to the right place.
        </p>
        <section>
          <ul style={{ listStyle: "none", padding: "0" }}>
            <li
              style={{
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: "#1e7566",
                  color: "white",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: "10px",
                }}
              >
                1
              </div>
              <strong style={{ color: "#1e7566" }}>
                <a
                  href="#navigate"
                  style={{ color: "#1e7566", textDecoration: "none" }}
                >
                  How to navigate the website:
                </a>
              </strong>
            </li>
            <li
              style={{
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: "#1e7566",
                  color: "white",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: "10px",
                }}
              >
                2
              </div>
              <strong style={{ color: "#1e7566" }}>
                <a
                  href="#settings"
                  style={{ color: "#1e7566", textDecoration: "none", textAlign: "center" }}
                >
                  Account settings and customization:
                </a>
              </strong>
            </li>
            <li
              style={{
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: "#1e7566",
                  color: "white",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: "10px",
                }}
              >
                3
              </div>
              <strong style={{ color: "#1e7566" }}>
                <a
                  href="#troubleshoot"
                  style={{ color: "#1e7566", textDecoration: "none" }}
                >
                  Troubleshooting common issues:
                </a>
              </strong>
            </li>
            <li style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: "#1e7566",
                  color: "white",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: "10px",
                }}
              >
                4
              </div>
              <strong style={{ color: "#1e7566" }}>
                <a
                  href="#contact"
                  style={{ color: "#1e7566", textDecoration: "none" }}
                >
                  Contacting support:
                </a>
              </strong>
            </li>
          </ul>
        </section>

        <section
          style={{
            backgroundColor: "#f0f0f0",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            marginBottom: "30px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              color: "#1e7566",
              marginBottom: "20px",
              textTransform: "uppercase",
            }}
          >
            Can't Find What You Need?
          </h3>
          <p
            style={{
              color: "#555",
              fontSize: "1.1rem",
              lineHeight: "1.6",
              marginBottom: "20px",
            }}
          >
            If you can't find the information you need, feel free to contact our
            support team:
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ color: "#555", marginBottom: "10px" }}>
              <span style={{ fontWeight: "bold" }}>Email:</span>
              <a
                href="mailto:bytetech000@gmail.com"
                style={{
                  textDecoration: "none",
                  color: "#1e7566",
                  marginLeft: "5px",
                }}
              >
                bytetech000@gmail.com
              </a>
            </li>
            <li style={{ color: "#555" }}>
              <span style={{ fontWeight: "bold" }}>Phone:</span>
              <span style={{ color: "#1e7566", marginLeft: "5px" }}>
                09925691965
              </span>
            </li>
          </ul>
          <p
            style={{
              color: "#555",
              fontSize: "1.1rem",
              lineHeight: "1.6",
              marginTop: "20px",
            }}
          >
            Our support team is available during business hours to assist you.
          </p>
        </section>
        <div className="boxes">
          <section
            id="navigate"
            style={{
              padding: "20px",
              marginBottom: "20px",
              lineHeight: "1.5",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
            }}
          >
            <h3
              style={{
                textAlign: "center",
                marginBottom: "20px",
                color: "#1e7566",
              }}
            >
              Here's a step-by-step guide on navigating the various features
              available to you:
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                1. Employee Portal Login:
              </p>
              <p>
                Start by accessing the employee portal login page. <br />
                Enter your designated username and
                <br />
                password to securely log in.
                <br />
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                2. Dashboard Overview:
              </p>
              <p>
                Upon login, you'll be greeted by the dashboard,
                <br />
                your central hub for managing tasks and
                <br />
                notifications. The dashboard provides an
                <br />
                overview of your daily activities, pending
                <br />
                approvals, and any important announcements.
                <br />
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                3. Work Schedule:
              </p>
              <p>
                Check your work schedule in the "Schedule" or
                <br />
                "Work Calendar". Here, you can view your shifts,
                <br />
                breaks, and any upcoming events related to your duties.
                <br />
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                4. Appointments:
              </p>
              <p>
                Navigate to the "Appointments" section to review
                <br />
                and manage scheduled appointments. Here, you can
                <br />
                approve or disapprove appointments based on availability
                <br />
                and other relevant factors.
                <br />
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                5. Service Requests:
              </p>
              <p>
                Process service requests efficiently by
                <br />
                accessing the "Service Requests" section. <br />
                Review incoming requests, update their
                <br />
                status, and ensure timely responses to
                <br />
                citizen inquiries.
                <br />
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                6. Transaction Records:
              </p>
              <p>
                Check and manage transaction records in
                <br />
                the dedicated "Transactions" area. <br />
                This section allows you to track and <br />
                update the status of various transactions,
                <br />
                ensuring accurate and transparent record-keeping.
                <br />
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                7. News Management:
              </p>
              <p>
                Stay connected with citizens by utilizing
                <br />
                the "News" section. Here, you can create,
                <br />
                edit, and delete news articles. Keep the
                <br />
                community informed about important updates,
                <br />
                events, and initiatives.
                <br />
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                8. Profile Management:
              </p>
              <p>
                Ensure that your personal information
                <br />
                is up-to-date by navigating to the
                <br />
                "Profile" section. This includes contact
                <br />
                details, emergency contacts, and other
                <br />
                relevant information.
                <br />
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                9. Account Settings:
              </p>
              <p>
                For account-related activities, navigate
                <br />
                to the "Security" or "Account Settings"
                <br />
                section. Here, you can change your password
                <br />
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                10. FAQ and Support:
              </p>
              <p>
                If you have questions or encounter issues,
                <br />
                explore the "FAQ" section for answers to <br />
                common queries. For personalized assistance, <br />
                contact the IT support team using the provided
                <br />
                contact details.
                <br />
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                11. Logout:
              </p>
              <p>
                Always conclude your session by securely
                <br />
                logging out. This ensures the confidentiality
                <br />
                of sensitive information and maintains the <br />
                integrity of your account.
                <br />
              </p>
            </div>
          </section>

          <section
            id="settings"
            style={{
              padding: "20px",
              marginBottom: "20px",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                marginBottom: "30px",
                textAlign: "center",
                color: "#1e7566",
              }}
            >
              Account Settings and Customization
            </h3>
            <div style={{ marginBottom: "20px" }}>
              <p style={{ marginBottom: "10px" }}>
                This guide will help you personalize your experience and manage
                your account settings efficiently.
              </p>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                1. Accessing Account Settings:
              </p>
              <p>
                {" "}
                Begin by logging into the employee portal
                <br />
                with your username and password. Look for
                <br />
                the "Account Settings" or "Profile" section.
                <br />
              </p>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                2. Update Personal Information:
              </p>
              <p>
                Update your personal information, including
                <br />
                contact details and emergency contacts. <br />
                Ensure that all information is accurate and
                <br />
                up-to-date.
                <br />
              </p>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                3. Enhance Account Security:
              </p>
              <p>
                In the "Security" section, you can enhance
                <br />
                your account's security: Change your password
                <br />
                regularly for added protection. Enable two-factor
                <br />
                authentication if available for an extra layer
                <br />
                of security.
                <br />
              </p>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                4. Manage Email Notifications:
              </p>
              <p>
                Manage email notifications and communication
                <br />
                preferences. Choose the types of emails you
                <br />
                want to receive and the frequency of updates.
                <br />
              </p>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                5. Save Changes:
              </p>
              <p>
                After making adjustments, be sure to save
                <br />
                your changes. Some modifications may require
                <br />
                you to log out and log back in for the
                <br />
                updates to take effect.
                <br />
              </p>
            </div>
            <div>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                6. Need Help?
              </p>
              <p>
                If you encounter any challenges or
                <br />
                have questions about account settings,
                <br />
                refer to the Help Center or FAQ section.
                <br />
                For personalized assistance, contact
                <br />
                our IT support team using the
                <br />
                provided contact details.
                <br />
              </p>
            </div>
          </section>

          <section
            id="troubleshoot"
            style={{
              padding: "20px",
              marginBottom: "20px",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <p
              style={{
                fontWeight: "bold",
                marginBottom: "30px",
                textAlign: "center",
                color: "#1e7566",
              }}
            >
              Troubleshooting Common Issues
            </p>
            <p>
              If you encounter issues while using the employee panel, follow
              these steps to address common problems:
            </p>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              {" "}
              1. If, Unable to log in.
            </p>
            <p>
              Verify that you are using the
              <br />
              correct username and password.
              <br />
              Ensure that CAPS LOCK is turned off.
              <br />
              <br />
              If forgotten, use the "Forgot Password" <br />
              option or contact IT support for assistance.
              <br />
            </p>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              2. If, Dashboard is not displaying.
            </p>
            <p>
              {" "}
              Check your internet connection.
              <br />
              Clear browser cache and cookies.
              <br />
              Try accessing the panel from a different browser or device.
              <br />
            </p>

            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              3. If, Panel is slow to respond.
            </p>
            <p>
              Close unnecessary tabs or applications.
              <br />
              Clear browser cache and history.
              <br />
              Ensure your device meets the platform's system requirements.
              <br />
              <p />
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                4. If, Encounter error messages.
              </p>
              <p>
                Note the error message and try to
                <br />
                replicate the issue. Check the Help
                <br />
                Center or contact IT support with
                <br />
                details about the error.
                <br />
              </p>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                5. If, Unable to approve appointments.
              </p>
              <p>
                Ensure you have the necessary permissions.
                <br />
                Check for conflicting schedules or resource
                <br />
                availability. Review the appointment details
                <br />
                for accuracy.
                <br />
              </p>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                6. If Issues with processing service requests.
              </p>
              <p>
                Verify that all required information
                <br />
                is provided. Check for any system <br />
                notifications or updates. Contact <br />
                relevant departments for assistance <br />
                if needed.
                <br />
              </p>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                7. If, Difficulty creating, editing, or deleting news.
              </p>
              <p>
                Confirm that you have the appropriate
                <br />
                permissions. Check for any restrictions
                <br />
                on news creation or editing. Review the
                <br />
                content guidelines for news articles.
                <br />
              </p>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                8. If, Platform is temporarily unavailable.
              </p>
              <p>
                Check for announcements or status
                <br />
                updates on the platform.
                <br />
                If the issue persists, contact IT support for further
                assistance.
                <br />
              </p>
            </p>
          </section>

          <section
            id="contact"
            style={{
              padding: "20px",
              marginBottom: "20px",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <p
              style={{
                fontWeight: "bold",
                marginBottom: "10px",
                color: "#1e7566",
              }}
            >
              Contacting Support
            </p>
            <p>
              {" "}
              If you encounter challenges or have questions that require
              assistance, follow these steps to get in touch with our dedicated
              support team:
            </p>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Help Center:
            </p>
            <p>
              Before reaching out to support, explore the Help
              <br />
              Center or Frequently Asked Questions (FAQ) section.
              <br />
              Many common queries are addressed here, and you might
              <br />
              find a quick solution to your issue.
              <br />
            </p>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Contact Information:
            </p>
            <p>
              IT Support: If you cannot find the answer in the Help Center,
              <br />
              contact our IT support team directly. Look for the provided
              <br />
              contact details, which may include phone numbers, or email
              addresses.
              <br />
            </p>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Provide Details:
            </p>
            <p>
              Be Specific: When contacting support,
              <br />
              be as specific as possible about the
              <br />
              issue you are facing. Include error
              <br />
              messages, relevant dates, and any steps <br />
              you have taken to troubleshoot.
              <br />
            </p>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Office Hours:
            </p>
            <p>
              Check Availability: Confirm the operating
              <br />
              hours of the support team. If it's outside <br />
              regular office hours, check if there are
              <br />
              alternative methods for urgent issues.
              <br />
            </p>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Emergency Issues:
            </p>
            <p>
              Emergency Contacts: For critical issues or
              <br />
              emergencies, ensure you have access to
              <br />
              emergency contact information. Follow the
              <br />
              established protocols for urgent matters.
              <br />
            </p>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              6. Feedback Channels:
            </p>
            <p>
              User Feedback: If you have feedback or suggestions,
              <br />
              consider using designated channels within the platform.
              <br />
              Your input is valuable for ongoing improvements.
              <br />
            </p>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              {" "}
              7. Follow-Up:
            </p>
            <p>
              Stay Informed: After reaching out to support,
              <br />
              stay informed about the progress of your inquiry.
              <br />
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;