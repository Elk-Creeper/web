import React, { useState, useEffect } from "react";
import "./dashboard.css";
import logo from "../assets/logo.png";
import Footer from "../components/footer";
import notification from "../assets/icons/Notification.png";
import useAuth from "../components/useAuth";
import Chart from "react-apexcharts";
import "apexcharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretDown,
  faTimes,
  faUser,
  faHistory,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const history = useHistory();
  const [unreadCount, setUnreadCount] = useState(0);
  
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
  const [pendingRequests, setPendingRequests] = useState([]);

  // Function to fetch data from Firestore
  const fetchPendingRequests = async () => {
    try {
      const collections = [
        "birth_reg",
        "marriageCert",
        "marriage_reg",
        "death_reg",
        "deathCert",
        "job",
        "appointments",
      ];
      const pendingRequests = [];

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(
          query(
            collection(firestore, collectionName),
            where("status", "==", "Pending")
          )
        );

        querySnapshot.forEach((doc) => {
          pendingRequests.push({
            id: doc.id,
            collection: collectionName,
            ...doc.data(),
          });
        });
      }

      // Sort the pending requests by date if needed
      pendingRequests.sort(
        (a, b) => b.createdAt?.seconds - a.createdAt?.seconds
      );

      // Limit to the latest 6 entries
      const limitedRequests = pendingRequests.slice(0, 6);

      setPendingRequests(limitedRequests);
    } catch (error) {
      console.error("Error fetching pending requests: ", error);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchTransactions = async (timeInterval, customDate) => {
    let startDate, endDate;
    const currentDate = customDate || new Date();
  
    switch (timeInterval) {
      case "day":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        endDate = currentDate;
        break;
      case "week":
        startDate = getStartOfWeek(currentDate);
        endDate = currentDate;
        break;
      case "month":
        startDate = getStartOfMonth(currentDate);
        endDate = currentDate;
        break;
      case "year":
        startDate = getStartOfYear(currentDate);
        endDate = currentDate;
        break;
      case "previousYear":
        ({ startDate, endDate } = getStartAndEndOfPreviousYear());
        break;
      default:
        startDate = currentDate;
        endDate = currentDate;
    }
  
    const transactions = await getTransactions(startDate, endDate);
    const count = transactions.length;
    updateTransactionCount(timeInterval, count);
  };

  useEffect(() => {
    fetchTransactions("previousYear");
  }, []);  
  
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
    const marriageRegQuery = query(
      collection(firestore, "marriage_reg"),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate)
    );
    const marriageCertQuery = query(
      collection(firestore, "marriageCert"),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate)
    );
    const deathRegQuery = query(
      collection(firestore, "death_reg"),
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
    const marriageRegSnapshot = await getDocs(marriageRegQuery);
    const marriageCertSnapshot = await getDocs(marriageCertQuery);
    const deathRegSnapshot = await getDocs(deathRegQuery);
    const deathCertSnapshot = await getDocs(deathCertQuery);
    const jobSnapshot = await getDocs(jobQuery);
    const appointmentsSnapshot = await getDocs(appointmentsQuery);

    const birthRegTransactions = birthRegSnapshot.docs.map((doc) => doc.data());
    const marriageRegTransactions = marriageRegSnapshot.docs.map((doc) =>
      doc.data()
    );
    const marriageCertTransactions = marriageCertSnapshot.docs.map((doc) =>
      doc.data()
    );
    const deathRegTransactions = deathRegSnapshot.docs.map((doc) => doc.data());
    const deathCertTransactions = deathCertSnapshot.docs.map((doc) =>
      doc.data()
    );
    const jobTransactions = jobSnapshot.docs.map((doc) => doc.data());
    const appointmentsTransaction = appointmentsSnapshot.docs.map((doc) =>
      doc.data()
    );

    const allTransactions = [
      ...birthRegTransactions,
      ...marriageRegTransactions,
      ...marriageCertTransactions,
      ...deathRegTransactions,
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

  const [pendingTransactions, setPendingTransactions] = useState(0);

  useEffect(() => {
    // Fetch and count pending transactions
    fetchPendingTransactions();
  }, []);

  // Function to fetch pending transactions from Firestore
  const fetchPendingTransactions = async () => {
    try {
      // Fetch pending transactions from all collections
      const collections = [
        "birth_reg",
        "marriageCert",
        "marriage_reg",
        "death_reg",
        "deathCert",
        "job",
        "appointments",
      ];

      let totalCount = 0;

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(
          query(
            collection(firestore, collectionName),
            where("status", "==", "Pending")
          )
        );

        totalCount += querySnapshot.size;
      }

      setPendingTransactions(totalCount);
    } catch (error) {
      console.error("Error fetching pending transactions: ", error);
    }
  };

  const getStartAndEndOfPreviousYear = () => {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear - 1, 0, 1);
    const endDate = new Date(currentYear - 1, 11, 31, 23, 59, 59);
    return { startDate, endDate };
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
    pending: {
      series: [yearTransactions], // Use the previous year transactions count
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
          colors: ["#FF0000"], // Change the color of the radial bar for pending transactions
        },
        labels: ["Previous Years"],
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

  const collectionNames = {
    birth_reg: "Birth Registration",
    marriageCert: "Marriage Certificate",
    marriage_reg: "Marriage Registration",
    death_reg: "Death Registration",
    deathCert: "Death Certificate",
    job: "Job Application",
    appointments: "Appointment",
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
          <a href="notifications">
            <img
              src={notification}
              alt="Notification.png"
              className="notif-icon"
            />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </a>

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
                  <FontAwesomeIcon
                    icon={faUser}
                    style={{ width: "20px", height: "20px", color: "#307A59" }}
                  />{" "}
                  <a href="/account-settings">Profile</a>
                </li>
                <li>
                  <FontAwesomeIcon
                    icon={faHistory}
                    style={{ width: "20px", height: "20px", color: "#307A59" }}
                  />{" "}
                  <a href="/history">History</a>
                </li>
                <li>
                  <FontAwesomeIcon
                    icon={faSignOutAlt}
                    style={{ width: "20px", height: "20px", color: "#307A59" }}
                  />{" "}
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
        <div className="clock" style={{ marginLeft: "40px" }}>
          <h4>Good day, userName. It's</h4>
          <h2>{formattedTime}</h2>
        </div>

        <div className="reports"
          style={{ marginLeft: "560px", marginTop: "-180px" }}
        >
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
            <div className="pending">
              <Chart
                options={chartData.pending.options}
                series={chartData.pending.series}
                type="radialBar"
                height="200"
              />
            </div>
          </div>
        </div>

        <div className="subhead">
          <div className="columns-container">
            <div className="column">
              <div style={{ marginLeft: "-220px", marginTop: "40px" }}>
                Pending Service Requests
              </div>
              <div
                className="request-list"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  marginLeft: "-220px",
                  gap: "40px",
                  marginTop: "20px",
                }}
              >
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="request-item"
                    style={{ width: "450px" }}
                  >
                    <div className="title">
                      <img src={logo} alt="logo" />
                      <h5>{collectionNames[request.collection]}</h5>
                      <h3>
                        {request.createdAt && request.createdAt.seconds
                          ? new Date(
                              request.createdAt.seconds * 1000
                            ).toLocaleDateString()
                          : ""}
                      </h3>
                    </div>
                    <p>
                      {request.userName} {request.userLastName} requested for{" "}
                      {request.personnel} from {request.department} for{" "}
                      {collectionNames[request.collection]} on{" "}
                      {request.date && request.date.seconds
                        ? new Date(
                            request.date.seconds * 1000
                          ).toLocaleDateString()
                        : ""}{" "}
                      at{" "}
                      {request.time && request.time.seconds
                        ? new Date(
                            request.time.seconds * 1000
                          ).toLocaleTimeString()
                        : ""}{" "}
                      regarding {request.reason}. Check the application for
                      approval.
                    </p>
                    <Link to={`/${request.collection}/${request.id}`}>
                      <button className="check">View Details</button>
                    </Link>
                  </div>
                ))}
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