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

  // Function to fetch data from Firestore
  const fetchData = async () => {
    try {
      const appointmentsQuery = query(
        collection(firestore, "appointments"),
        orderBy("date", "desc"),
        limit(2)
      ); // Limit to the latest 5 appointments
      const querySnapshot = await getDocs(appointmentsQuery);
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(items);
      setLocalData(items); // Initialize localData with the fetched data
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  useEffect(() => {
    // Fetch and count transactions for the day
    fetchTransactions("day");

    // Fetch and count transactions for the week
    fetchTransactions("week");

    // Fetch and count transactions for the month
    fetchTransactions("month");

    // Fetch and count transactions for the year
    fetchTransactions("year");
    fetchData();
  }, []);

  // State for currentDateTime
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update currentDateTime every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Cleanup the interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const formattedTime = currentDateTime.toLocaleTimeString();

  const [pendingTransactions, setPendingTransactions] = useState([]);

  // Function to fetch data from Firestore
  const fetchPendingTransactions = async () => {
    try {
      const collectionDisplayNames = {
        birth_reg: "Birth Registration",
        marriage_reg: "Marriage Registration",
        job: "Job",
        marriageCert: "Marriage Certificate",
        deathCert: "Death Certificate",
        appointments: "Appointments",
      };

      const pendingTransactions = [];

      for (const collectionName of Object.keys(collectionDisplayNames)) {
        const collectionRef = collection(firestore, collectionName);
        const querySnapshot = await getDocs(
          query(collectionRef, where("status", "==", "Pending"))
        );

        const transactions = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            collection: collectionName,
            collectionDisplayName: collectionDisplayNames[collectionName],
            status: "Pending",
            ...data,
          };
        });

        pendingTransactions.push(...transactions);
      }

      setPendingTransactions(pendingTransactions);
    } catch (error) {
      console.error("Error fetching pending transactions: ", error);
    }
  };

  useEffect(() => {
    // Fetch pending transactions when the component mounts
    fetchPendingTransactions();
  }, []);

  const fetchTransactions = async (timeInterval, customDate) => {
    const currentDate = customDate || new Date();
    let startDate;
    let count; // Declare count variable

    switch (timeInterval) {
      case "day":
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        );
        break;
      case "week":
        startDate = getStartOfWeek(currentDate);
        break;
      case "month":
        startDate = getStartOfMonth(currentDate);
        break;
      case "year":
        startDate = getStartOfYear(currentDate);
        break;
      default:
        startDate = currentDate;
    }

    const transactions = await getTransactions(startDate, currentDate);
    count = transactions.length; // Assign a value to count
    updateTransactionCount(timeInterval, count);
  };

  const getStartOfWeek = (date) => {
    const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek); // Move to the start of the current week
    return startDate;
  };

  const getStartOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getStartOfYear = (date) => {
    return new Date(date.getFullYear(), 0, 1);
  };

  const getTransactions = async (startDate, endDate) => {
    const birthRegQuery = query(
      collection(firestore, "birth_reg"),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate)
    );
    const marriageCertQuery = query(
      collection(firestore, "marriageCert"),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate)
    );
    const deathCertQuery = query(
      collection(firestore, "deathCert"),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate)
    );
    const jobQuery = query(
      collection(firestore, "job"),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate)
    );
    const appointmentsQuery = query(
      collection(firestore, "appointments"),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate)
    );

    const birthRegSnapshot = await getDocs(birthRegQuery);
    const marriageCertSnapshot = await getDocs(marriageCertQuery);
    const deathCertSnapshot = await getDocs(deathCertQuery);
    const jobSnapshot = await getDocs(jobQuery);
    const appointmentsSnapshot = await getDocs(appointmentsQuery);

    const birthRegTransactions = birthRegSnapshot.docs.map((doc) => doc.data());
    const marriageCertTransactions = marriageCertSnapshot.docs.map((doc) =>
      doc.data()
    );
    const deathCertTransactions = deathCertSnapshot.docs.map((doc) =>
      doc.data()
    );
    const jobTransactions = jobSnapshot.docs.map((doc) => doc.data());
    const appointmentsTransaction = appointmentsSnapshot.docs.map((doc) =>
      doc.data()
    );

    const allTransactions = [
      ...birthRegTransactions,
      ...marriageCertTransactions,
      ...deathCertTransactions,
      ...jobTransactions,
      ...appointmentsTransaction,
    ];

    return allTransactions;
  };

  const updateTransactionCount = (timeInterval, count) => {
    switch (timeInterval) {
      case "day":
        setDayTransactions(count);
        break;
      case "week":
        setWeekTransactions(count);
        break;
      case "month":
        setMonthTransactions(count);
        break;
      case "year":
        setYearTransactions(count);
        break;
      default:
        break;
    }
  };

  const chartData = {
    day: {
      series: [dayTransactions],
      options: {
        chart: {
          type: "radialBar",
        },
        plotOptions: {
          radialBar: {
            offsetY: 0,
            startAngle: 0,
            endAngle: 360,
            hollow: {
              margin: 5,
              size: "50%",
              background: "transparent",
              image: undefined,
              imageOffsetX: 0,
              imageOffsetY: 0,
              position: "front",
            },
            dataLabels: {
              name: {
                show: true,
                fontSize: "10px",
                fontWeight: "light",
                color: "#000",
                offsetY: -5,
              },
              value: {
                show: true,
                offsetY: 5,
                color: "blue",
                fontSize: "25px",
                fontWeight: "bold",
                formatter: function (val) {
                  return val;
                },
              },
            },
          },
        },
        fill: {
          colors: ["#F2233B"],
        },
        labels: ["Today"],
      },
    },
    week: {
      series: [weekTransactions],
      options: {
        chart: {
          type: "radialBar",
        },
        plotOptions: {
          radialBar: {
            offsetY: 0,
            startAngle: 0,
            endAngle: 360,
            hollow: {
              margin: 5,
              size: "50%",
              background: "transparent",
              image: undefined,
              imageOffsetX: 0,
              imageOffsetY: 0,
              position: "front",
            },
            dataLabels: {
              name: {
                show: true,
                fontSize: "10px",
                fontWeight: "light",
                color: "#000",
                offsetY: -5,
              },
              value: {
                show: true,
                offsetY: 5,
                color: "blue",
                fontSize: "25px",
                fontWeight: "bold",
                formatter: function (val) {
                  return val;
                },
              },
            },
          },
        },
        fill: {
          colors: ["#4B07C0"],
        },
        labels: ["This Week"],
      },
    },
    month: {
      series: [monthTransactions],
      options: {
        chart: {
          type: "radialBar",
        },
        plotOptions: {
          radialBar: {
            offsetY: 0,
            startAngle: 0,
            endAngle: 360,
            hollow: {
              margin: 5,
              size: "50%",
              background: "transparent",
              image: undefined,
              imageOffsetX: 0,
              imageOffsetY: 0,
              position: "front",
            },
            dataLabels: {
              name: {
                show: true,
                fontSize: "10px",
                fontWeight: "light",
                color: "#000",
                offsetY: -5,
              },
              value: {
                show: true,
                offsetY: 5,
                color: "blue",
                fontSize: "25px",
                fontWeight: "bold",
                formatter: function (val) {
                  return val;
                },
              },
            },
          },
        },
        fill: {
          colors: ["#FF7247"], // Change the color of the radial bar
        },
        labels: ["This Month"],
      },
    },
    year: {
      series: [yearTransactions],
      options: {
        chart: {
          type: "radialBar",
        },
        plotOptions: {
          radialBar: {
            offsetY: 0,
            startAngle: 0,
            endAngle: 360,
            hollow: {
              margin: 5,
              size: "50%",
              background: "transparent",
              image: undefined,
              imageOffsetX: 0,
              imageOffsetY: 0,
              position: "front",
            },
            dataLabels: {
              name: {
                show: true,
                fontSize: "10px",
                fontWeight: "light",
                color: "#000",
                offsetY: -5,
              },
              value: {
                show: true,
                offsetY: 5,
                color: "blue",
                fontSize: "25px",
                fontWeight: "bold",
                formatter: function (val) {
                  return val;
                },
              },
            },
          },
        },
        fill: {
          colors: ["#00C853"], // Change the color of the radial bar for the year
        },
        labels: ["This Year"],
      },
    },
  };

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
                <a href="birthReg">Certificate of Live Birth</a>
                <a href="marriageCert">Marriage Certificate</a>
                <a href="deathCert">Death Certificate</a>
                <a href="job">Job Application</a>
              </div>
            </li>
            <li>
              <a href="appointments">Appointments</a>
            </li>
            <li>
              <a href="news">News</a>
            </li>
            <li>
              <a href="about">About</a>
            </li>
            <li className="dropdown">
              <a>Settings</a>
              <div className="dropdown-content">
                <a href="faq">FAQ</a>
                <a href="helps">Help</a>
                <a href="privacy-policy">Privacy Policy</a>
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
                  <a href="/account-settings">Profile</a>
                </li>
                <li>
                  <a href="/history">History</a>
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

      <div className="center">
        <div className="clock" style={{ marginLeft: "110px" }}>
          <h4>Good day, It's</h4>
          <h2>{formattedTime}</h2>
        </div>

        <div className="subhead">
          <div className="columns-container">
            <div className="column">
              <div style={{ marginLeft: "-180px" }}>Appointments</div>
              <div className="requests" style={{ marginLeft: "-180px" }}>
                {data.map((item) => (
                  <div key={item.id} className="request-item">
                    <div className="title">
                      <img src={logo} alt="logo" />
                      <h5>Appointment</h5>
                      <h3>
                        {item.createdAt && item.createdAt.seconds
                          ? new Date(
                              item.createdAt.seconds * 1000
                            ).toLocaleDateString()
                          : ""}
                      </h3>
                    </div>
                    <p>
                      {item.userName} {item.userLastName} requested for{" "}
                      {item.personnel} from {item.department} for an appointment
                      on{" "}
                      {item.date && item.date.seconds
                        ? new Date(
                            item.date.seconds * 1000
                          ).toLocaleDateString()
                        : ""}{" "}
                      at{" "}
                      {item.time && item.time.seconds
                        ? new Date(
                            item.time.seconds * 1000
                          ).toLocaleTimeString()
                        : ""}{" "}
                      regarding {item.reason}. Check the application for
                      approval.
                    </p>
                    <a href="./appointments">
                      <button className="check">Check Now</button>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Second Column */}
            <div className="column">
              <div className="reports">
                <div className="report">
                  <div className="day">
                    <Chart
                      options={chartData.day.options}
                      series={chartData.day.series}
                      type="radialBar"
                      height="200"
                    />
                  </div>
                  <div className="week">
                    <Chart
                      options={chartData.week.options}
                      series={chartData.week.series}
                      type="radialBar"
                      height="200"
                    />
                  </div>
                  <div className="month">
                    <Chart
                      options={chartData.month.options}
                      series={chartData.month.series}
                      type="radialBar"
                      height="200"
                    />
                  </div>
                  <div className="year">
                    <Chart
                      options={chartData.year.options}
                      series={chartData.year.series}
                      type="radialBar"
                      height="200"
                    />
                  </div>
                </div>
              </div>
              <div
                className="subhead"
                style={{ marginLeft: "90px", marginTop: "180px" }}
              >
                <table className="transaction-table">
                  <caption
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      marginBottom: "20px",
                    }}
                  >
                    LIST OF ALL PENDING TRANSACTIONS
                  </caption>
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th style={{ fontSize: "17px" }}>User Name</th>
                      <th style={{ fontSize: "17px" }}>Service Type</th>
                      <th style={{ fontSize: "17px" }}>Date of Application</th>
                      <th style={{ fontSize: "17px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTransactions
                      .sort(
                        (a, b) =>
                          b.createdAt.toMillis() - a.createdAt.toMillis()
                      ) // Sort by createdAt timestamp
                      .map((transactions, index) => (
                        <tr key={transactions.id}>
                          <td>{index + 1}</td>
                          <td style={{ minWidth: "200px", fontSize: "15px" }}>
                            {transactions.userName || "N/A"}
                          </td>
                          <td style={{ minWidth: "200px", fontSize: "15px" }}>
                            {transactions.collectionDisplayName || "N/A"}
                          </td>
                          <td style={{ minWidth: "230px", fontSize: "15px" }}>
                            {transactions.createdAt &&
                            transactions.createdAt.toDate
                              ? transactions.createdAt.toDate().toLocaleString()
                              : "Invalid Date"}
                          </td>
                          <td style={{ minWidth: "150px", fontSize: "15px" }}>
                            {transactions.status || "N/A"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
