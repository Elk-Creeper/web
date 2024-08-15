import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faTrash,
  faEnvelope,
  faEnvelopeOpen,
  faEye,
  faCaretDown,
  faTimes,
  faUser,
  faHistory,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import "./notif.css";
import logo from "../assets/logo.png";
import Footer from "../components/footer";
import notification from "../assets/icons/Notification.png";
import useAuth from "../components/useAuth";
import { useHistory } from "react-router-dom";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  doc, updateDoc,
} from "firebase/firestore";

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
const firestore = getFirestore(app);

const Notification = () => {
  const [data, setData] = useState([]);
  const [localData, setLocalData] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const history = useHistory();
  const { user, logout } = useAuth();
  const [userEmail, setUserEmail] = useState("");
  const [latestData, setLatestData] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [activeButton, setActiveButton] = useState("All"); // Default active button

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

  const handleLogout = async () => {
    await logout(); // Call the logout function
    history.push("/login"); // Redirect to the login page after logout
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const serviceTypeMapping = {
    birth_reg: "Birth Registration",
    marriage_reg: "Marriage Registration",
    marriageCert: "Marriage Certificate",
    death_reg: "Death Registration",
    deathCert: "Death Certificate",
    job: "Job Application",
    appointments: "Appointments",
  };

  const fetchData = async () => {
    try {
      const collections = [
        "birth_reg",
        "marriage_reg",
        "marriageCert",
        "death_reg",
        "deathCert",
        "job",
        "appointments",
      ];

      const fetchLatestEntry = async (collectionName) => {
        const collectionRef = collection(firestore, collectionName);
        const querySnapshot = await getDocs(
          query(collectionRef, orderBy("createdAt", "desc"), limit(1))
        );
        const latestEntry = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          serviceType: serviceTypeMapping[collectionName], // Add serviceType property
        }));
        return latestEntry.length > 0 ? latestEntry[0] : null;
      };

      const latestEntries = await Promise.all(
        collections.map((collectionName) => fetchLatestEntry(collectionName))
      );

      // Filter out null values from latestEntries
      const filteredLatestEntries = latestEntries.filter(
        (entry) => entry !== null
      );

      const unreadCount = filteredLatestEntries.reduce((count, entry) => {
        if (!entry.read) {
          count++;
        }
        return count;
      }, 0);

      setUnreadCount(unreadCount);

      // Concatenate new data with existing data and sort by date
      const newData = [...latestData, ...filteredLatestEntries].sort(
        (a, b) => b.createdAt.seconds - a.createdAt.seconds
      );
      setLatestData(newData);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const formatDate = (createdAt) => {
    const date = new Date(createdAt.seconds * 1000); // Convert seconds to milliseconds
    return date.toLocaleString(); // Convert to human-readable date string
  };

  const handleRead = (index) => {
    // Implement the functionality to toggle read/unread status
    const updatedData = [...latestData];
    updatedData[index].read = !updatedData[index].read;
    setLatestData(updatedData);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilter = (filter) => {
    setFilter(filter);
  };

  const handleButtonClick = (button) => {
    setActiveButton(button);
    handleFilter(button);
  };

  const filteredData = latestData.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const userName = `${item.userName} ${item.userLastName}`.toLowerCase();
    const serviceType = item.serviceType.toLowerCase();
    const status = item.status.toLowerCase();
    const formattedDate = formatDate(item.createdAt).toLowerCase();

    const matchesSearch =
      userName.includes(searchLower) ||
      serviceType.includes(searchLower) ||
      status.includes(searchLower) ||
      formattedDate.includes(searchLower);

    if (filter === "All") return matchesSearch;
    if (filter === "Read") return matchesSearch && item.read;
    if (filter === "Unread") return matchesSearch && !item.read;
    if (filter === "Archived") return matchesSearch && item.archived;

    return matchesSearch;
  });

  const handleReads = async (index) => {
    // Implement the functionality to toggle read/unread status
    const updatedData = [...latestData];
    updatedData[index].read = !updatedData[index].read;
    setLatestData(updatedData);
  
    // Update the document in Firebase
    const messageId = updatedData[index].id;
    const collectionName = getCollectionName(updatedData[index].serviceType);
  
    try {
      // Get a Firestore reference to the appropriate collection
      const collectionRef = collection(firestore, collectionName);
  
      // Update the document in Firestore
      await updateDoc(doc(collectionRef, messageId), {
        read: updatedData[index].read, // Update the read status
      });
    } catch (error) {
      console.error("Error updating read status in Firestore: ", error);
    }
  };
  
  const handleArchived = async (index) => {
    // Implement the functionality to toggle archived status
    const updatedData = [...latestData];
    updatedData[index].archived = !updatedData[index].archived;
    setLatestData(updatedData);
  
    // Update the document in Firebase
    const messageId = updatedData[index].id;
    const collectionName = getCollectionName(updatedData[index].serviceType);
  
    try {
      // Get a Firestore reference to the appropriate collection
      const collectionRef = collection(firestore, collectionName);
  
      // Update the document in Firestore
      await updateDoc(doc(collectionRef, messageId), {
        archived: updatedData[index].archived, // Update the archived status
      });
    } catch (error) {
      console.error("Error updating archived status in Firestore: ", error);
    }
  };
  
  // Function to get the collection name based on the service type
  const getCollectionName = (serviceType) => {
    switch (serviceType) {
      case "Birth Registration":
        return "birth_reg";
      case "Marriage Registration":
        return "marriage_reg";
      case "Marriage Certificate":
        return "marriageCert";
      case "Death Registration":
        return "death_reg";
      case "Death Certificate":
        return "deathCert";
      case "Job Application":
        return "job";
      case "Appointments":
        return "appointments";
      default:
        return ""; // Handle other cases as needed
    }
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

      <div className="containers">
        <h1>Notifications</h1>
      </div>

      <div className="filter-part">
        <div className="filter-buttons">
          <button
            className={`message-type ${activeButton === "All" ? "active" : ""}`}
            onClick={() => handleButtonClick("All")}
          >
            All
          </button>
          <button
            className={`message-type ${
              activeButton === "Read" ? "active" : ""
            }`}
            onClick={() => handleButtonClick("Read")}
          >
            Read
          </button>
          <button
            className={`message-type ${
              activeButton === "Unread" ? "active" : ""
            }`}
            onClick={() => handleButtonClick("Unread")}
          >
            Unread
          </button>
          <button
            className={`message-type ${
              activeButton === "Archived" ? "active" : ""
            }`}
            onClick={() => handleButtonClick("Archived")}
          >
            Archived
          </button>
        </div>

        <input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-box"
        />
      </div>

      <div className="notification-wrapper">
        <div className="notification-containers">
          {Array.isArray(filteredData) && filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <div key={index} className="divider">
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", flexDirection: "row" }}>
                    <FontAwesomeIcon
                      icon={item.read ? faEnvelopeOpen : faEnvelope}
                      style={{
                        cursor: "pointer",
                        marginBottom: "5px",
                        width: "30px",
                        height: "30px",
                        color: "#1e7566",
                        padding: "20px",
                      }}
                      onClick={() => handleRead(index)}
                    />
                    <h6
                      style={{
                        fontSize: "20px",
                        padding: "20px",
                        textAlign: "justify",
                        marginLeft: "-30px",
                        marginTop: "7px",
                      }}
                    >
                      Message
                    </h6>
                  </div>
                  <div
                    style={{ padding: "20px", fontSize: "16px", color: "#888" }}
                  >
                    {formatDate(item.createdAt)}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "18px",
                    lineHeight: "40px",
                    textIndent: "50px",
                    marginTop: "-30px",
                    padding: "20px",
                    textAlign: "justify",
                  }}
                >
                  Mr./Ms. {item.userName} {item.userLastName} from{" "}
                  {item.userBarangay} applied for {item.serviceType} on{" "}
                  {formatDate(item.createdAt)} with a current status of{" "}
                  <span className="status-uppercase-red">{item.status}</span>.
                </p>
                <div className="read-archived-buttons">
                  <button
                    className="read-button"
                    onClick={() => handleButtonClick("Read")}
                  >
                    <FontAwesomeIcon icon={faEye} /> Read
                  </button>
                  <button
                    className="archived-button"
                    onClick={() => handleButtonClick("Archived")}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Archived
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;
