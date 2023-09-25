import logo from '../assets/logo.png';
import slider1 from '../assets/slider1.png';
import slider2 from '../assets/slider2.png';
import slider3 from '../assets/slider3.png';
import '../styles/style.css';
import Signup from './signup';
import { FaEnvelope, FaLock } from 'react-icons/fa'; // Import icons
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom'


function Login() {  
    // State to manage form inputs
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Function to handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission here (e.g., send data to the server)
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
                <h3>Welcome to MuniServe!</h3>
                <h6>Please login to continue.</h6>
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
                        
                        <button type="submit" className="my-button">Login</button>
                    </form>
                    <div className="forgot-password">
                        <a href="/forgot-passwords">Forgot Password?</a>
                    </div>
                    <h6>
                        Don't have an account yet? <a href='/signup'>Signup</a>
                    </h6>
                </div>
            </div>
    </div>
    );
}

export default Login;