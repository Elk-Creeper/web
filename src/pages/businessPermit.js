import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage"; // Import Firebase Storage related functions
import "./marriageCert.css";
import logo from "../assets/logo.png";
import notification from "../assets/icons/Notification.png";
import Sidebar from "../components/sidebar";
import { FaSearch } from "react-icons/fa"; // Import icons
import useAuth from "../components/useAuth";
import { debounce } from "lodash";
import jsPDF from "jspdf";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { pdfjs } from "react-pdf";

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

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableVisible, setTableVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [searchQuery, setSearchQuery] = useState(""); // New state for the search query
  const [selectedYearFilter, setSelectedYearFilter] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("");
  const [selectedDayFilter, setSelectedDayFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");

  const [pdfFileUrl, setPdfFileUrl] = useState(null);

  // Function for the account name
 const { user } = useAuth();
 const [userEmail, setUserEmail] = useState('');

 useEffect(() => {
   const fetchUserEmail = () => {
     if (user) {
       const email = user.email;
       const truncatedEmail = email.length > 5 ? `${email.substring(0, 5)}...` : email;
       setUserEmail(truncatedEmail);
     }
   };

   fetchUserEmail();
 }, [user]);

  const storage = getStorage();

  const fetchData = async () => {
    try {
      // Adjust this query based on your actual data structure
      const snapshot = await collection(firestore, "businessPermit");
      const querySnapshot = await getDocs(snapshot);
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      for (const item of items) {
        if (item.imagePath) {
          const imageUrl = await getDownloadURL(ref(storage, item.imagePath));
          item.imageUrl = imageUrl;
        }
      }

      // Sort the data based on createdAt timestamp in descending order
      items.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

      setData(items);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  const openDetailsModal = async (item) => {
    setSelectedItem(item);
    setTableVisible(false); // Set the table to hide
  };

  const closeDetailsModal = () => {
    setSelectedItem(null);
    setTableVisible(true); // Set the table to show
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const appointmentRef = doc(firestore, "marriageCert", id);
      await updateDoc(appointmentRef, {
        status: newStatus,
      });

      setSelectedItem((prevItem) => ({
        ...prevItem,
        status: newStatus,
      }));
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const debouncedFetchData = debounce(fetchData, 300);

  useEffect(() => {
    setLoading(true);
    debouncedFetchData();
  }, [searchTerm]);

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
      item.rname &&
      item.rname.toLowerCase().includes(searchQuery.toLowerCase()) &&
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

  const openPdf = async () => {
    try {
      // Set the full URL to your PDF file
      const pdfPath = "/certificate.pdf";

      // Fetch the PDF content
      const response = await fetch(pdfPath);
      const arrayBuffer = await response.arrayBuffer();

      // Convert the array buffer to a Uint8Array
      const uint8Array = new Uint8Array(arrayBuffer);

      // Create a Blob from the Uint8Array
      const blob = new Blob([uint8Array], { type: "application/pdf" });

      // Generate a data URL from the Blob
      const dataUrl = URL.createObjectURL(blob);

      // Set the dataUrl to state
      setPdfFileUrl(dataUrl);

      // Open the PDF in a new tab or window (optional)
      window.open(dataUrl, "_blank");
    } catch (error) {
      console.error("Error opening PDF:", error);
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
                <a href="dashboard">Home</a>
              </li>
              <li className="dropdown">
                <a>Services</a>
                <div className="dropdown-content">
                  <a href="/birthReg">Certificate of Live Birth</a>
                  <a href="/marriageCert">Marriage Certificate</a>
                  <a href="/deathCert">Death Certificate</a>
                  <a href="/businessPermit">Business Permit</a>
                  <a href="/job">Job Application</a>
                </div>
              </li>
              <li>
                <a href="/appointments">Appointments</a>
              </li>
              <li>
                <a href="/transactions">News</a>
              </li>
              <li>
                <a href="/transactions">About</a>
              </li>
              <li>
                <a href="/transactions">Settings</a>
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
            </div>
          </div>
        </div>

        <div className="containers">
          <h1>Business Permit</h1>
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
                  <th style={{ borderBottom: "1px solid black" }}>
                    Name of Applicant
                  </th>
                  <th style={{ borderBottom: "1px solid black" }}>Residency</th>
                  <th style={{ borderBottom: "1px solid black" }}>Contact</th>
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
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  // Display filtered data
                  filteredData.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "8px", border: "1px solid black" }}>
                        {item.userName}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid black" }}>
                        {item.userBarangay}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid black" }}>
                        {item.userEmail}
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
                    This registration form is requested by {selectedItem.userName}
                    .
                  </p>

                  <div className="section">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Name of Wife</label>
                        <div className="placeholder">{selectedItem.wname}</div>
                      </div>

                      <div className="form-group">
                        <label>Name of Husband</label>
                        <div className="placeholder">{selectedItem.hname}</div>
                      </div>

                      <div className="form-group">
                        <label>Date of Marriage</label>
                        <div className="placeholder">
                          {selectedItem.date &&
                            selectedItem.date.toDate().toLocaleString()}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Place of Marriage</label>
                        <div className="placeholder">
                          {selectedItem.marriage}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Complete name of requesting party</label>
                        <div className="placeholder">{selectedItem.rname}</div>
                      </div>

                      <div className="form-group">
                        <label>Complete address of requesting party</label>
                        <div className="placeholder">
                          {selectedItem.address}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Number of copies needed</label>
                        <div className="placeholder">{selectedItem.copies}</div>
                      </div>

                      <div className="form-group">
                        <label>Purpose of the certification</label>
                        <div className="placeholder">
                          {selectedItem.purpose}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="section">
                    <h3>Proof of Payment</h3>
                    <div className="proof">
                      {selectedItem.payment ? (
                        <img
                          src={selectedItem.payment}
                          alt="Proof of Payment"
                          className="proof-image"
                        />
                      ) : (
                        <p>No payment proof available</p>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Status of Appointment</label>
                      <div className="placeholder">{selectedItem.status}</div>
                    </div>
                  </div>

                  <div className="buttons">
                    <button
                      onClick={() =>
                        handleStatusChange(selectedItem.id, "Completed")
                      }
                      className="completed-button"
                      disabled={selectedItem.status === "Completed"}
                    >
                      Completed
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(selectedItem.id, "On Process")
                      }
                      className="on-process-button"
                      disabled={selectedItem.status === "On Process"}
                    >
                      On Process
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(selectedItem.id, "Rejected")
                      }
                      className="on-process-button"
                      disabled={selectedItem.status === "Rejected"}
                    >
                      Rejected
                    </button>

                    <button onClick={openPdf}>Open PDF</button>

                    {/* PDF Viewer */}
                    {pdfFileUrl && (
                      <div className="pdf-viewer">
                        <Worker
                          workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`}
                        >
                          <Viewer fileUrl={pdfFileUrl} />
                        </Worker>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
