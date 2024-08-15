import React, { useEffect, useState } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage"; // Import Firebase Storage related functions
import "./transactions.css";
import logo from "../assets/logo.png";
import notification from "../assets/icons/Notification.png";
import { FaSearch } from "react-icons/fa";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import useAuth from "../components/useAuth";
import { onSnapshot } from "firebase/firestore";
import Footer from "../components/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faTimes } from "@fortawesome/free-solid-svg-icons";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableVisible, setTableVisible] = useState(true);

  const [searchQuery, setSearchQuery] = useState(""); // New state for the search query
  const [selectedYearFilter, setSelectedYearFilter] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("");
  const [selectedDayFilter, setSelectedDayFilter] = useState("");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);

  const storage = getStorage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const history = useHistory();
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

  // Function for the account name
  const { user } = useAuth();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchUserEmail = () => {
      if (user) {
        const email = user.email;
        const truncatedEmail =
          email.length > 11 ? `${email.substring(0, 11)}...` : email;
        setUserEmail(truncatedEmail);
      }
    };

    fetchUserEmail();
  }, [user]);

  // Fetch data function
  const [timestamps, setTimestamps] = useState({});

// Update the fetchData function to accumulate timestamps for each status under each itemId
const fetchData = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestore, "histories"));
    const items = [];
    const timestampsObj = {};

    if (!querySnapshot.empty) {
      for (const doc of querySnapshot.docs) {
        const data = doc.data();

        if (data.imagePath) {
          try {
            const imageUrl = await getDownloadURL(ref(storage, data.imagePath));
            data.imageUrl = imageUrl;
          } catch (imageError) {
            console.error("Error fetching image URL:", imageError);
          }
        }

        items.push({
          id: doc.id,
          ...data,
        });

        // Check if timestamps object for this itemId exists
        if (!timestampsObj[data.itemId]) {
          timestampsObj[data.itemId] = {
            pending: null,
            approved: null,
            completed: null,
            hired: null,
            rejected: null,
            "On Process": null,
          };
        }

        const statusKey = data.status.toLowerCase() === "on process" ? "On Process" : data.status.toLowerCase();
        timestampsObj[data.itemId][statusKey] = {
          timestamp: data.timestamp,
          employee: data.employee, // Assuming employee information is stored in the data object
        };
      }

      setData(items);
      setTimestamps(timestampsObj);
      setLoading(false);

      if (initialLoad) {
        setInitialLoad(false);
      }
    } else {
      console.log("No documents found in the 'histories' collection.");
      setLoading(false);
    }
  } catch (error) {
    console.error("Error fetching data from Firestore:", error);
    setLoading(false);
  }
};
  
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  const openDetailsModal = async (item) => {
    setSelectedItem(item);
    setTableVisible(false);
    // Hide the search container
    document.querySelector(".search-container").style.display = "none";
  };

  const closeDetailsModal = () => {
    setSelectedItem(null);
    setTableVisible(true); // Set the table to show
    document.querySelector(".search-container").style.display = "flex";
  };

  const filteredData = data.filter((item) => {
    const getMonthName = (monthNumber) => {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return monthNames[monthNumber - 1];
    };
  
    const createdAtDate = item.createdAt ? item.createdAt.toDate() : null;
    const itemName = item.userName ? item.userName.toLowerCase() : '';
    const address = item.address ? item.address.toLowerCase() : ''; // Include address in the filter
    const monthName = createdAtDate ? getMonthName(createdAtDate.getMonth() + 1).toLowerCase() : '';
    const day = createdAtDate ? createdAtDate.getDate().toString() : '';
  
    const matchesSearch = itemName.includes(searchQuery.toLowerCase()) || address.includes(searchQuery.toLowerCase()); // Check if name or address matches the search query
    const matchesYear = selectedYearFilter === '' || (createdAtDate && createdAtDate.getFullYear().toString() === selectedYearFilter);
    const matchesMonth = selectedMonthFilter === '' || monthName === selectedMonthFilter.toLowerCase();
    const matchesDay = selectedDayFilter === '' || day === selectedDayFilter;
    const matchesService = selectedServiceFilter === '' || item.serviceType.toLowerCase() === selectedServiceFilter.toLowerCase(); // Check if service type matches the selected filter
  
    return matchesSearch && matchesYear && matchesMonth && matchesDay && matchesService;
  });

  const handleYearFilterChange = (event) => {
    setSelectedYearFilter(event.target.value);
  };

  const handleMonthFilterChange = (event) => {
    setSelectedMonthFilter(event.target.value);
  };

  const handleDayFilterChange = (event) => {
    setSelectedDayFilter(event.target.value);
  };

  const handleServiceFilterChange = (event) => {
    setSelectedServiceFilter(event.target.value);
  };

  const formatDate = (createdAt) => {
    const date = new Date(createdAt.seconds * 1000); // Convert seconds to milliseconds
    return date.toLocaleString(); // Convert to human-readable date string
  };

  const formatDates = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000); // Convert seconds to milliseconds
    return date.toLocaleString(); // Convert to human-readable date string
  };

  return (
    <div>
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
                <a href="/home">Home</a>
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
                  <a href="/helps">Help</a>
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

        <div className="containers">
          <h1>History of Transactions</h1>
        </div>

        <div className="search-container">
          <FaSearch className="search-icon"></FaSearch>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <div className="filter-container">
            <label>Filter:</label>
            <select
              value={selectedYearFilter}
              onChange={handleYearFilterChange}
              className="filter"
            >
              <option value="">Year</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
            <select
              value={selectedMonthFilter}
              onChange={handleMonthFilterChange}
              className="filter"
            >
              <option value="">Month</option>
              <option value="January">January</option>
              <option value="February">February</option>
              <option value="March">March</option>
              <option value="April">April</option>
              <option value="May">May</option>
              <option value="June">June</option>
              <option value="July">July</option>
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
            <select
              value={selectedDayFilter}
              onChange={handleDayFilterChange}
              className="filter"
            >
              <option value="">Day</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
              <option value="13">13</option>
              <option value="14">14</option>
              <option value="15">15</option>
              <option value="16">16</option>
              <option value="17">17</option>
              <option value="18">18</option>
              <option value="19">19</option>
              <option value="20">20</option>
              <option value="21">21</option>
              <option value="22">22</option>
              <option value="23">23</option>
              <option value="24">24</option>
              <option value="25">25</option>
              <option value="26">26</option>
              <option value="27">27</option>
              <option value="28">28</option>
              <option value="29">29</option>
              <option value="30">30</option>
              <option value="31">31</option>
            </select>
            <select
              value={selectedServiceFilter}
              onChange={handleServiceFilterChange} // Add onChange handler for service type filter
              className="filter"
            >
              <option value="">Service Type</option>
              <option value="Appointments">Appointments</option>
              <option value="Birth Registration">Birth Registration</option>
              <option value="Marriage Registration">Marriage Registration</option>
              <option value="Death Registration">Death Registration</option>
              <option value="Request Copy of Marriage Certificate">Request Copy of Marriage Certificate</option>
              <option value="Request Copy of Death Certificate">Request Copy of Death Certificate</option>
              <option value="Job Application">Job Application</option>
            </select>
          </div>
        </div>

        {tableVisible && (
          <div className="table-container">
            <table
              className="custom-table"
              style={{ border: "1px solid black", marginBottom: "30px" }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid black" }}>
                  <th style={{ border: "1px solid black" }}>No.</th>
                  <th style={{ border: "1px solid black" }}>
                    Name of Applicant
                  </th>
                  <th style={{ border: "1px solid black" }}>Address</th>
                  <th style={{ border: "1px solid black" }}>Service Type</th>
                  <th style={{ border: "1px solid black" }}>
                    Date of Application
                  </th>
                  <th style={{ border: "1px solid black" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ border: "1px solid black", textAlign: "center" }}
                    >
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  // Display filtered data
                  filteredData.map((item, index) => {
                    // Check if this is the first occurrence of the item ID
                    const isFirstOccurrence =
                    filteredData.findIndex((i) => i.itemId === item.itemId) === index;

                    return (
                      // Only render the row if it's the first occurrence of the item ID
                      isFirstOccurrence && (
                        <tr key={item.id}>
                          <td style={{ border: "1px solid black" }}>
                            {index + 1}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              border: "1px solid black",
                            }}
                          >
                            {item.userName || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              border: "1px solid black",
                            }}
                          >
                            {item.address || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              border: "1px solid black",
                            }}
                          >
                            {item.serviceType || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              border: "1px solid black",
                            }}
                          >
                            {item.createdAt && item.createdAt.toDate
                              ? item.createdAt.toDate().toLocaleString()
                              : "Invalid Date"}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              border: "1px solid black",
                            }}
                          >
                            <button
                              onClick={() => openDetailsModal(item)}
                              className="view-button"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedItem && (
          <div className="details-modal" style={{marginBottom:"50px", marginTop:"30px"}}>
            <div className="details-content">
              <div className="subheads">
                <div className="request-item">
                  <span className="close-button" onClick={closeDetailsModal}>
                    &times;
                  </span>
                  <div className="title">
                    <h6>Transaction Details</h6>
                  </div>
                  <p
                    style={{
                      fontSize: "20px",
                      lineHeight: "40px",
                      textIndent: "50px",
                      marginTop: "40px",
                    }}
                  >
                    Mr./Ms. {selectedItem.userName} from {selectedItem.address}{" "}
                    applied for {selectedItem.serviceType} on{" "}
                    {formatDate(selectedItem.createdAt)}.
                  </p>
                  <p
                    style={{
                      fontSize: "20px",
                      lineHeight: "40px",
                      marginTop: "30px",
                    }}
                  >
                    The details regarding the approval and changing of status of
                    this application are as follows:
                  </p>

                  <div className="section">
                    <div className="form-grid">
                      <div
                        className="form-group"
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: "40px",
                          marginLeft: "200px",
                          marginBottom: "40px",
                        }}
                      >
                        <label style={{ fontSize: "18px", marginTop: "10px" }}>
                          Pending:
                        </label>
                        <div
                          className="placeholder"
                          style={{
                            width: "300px",
                            textAlign: "center",
                            backgroundColor: "transparent",
                            borderColor: "#1e7566",
                          }}
                        >
                          {formatDate(selectedItem.createdAt) || "NA"}
                        </div>
                      </div>

                      <div
                        className="form-group"
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: "40px",
                          marginLeft: "100px",
                          marginBottom: "40px",
                        }}
                      >
                        <label style={{ fontSize: "18px", marginTop: "10px", marginRight: "8px" }}>
                          Approved:
                        </label>
                        <div
                          className="placeholder"
                          style={{
                            width: "300px",
                            textAlign: "center",
                            backgroundColor: "transparent",
                            borderColor: "#1e7566",
                          }}
                        >
                          {timestamps[selectedItem.itemId]?.approved?.timestamp ? formatDates(timestamps[selectedItem.itemId]?.approved?.timestamp) : "NA"}
                        </div>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div
                        className="form-group"
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: "40px",
                          marginLeft: "175px",
                          marginBottom: "40px",
                        }}
                      >
                        <label style={{ fontSize: "18px", marginTop: "10px" }}>
                          OnProcess:
                        </label>
                        <div
                          className="placeholder"
                          style={{
                            width: "300px",
                            textAlign: "center",
                            backgroundColor: "transparent",
                            borderColor: "#1e7566",
                          }}
                        >
                          {timestamps[selectedItem.itemId]?.["On Process"]?.timestamp ? formatDates(timestamps[selectedItem.itemId]?.["On Process"]?.timestamp) : "NA"}
                        </div>
                      </div>

                      <div
                        className="form-group"
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: "40px",
                          marginLeft: "100px",
                          marginBottom: "40px",
                        }}
                      >
                        <label style={{ fontSize: "18px", marginTop: "10px" }}>
                          Completed:
                        </label>
                        <div
                          className="placeholder"
                          style={{
                            width: "300px",
                            textAlign: "center",
                            backgroundColor: "transparent",
                            borderColor: "#1e7566",
                          }}
                        >
                          {timestamps[selectedItem.itemId]?.completed?.timestamp ? formatDates(timestamps[selectedItem.itemId]?.completed?.timestamp) : "NA"}
                        </div>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div
                        className="form-group"
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: "40px",
                          marginLeft: "200px",
                          marginBottom: "40px",
                        }}
                      >
                        <label style={{ fontSize: "18px", marginTop: "10px", marginRight:"20px" }}>
                          Hired:
                        </label>
                        <div
                          className="placeholder"
                          style={{
                            width: "300px",
                            textAlign: "center",
                            backgroundColor: "transparent",
                            borderColor: "#1e7566",
                          }}
                        >
                          {timestamps[selectedItem.itemId]?.hired?.timestamp ? formatDates(timestamps[selectedItem.itemId]?.hired?.timestamp) : "NA"}
                        </div>
                      </div>

                      <div
                        className="form-group"
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: "40px",
                          marginLeft: "105px",
                          marginBottom: "40px",
                        }}
                      >
                        <label style={{ fontSize: "18px", marginTop: "10px", marginRight: "13px" }}>
                          Rejected:
                        </label>
                        <div
                          className="placeholder"
                          style={{
                            width: "300px",
                            textAlign: "center",
                            backgroundColor: "transparent",
                            borderColor: "#1e7566",
                          }}
                        >
                          {timestamps[selectedItem.itemId]?.rejected?.timestamp ? formatDates(timestamps[selectedItem.itemId]?.rejected?.timestamp) : "NA"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
