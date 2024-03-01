import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  updatePassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import "./accounts.css";
import logo from "../assets/logo.png";
import Footer from "../components/footer";
import notification from "../assets/icons/Notification.png";
import useAuth from "../components/useAuth";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useHistory } from "react-router-dom";
import { Modal, Button, Form, Table } from "react-bootstrap";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAsIqHHA8727cGeTjr0dUQQmttqJ2nW_IE",
  authDomain: "muniserve-4dc11.firebaseapp.com",
  projectId: "muniserve-4dc11",
  storageBucket: "muniserve-4dc11.appspot.com",
  messagingSenderId: "874813480248",
  appId: "1:874813480248:web:edd1ff1f128b5bb4a2b5cd",
  measurementId: "G-LS66HXR3GT",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  // Define state variables
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  const [selectedItem, setSelectedItem] = useState({
    firstName: "",
    lastName: "",
    department: "",
    password: "",
  });

  const { user } = useAuth();
  const [userEmail, setUserEmail] = useState("");
  const history = useHistory();

  const [tableVisible, setTableVisible] = useState(true);
  const [textInput, setTextInput] = useState("");

  const [users, setUsers] = useState([]);
  const { currentUser } = auth;

  // Define showForm state variable and handleSubmit function
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Your form submission logic here
  };

  // Fetch user email and set it
  useEffect(() => {
    const fetchUserEmail = () => {
      if (user && user.email) {
        const email = user.email;
        const truncatedEmail =
          email.length > 11 ? `${email.substring(0, 11)}..` : email;
        setUserEmail(truncatedEmail);
      }
    };

    fetchUserEmail();
  }, [user]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (user) {
          const q = query(
            collection(firestore, "web_users"),
            where("email", "==", user.email)
          );
          const usersSnapshot = await getDocs(q);

          const userData = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setUsers(userData);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [firestore, user]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (currentUser) {
          const userDocRef = doc(firestore, "web_users", currentUser.email);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setSelectedItem(userData);
            setUserEmail(currentUser.email);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [currentUser, firestore]);

  // Function to toggle dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Logout function
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      history.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const [newPassword, setNewPassword] = useState(""); // State variable to hold the new password input

  // Fetch the signed-in user's password from Firebase Authentication
  const fetchUserPassword = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        user.email,
        newPassword
      );
      // Password fetched successfully
    } catch (error) {
      console.error("Error fetching user password:", error);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);

  // Function to handle opening/closing of the "Change Password" modal
  const toggleChangePasswordModal = () => {
    setIsChangePasswordModalOpen(!isChangePasswordModalOpen);
  };

  // Function to handle updating the password
  const handleUpdatePassword = async () => {
    try {
      // Display loading state while updating password
      setIsLoading(true);

      // Check if newPassword and confirmPassword are not empty
      if (newPassword.trim() === "" || confirmPassword.trim() === "") {
        alert("Please enter a new password.");
        return;
      }

      // Fetch the signed-in user's password from Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        user.email,
        currentPassword
      );

      // If re-authentication is successful, update the password
      await updatePassword(auth.currentUser, newPassword);
      console.log("Password updated successfully");

      // Close the modal after updating the password
      setIsChangePasswordModalOpen(false);
      // Reset the password fields
      setNewPassword("");
      setConfirmPassword("");

      // Display success alert message
      alert("Password changed successfully.");
    } catch (error) {
      console.error("Error updating password:", error.message);
      alert("Error updating password. Please try again.");
    } finally {
      // Hide loading state after updating password
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Your code for fetching user data or any other initialization logic
  }, []);

  const generateColor = (email) => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = "#1e756764"; // Desired color
    return color;
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

      <div className="settings">
        <form>
          <div className="head">
            <h1>Account Settings</h1>
          </div>

          <div className="flex-container">
            <div className="profile-info">
              <div
                className="profile-image"
                style={{ backgroundColor: generateColor(userEmail) }}
              >
                <span className="initials">
                  {userEmail.slice(0, 2).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="basic-info">
              <h1>Basic Information</h1>

              {users.map((user) => (
                <li key={user.id}>
                  <div className="name">
                    <label>Name:</label>
                    <input
                      value={`${user.firstName} ${user.lastName}`}
                      disabled
                    />
                  </div>

                  <div className="department">
                    <label>Department:</label>
                    <input
                      value={user.department}
                      disabled // Disabled to prevent editing
                    />
                  </div>

                  <div className="email">
                    <label>Email:</label>
                    <input
                      value={user ? user.email : ""}
                      disabled // Disabled to prevent editing
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    style={{
                      color: "blue",
                      marginLeft: "170px",
                      marginTop: "50px",
                      marginBottom: "50px",
                      textDecoration: "underline",
                      cursor: "pointer",
                      border: "none",
                      backgroundColor: "transparent",
                    }}
                  >
                    Change Password
                  </button>
                  {isChangePasswordModalOpen && (
                    <div className="modal-overlay">
                      <div className="form-container">
                        <h6 style={{fontSize: "20px", marginBottom: "30px", textAlign: "center"}}>Change Password Form</h6>
                        <form onSubmit={handleUpdatePassword}>
                          <label>
                            Current Password:
                            <input
                              type="password"
                              value={currentPassword}
                              placeholder="Enter your current password"
                              onChange={(e) =>
                                setCurrentPassword(e.target.value)
                              }
                            />
                          </label>
                          <label>
                            New Password:
                            <input
                              type="password"
                              value={newPassword}
                              placeholder="Enter your new password"
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                          </label>
                          <label>
                            Confirm Password:
                            <input
                              type="password"
                              value={confirmPassword}
                              placeholder="Re-enter your new password"
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                            />
                          </label>
                          <div className="button-form">
                            <button
                              type="submit"
                              className="adds"
                              disabled={isLoading}
                              onClick={handleUpdatePassword}
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              onClick={toggleChangePasswordModal}
                              className="adds"
                              disabled={isLoading}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}

export default Dashboard;
