import logo from "../assets/logo.png";
import slider1 from "../assets/slider1.png";
import slider2 from "../assets/slider2.png";
import slider3 from "../assets/slider3.png";
import '../styles/style.css';
import './login'
import { FaEnvelope, FaLock } from 'react-icons/fa'; // Import icons
import React, { useState, useEffect } from "react";
import { signInWithGoogle } from "./config";
//import { Alert } from 'react-bootstrap';
//import 'bootstrap/dist/css/bootstrap.min.css';


function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        // Check if passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        // Handle sign-up logic here
        // You can send the email and password to your authentication service

        // Reset form fields
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
    };

    const images = [slider1, slider2, slider3];

    const [currentImage, setCurrentImage] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            // Calculate the next image index
            const nextImage = (currentImage + 1) % images.length;
            setCurrentImage(nextImage);
        }, 2000); // Change the interval (in milliseconds) as needed

        return () => {
            clearInterval(timer);
        };
    }, [currentImage]);

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
                <h6>To create an account, fill out the required information, including
                    <br /> your email address and a secure password.</h6>
                <div>
                    <form onSubmit={handleSubmit}>
                        <div className="icon-input">
                            <FaEnvelope className="input-icon" />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                required
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="icon-input">
                            <FaLock className="input-icon" />
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                required
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="icon-input">
                            <FaLock className="input-icon" />
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
                    </div>
                        <button type="submit" className="my-button">
                            Continue
                        </button>
                    </form>
                </div>

                <h4> - or - </h4>
                <button class="login-with-google-btn" onClick={signInWithGoogle}>
                    Sign up with Google
                </button>

                <h6>
                    Alreaady have an account? <a href ="/login">Login</a>
                </h6>
            </div>
        </div >
    );
}

export default Signup;