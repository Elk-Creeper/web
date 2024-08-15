// App.js
import React, { useState, useEffect } from "react";
import "./transactions.css";
import Sidebar from "../components/sidebar";
import { Link, useLocation, useHistory } from "react-router-dom";
import logo from "../assets/logo.png";
import notification from "../assets/icons/Notification.png";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
  limit,
} from "firebase/firestore";

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
      const appointmentsQuery = query(
        collection(firestore, "marriageCert"),
        orderBy("date", "desc"),
        limit(2)
      );
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
            label: "Your Chart Label",
            data: chartValues,
            backgroundColor: "rgba(75,192,192,0.6)",
            borderColor: "rgba(75,192,192,1)",
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
                <a href="">Services</a>
                <div className="dropdown-content">
                  <a href="/birthReg">Certificate of Live Birth</a>
                  <a href="/marriageCert">Marriage Certificate</a>
                  <a href="/deathCert">Death Certificate</a>
                  <a href="/businessPermit">Business Permit</a>
                  <a href="/job">Job Application</a>
                </div>
              </li>
              <li><a href="/appointments">Appointments</a></li>
              <li><a href="/transactions">News</a></li>
              <li><a href="/transactions">About</a></li>
              <li><a href="/transactions">Settings</a></li>
            </ul>
          </nav>

          <div className="icons">
            <img
              src={notification}
              alt="Notification.png"
              className="notif-icon"
            />

            <div className="account-name">
              <h1>Civil Regi..</h1>
            </div>
          </div>
        </div>

        <div className="screen">
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
                <h6>Death Certificate</h6>
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
