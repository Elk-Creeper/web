import React, { useEffect, useState } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDoc,
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
import { faCaretDown, faTimes, faUser, faHistory, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableVisible, setTableVisible] = useState(true);
  const [userDepartment, setUserDepartment] = useState("");

  const [searchQuery, setSearchQuery] = useState(""); // New state for the search query
  const [selectedYearFilter, setSelectedYearFilter] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("");
  const [selectedDayFilter, setSelectedDayFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [textInput, setTextInput] = useState("");
  const [initialLoad, setInitialLoad] = useState(true); //automatic pending
  const [approvedButtonDisabled, setApprovedButtonDisabled] = useState(false);
  const [rejectedButtonDisabled, setRejectedButtonDisabled] = useState(false);
  const [hiredButtonDisabled, setHiredButtonDisabled] = useState(false);

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

  useEffect(() => {
    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      collection(firestore, "job"),
      async (querySnapshot) => {
        try {
          const items = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            status: "Pending",
            ...doc.data(),
          }));

          for (const item of items) {
            if (item.imagePath) {
              const imageUrl = await getDownloadURL(
                ref(storage, item.imagePath)
              );
              item.imageUrl = imageUrl;
            }
          }

          setData(items);
          setLoading(false);

          if (initialLoad) {
            setSelectedStatusFilter("Pending");
            setInitialLoad(false);
          }
        } catch (error) {
          console.error("Error fetching data: ", error);
          setLoading(false);
        }
      }
    );

    return () => {
      // Unsubscribe when the component unmounts
      unsubscribe();
    };
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

  useEffect(() => {
  // Disable buttons based on the initial status
  if (selectedItem && selectedItem.status) {
    if (selectedItem.status === "Approved") {
      setApprovedButtonDisabled(true);
      setRejectedButtonDisabled(true);
      setHiredButtonDisabled(false);
    } else if (selectedItem.status === "Rejected") {
      setApprovedButtonDisabled(true);
      setRejectedButtonDisabled(true);
      setHiredButtonDisabled(true);
    } else if (selectedItem.status === "Hired") {
      setApprovedButtonDisabled(true);
      setRejectedButtonDisabled(true);
      setHiredButtonDisabled(true);
    }
  }
}, [selectedItem]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const appointmentRef = doc(firestore, "job", id);
  
      // Get the current date and time
      const currentDate = new Date();
  
      // Update the status of the selected item
      await updateDoc(appointmentRef, {
        status: newStatus,
      });
  
      // Add the status change to the histories collection
      await addDoc(collection(firestore, "histories"), {
        itemId: id,
        status: newStatus,
        timestamp: serverTimestamp(),
        createdAt: selectedItem.createdAt,
        serviceType: "Job Application", // Assuming serviceType is available in selectedItem
        userName: selectedItem.name,
        address: selectedItem.address,
        // Include the user who performed the action
        employee: user ? user.email : "Unknown", // Assuming you store user's email in user.email
      });
  
      setSelectedItem((prevItem) => ({
        ...prevItem,
        status: newStatus,
      }));
  
      // Disable buttons based on the new status
      if (newStatus === "Approved") {
        setApprovedButtonDisabled(true);
        setRejectedButtonDisabled(true);
        setHiredButtonDisabled(false);
      } else if (newStatus === "Rejected") {
        setApprovedButtonDisabled(false);
        setRejectedButtonDisabled(true);
        setHiredButtonDisabled(true);
      } else if (newStatus === "Hired") {
        setApprovedButtonDisabled(true);
        setRejectedButtonDisabled(true);
        setHiredButtonDisabled(true);
      }
    } catch (error) {
      console.error("Error updating status: ", error);
    }
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

    return (
      item.name &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedYearFilter !== ""
        ? item.createdAt &&
          item.createdAt.toDate &&
          typeof item.createdAt.toDate === "function" &&
          item.createdAt.toDate().getFullYear().toString() ===
            selectedYearFilter
        : true) &&
      (selectedMonthFilter !== ""
        ? item.createdAt &&
          item.createdAt.toDate &&
          typeof item.createdAt.toDate === "function" &&
          getMonthName(item.createdAt.toDate().getMonth() + 1).toLowerCase() ===
            selectedMonthFilter.toLowerCase()
        : true) &&
      (selectedDayFilter !== ""
        ? item.createdAt &&
          item.createdAt.toDate &&
          typeof item.createdAt.toDate === "function" &&
          item.createdAt.toDate().getDate().toString() === selectedDayFilter
        : true) &&
      (selectedStatusFilter !== ""
        ? item.status.toLowerCase().includes(selectedStatusFilter.toLowerCase())
        : true)
    );
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

  const handleStatusFilterChange = (event) => {
    setSelectedStatusFilter(event.target.value);
  };

  const handleTextChange = (event) => {
    setTextInput(event.target.value);
  };

  const handleSubmit = async () => {
    try {
      if (selectedItem) {
        // If there is a selected item, update its remarks
        const appointmentRef = doc(firestore, "job", selectedItem.id);
        await updateDoc(appointmentRef, {
          remarks: textInput,
        });

        // Update the selected item with the new remarks
        setSelectedItem((prevItem) => ({
          ...prevItem,
          remarks: textInput,
        }));

        console.log("Remarks updated for ID: ", selectedItem.id);
      } else {
        // If there is no selected item, add a new document with the remarks
        const remarksCollectionRef = collection(firestore, "job");
        const newRemarksDocRef = await addDoc(remarksCollectionRef, {
          remarks: textInput,
        });

        console.log("Remarks added with ID: ", newRemarksDocRef.id);
      }

      // Optionally, you can clear the textarea after submitting.
      setTextInput("");
    } catch (error) {
      console.error("Error updating/adding remarks: ", error);
    }
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
                   <FontAwesomeIcon icon={faUser} style={{width: "20px", height: "20px", color: "#307A59"}}/> <a href="/account-settings">Profile</a>
                 </li>
                 <li>
                   <FontAwesomeIcon icon={faHistory} style={{width: "20px", height: "20px", color: "#307A59"}}/> <a href="/history">History</a>
                 </li>
                 <li>
                   <FontAwesomeIcon icon={faSignOutAlt} style={{width: "20px", height: "20px", color: "#307A59"}}/> <a onClick={handleLogout}>Logout</a>
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
          <h1>Job Application</h1>
        </div>

        <div className="search-container">
          <FaSearch className="search-icon"></FaSearch>
          <input
            type="text"
            placeholder="Search by Name"
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
              <option value="2031">2031</option>
              <option value="2030">2030</option>
              <option value="2029">2029</option>
              <option value="2028">2028</option>
              <option value="2027">2027</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
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
              <option value="2">2</option>\<option value="3">3</option>
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
              value={selectedStatusFilter}
              onChange={handleStatusFilterChange}
              className="filter"
            >
              <option value="">Status</option>
              <option value="Completed">Completed</option>
              <option value="On Process">On Process</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending">Pending</option>
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
                  <th style={{ borderBottom: "1px solid black" }}>Name</th>
                  <th style={{ borderBottom: "1px solid black" }}>
                    Date of Application
                  </th>
                  <th style={{ borderBottom: "1px solid black" }}>Status</th>
                  <th style={{ borderBottom: "1px solid black" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? ( // Check if there are no matching records
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  // Display filtered data
                  filteredData.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "8px", border: "1px solid black" }}>
                        {`${item.userName || "N/A"} ${
                          item.userLastName || ""
                        }`.trim() || "N/A"}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid black" }}>
                        {item.createdAt && item.createdAt.toDate
                          ? item.createdAt.toDate().toLocaleString()
                          : "Invalid Date"}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid black" }}>
                        {item.status}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid black" }}>
                        <button
                          onClick={() => openDetailsModal(item)}
                          className="view-button"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedItem && (
          <div className="details-modal">
            <div className="details-content">
              <div className="subheads">
                <div className="request-item">
                  <button className="close-button" onClick={closeDetailsModal}>
                    x
                  </button>
                  <div className="title">
                    <h6>Full Details</h6>
                  </div>
                  <p>
                    This application form is requested by {selectedItem.name}.
                  </p>

                  {/* Child's Information */}
                  <div className="section">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Complete name</label>
                        <div className="placeholder">{selectedItem.name}</div>
                      </div>

                      <div className="form-group">
                        <label>Age</label>
                        <div className="placeholder">{selectedItem.age}</div>
                      </div>

                      <div className="form-group">
                        <label>Sex</label>
                        <div className="placeholder">{selectedItem.sex}</div>
                      </div>

                      <div className="form-group">
                        <label>Address</label>
                        <div className="placeholder">
                          {selectedItem.address}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Phone Number</label>
                        <div className="placeholder">
                          {selectedItem.phoneNum}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Educational Attainment</label>
                        <div className="placeholder">{selectedItem.educ}</div>
                      </div>
                    </div>
                  </div>

                  <div className="section">
                    <h3>2x2 Picture</h3>
                    <div className="proof">
                      {selectedItem.pictures ? (
                        <img
                          src={selectedItem.pictures}
                          alt="Proof of Payment"
                          className="proof-image"
                        />
                      ) : (
                        <p>No payment proof available</p>
                      )}
                    </div>

                    <div className="resume">
                      <h3>Resume</h3>
                      <div className="proof">
                        {selectedItem &&
                        selectedItem.documents &&
                        selectedItem.documents.length > 0 ? (
                          <div className="placeholder">
                            {selectedItem.documents[0].name
                              .toLowerCase()
                              .endsWith(".pdf") ? (
                              <a
                                href={selectedItem.documents[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {selectedItem.documents[0].name}
                              </a>
                            ) : (
                              <a
                                href={selectedItem.documents[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Picture: {selectedItem.documents[0].name}
                              </a>
                            )}
                          </div>
                        ) : (
                          <p>No resume available</p>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Status of Appointment</label>
                      <div className="placeholder">{selectedItem.status}</div>
                    </div>
                  </div>

                  <div className="buttons">
                    <button
                      onClick={() =>
                        handleStatusChange(selectedItem.id, "Approved")
                      }
                      className="on-process-button"
                      disabled={approvedButtonDisabled }
                    >
                      Approved
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(selectedItem.id, "Hired")
                      }
                      className="on-process-button"
                      disabled={hiredButtonDisabled }
                    >
                      Hired
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(selectedItem.id, "Rejected")
                      }
                      className="on-process-button"
                      disabled={rejectedButtonDisabled }
                    >
                      Rejected
                    </button>
                  </div>

                  <div className="remarks">
                    <label>Remarks</label>
                    <textarea
                      id="textArea"
                      value={textInput}
                      onChange={handleTextChange}
                      placeholder="Type here your remarks.."
                      rows={4}
                      cols={50}
                      className="input-remarks"
                    />
                  </div>

                  <button onClick={handleSubmit} className="submit-button">
                    <FontAwesomeIcon
                      icon={faPaperPlane}
                      style={{ marginLeft: "5px" }}
                    />{" "}
                    Submit
                  </button>
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
