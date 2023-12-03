// App.js
import React, { useState, useEffect } from 'react';
import "./transactions.css";
import Sidebar from "../components/sidebar";
import { Link } from "react-router-dom/cjs/react-router-dom.min";
import logo from '../assets/logo.png';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, orderBy, query, limit } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAsIqHHA8727cGeTjr0dUQQmttqJ2nW_IE",
    authDomain: "muniserve-4dc11.firebaseapp.com",
    projectId: "muniserve-4dc11",
    storageBucket: "muniserve-4dc11.appspot.com",
    messagingSenderId: "874813480248",
    appId: "1:874813480248:web:edd1ff1f128b5bb4a2b5cd",
    measurementId: "G-LS66HXR3GT"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const App = () => {
    const [data, setData] = useState([]);

    const fetchData = async () => {
        try {
            const appointmentsQuery = query(collection(firestore, "marriageCert"), orderBy("date", "desc"), limit(2));
            const querySnapshot = await getDocs(appointmentsQuery);
            const items = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setData(items);
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const currentDateTime = new Date();
    const formattedTime = currentDateTime.toLocaleTimeString();

    return (
        <div className="app-container">
            <div className="sidebar">
                <Sidebar />
            </div>

            <div className="main-content">
                <div className="container">
                    <h1>Service Requests and Transaction Records</h1>
                </div>

                <div className='screen'>
                    <div className="categories-container">
                        <Link to="/birthReg" className="link">
                            <button className="categories1">
                                <h5>Certificate of Live Birth</h5>
                            </button>
                        </Link>

                        <Link to="/marriageCert" className="link">
                            <button className="categories1">
                                <h5>Marriage Certificate</h5>
                            </button>
                        </Link>

                        <Link to="/deathCert" className="link">
                            <button className="categories1">
                                <h5>Certificate of Death Certificate</h5>
                            </button>
                        </Link>

                        <Link to="/businessPermit" className="link">
                            <button className="categories1">
                                <h5>Business Permit</h5>
                            </button>
                        </Link>

                        <Link to="/job" className="link">
                            <button className="categories1">
                                <h5>Job Application</h5>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
