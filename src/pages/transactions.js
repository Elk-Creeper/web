// App.js
import React, { useState, useEffect } from 'react';
import "./transactions.css";
import Sidebar from "../components/sidebar";
import { Link } from "react-router-dom/cjs/react-router-dom.min";
import logo from '../assets/logo.png';
import notification from '../assets/icons/Notification.png';
import { Bar } from 'react-chartjs-2';

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
    const [chartData, setChartData] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const appointmentsQuery = query(collection(firestore, "marriageCert"), orderBy("date", "desc"), limit(2));
            const querySnapshot = await getDocs(appointmentsQuery);
            const items = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Extract relevant data for the chart
            const chartLabels = items.map((item) => item.label); // Replace 'label' with the actual property name in your data
            const chartValues = items.map((item) => item.value); // Replace 'value' with the actual property name in your data

            // Set the data for the chart
            setChartData({
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Your Chart Label',
                        data: chartValues,
                        backgroundColor: 'rgba(75,192,192,0.6)',
                        borderColor: 'rgba(75,192,192,1)',
                        borderWidth: 1,
                    },
                ],
            });

            // Set the data for other components as needed
            setData(items);
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    };

    const currentDateTime = new Date();
    const formattedTime = currentDateTime.toLocaleTimeString();

    // Define chart options if needed
    const options = {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };
    
    return (
        <div className="app-container">
            <div className="sidebar">
                <Sidebar />
            </div>

            <div className='container'>
                <div className="header">
                    <div className='icons'>
                        <h2>Transactions</h2>
                        <img src={notification} alt="Notification.png" className='notif-icon' />
                        <img src={logo} alt="logo" className='account-img' />
                        <div className='account-name'><h1>Civil Regi..</h1></div>
                    </div>
                </div>

                <div className='screen'>
                    <div className="categories-container">
                        <Link to="/birthReg" className="link">
                            <button className="categories1">
                                <h6>Certificate of Live Birth</h6>
                            </button>
                        </Link>

                        <Link to="/marriageCert" className="link">
                            <button className="categories1">
                                <h6>Marriage Certificate</h6>
                            </button>
                        </Link>

                        <Link to="/deathCert" className="link">
                            <button className="categories1">
                                <h6>Certificate of Death Certificate</h6>
                            </button>
                        </Link>

                        <Link to="/businessPermit" className="link">
                            <button className="categories1">
                                <h6>Business Permit</h6>
                            </button>
                        </Link>

                        <Link to="/job" className="link"> 
                            <button className="categories1">
                                <h6>Job Application</h6>
                            </button>
                        </Link>
                    </div>
                </div> 
                
            </div> 
        </div>
    );
};

export default App;
  