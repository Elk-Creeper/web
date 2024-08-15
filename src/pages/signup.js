import logo from "../assets/logo.png";
import slider1 from "../assets/slider1.png";
import slider2 from "../assets/slider2.png";
import slider3 from "../assets/slider3.png";
import "../styles/style.css";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import { signInWithGoogle } from "./config";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  getAuth,
} from "firebase/auth"; // Update the path as needed
import { useHistory } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import './signup.css';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState("");
  const history = useHistory();
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, { displayName: role });

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("");
      setError("");
      setSuccess("Account created successfully!");

      // Automatically route to the login page after successful registration
      history.push("/login");
    } catch (error) {
      setError(error.message);
      setSuccess("");
    }
  };

  const images = [slider1, slider2, slider3];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextImage = (currentImage + 1) % images.length;
      setCurrentImage(nextImage);
    }, 2000);

    return () => {
      clearInterval(timer);
    };
  }, [currentImage, images]);

  return (
    <div className="App">
      <div className="App-slider">
        <img src={logo} className="App-logo" alt="logo" />

        <div className="auto-play-slider">
          {images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Image ${index + 1}`}
              className={`slide ${index === currentImage ? "active" : ""}`}
            />
          ))}
        </div>

        <h5>
          MuniServe ensures secure transaction<br></br> and great user
          experience.
        </h5>
      </div>

      <div className="Form">
        <h3>Sign Up</h3>
        <h6>
          To create an account, fill out the required information, including
          <br /> your email address and a secure password.
        </h6>
        <div className="sign">
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="icon-input">
              <FaEnvelope className="input-icons" style={{ marginLeft: '120px'}}/>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="icon-input">
              <div className="role-selection">
              <FaUser className="input-icons" style={{ marginLeft: '120px'}}/>
                <label>Select Role:</label>
                <select
                  className="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Choose a role
                  </option>
                  <option value="Civil Registrar">Civil Registrar</option>
                  <option value="HR Department">HR Department</option>
                </select>
              </div>
            </div>
            <div className="icon-input">
              <FaLock className="input-icons" style={{ marginLeft: '120px'}}/>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="icon-input">
              <FaLock className="input-icons" style={{ marginLeft: '120px'}}/>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div>
              {error && <div className="error-popup">{error}</div>}
              {success && <div className="success-popup">{success}</div>}
            </div>

            <button type="submit" className="my-button">
              Continue
            </button>
          </form>
        </div>

        <div className="sign">
          <h4> - or - </h4>
          <button className="login-with-google-btn" onClick={signInWithGoogle}>
            Sign up with Google
          </button>
        </div>

        <h6>
          Already have an account? <a href="/login">Login</a>
        </h6>
      </div>
    </div>
  );
}

export default Signup;