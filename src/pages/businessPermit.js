import React, { useEffect, useState } from "react";
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
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import "./marriageCert.css";
import logo from "../assets/logo.png";
import notification from "../assets/icons/Notification.png";
import Sidebar from "../components/sidebar";
import { FaSearch } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { debounce } from "lodash";
import jsPDF from "jspdf";
import "@react-pdf-viewer/core/lib/styles/index.css";
import useAuth from "../components/useAuth";
import Footer from '../components/footer';
import Modal from "../pages/Modal";


const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableVisible, setTableVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("");
  const [selectedDayFilter, setSelectedDayFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [pdfFileUrl, setPdfFileUrl] = useState(null);
  const [textInput, setTextInput] = useState('');
  const handleTextChange = (event) => {setTextInput(event.target.value);};
  const [selectedImage, setSelectedImage] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true); //automatic pending
  const handleImageClick = (image) => {
    setSelectedImage(selectedImage === image ? null : image);
  };

  // Function for the account name
  const { user } = useAuth();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchUserEmail = () => {
      if (user) {
        const email = user.email;
        const truncatedEmail =
          email.length > 5 ? `${email.substring(0, 5)}...` : email;
        setUserEmail(truncatedEmail);
      }
    };

    fetchUserEmail();
  }, [user]);

  const storage = getStorage();

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "businessPermit"));
      const items = [];

      if (!querySnapshot.empty) {
        for (const doc of querySnapshot.docs) {
          const data = doc.data();

          if (data.imagePath) {
            try {
              const imageUrl = await getDownloadURL(
                ref(storage, data.imagePath)
              );
              data.imageUrl = imageUrl;
            } catch (imageError) {
              console.error("Error fetching image URL:", imageError);
            }
          }

          items.push({
            id: doc.id,
            status: "Pending",
            ...data,
          });
        }

        items.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );

        setData(items);
        setLoading(false);

        if (initialLoad) {
          setSelectedStatusFilter("Pending");
          setInitialLoad(false);
        }

      } else {
        console.log("No documents found in the 'businessPermit' collection.");
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
  };

  const closeDetailsModal = () => {
    setSelectedItem(null);
    setTableVisible(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const appointmentRef = doc(firestore, "businessPermit", id);
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
  }, [
    searchTerm,
    selectedYearFilter,
    selectedMonthFilter,
    selectedDayFilter,
    selectedStatusFilter,
  ]);

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userBarangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear = selectedYearFilter
      ? item.createdAt &&
        item.createdAt.toDate &&
        item.createdAt.toDate().getFullYear() == selectedYearFilter
      : true;

    const matchesMonth = selectedMonthFilter
      ? item.createdAt &&
        item.createdAt.toDate &&
        item.createdAt.toDate().getMonth() + 1 == selectedMonthFilter
      : true;

    const matchesDay = selectedDayFilter
      ? item.createdAt &&
        item.createdAt.toDate &&
        item.createdAt.toDate().getDate() == selectedDayFilter
      : true;

    const matchesStatus = selectedStatusFilter
      ? item.status.toLowerCase() == selectedStatusFilter.toLowerCase()
      : true;

    return (
      matchesSearch &&
      matchesYear &&
      matchesMonth &&
      matchesDay &&
      matchesStatus
    );
  });

  const handleYearFilterChange = (event) => {
    setSelectedYearFilter(event.target.value);
    setLoading(true);
    debouncedFetchData();
  };

  const handleMonthFilterChange = (event) => {
    setSelectedMonthFilter(event.target.value);
    setLoading(true);
    debouncedFetchData();
  };

  const handleDayFilterChange = (event) => {
    setSelectedDayFilter(event.target.value);
    setLoading(true);
    debouncedFetchData();
  };

  const handleStatusFilterChange = (event) => {
    setSelectedStatusFilter(event.target.value);
    setLoading(true);
    debouncedFetchData();
  };

  const handleSubmit = async () => {
    try {
      if (selectedItem) {
        // If there is a selected item, update its remarks
        const appointmentRef = doc(firestore, "businessPermit", selectedItem.id);
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
        const remarksCollectionRef = collection(firestore, "businessPermit");
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
                  <a href="/businessPermit">Business Permit</a>
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
                <a href="/">About</a>
              </li>
              <li>
                <a href="/">Settings</a>
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
          <h1>Application of Business Permit</h1>
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
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id}>
                      <td>{`${item.userName || "N/A"} ${item.userLastName || ""}`.trim() || "N/A"}</td>
                      <td>{item.userBarangay}</td>
                      <td>{item.userEmail}</td>
                      <td>
                        {item.createdAt && item.createdAt.toDate
                          ? item.createdAt.toDate().toLocaleString()
                          : "Invalid Date"}
                      </td>
                      <td>{item.status}</td>
                      <td>
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
                  <div className="title">
                    <h6>Full Details</h6>
                    <span className="close-button" onClick={closeDetailsModal}>
                      &times;
                    </span>
                  </div>
                  <p>This registration form is requested by {selectedItem.userName}.</p>

                  {/* Business Permit Form */}
                  <div className="section">
                    <h3>Business Permit Form </h3>
                    <div className="form-grid">

                      <div className="form-group">
                        <label>Type of Application</label>
                        <div className="placeholder">
                          {selectedItem.typeOfApplication}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Contact Number</label>
                        <div className="placeholder">
                          {selectedItem.userContact}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Business Registration Number</label>
                        <div className="placeholder">
                          {selectedItem.businessNum1}
                        </div>
                      </div>
                    </div>
                  </div>

                  { /* Image filed*/}
                  <div className="businesss">
                  <div className="business-grid">

                    <h3>Cedula</h3>
                    <div className="proof"  onClick={() => handleImageClick(selectedItem.cedula1,selectedItem.cedula2)}>
                      {selectedItem.cedula1 ? (
                        <img
                          src={selectedItem.cedula1}
                          alt="Proof of Sending"
                          className="proof-image"/> ) : ( <p>No Cedula available</p>)}
                      {selectedImage && (<Modal image={selectedImage} onClose={() => setSelectedImage(null)} />)}
                    </div>

                    <h3>Barangay Business Clearance</h3>
                    <div className="proof" onClick={() => handleImageClick(selectedItem.barangayClearance1)}>
                      {selectedItem.barangayClearance1 ? (
                        <img
                          src={selectedItem.barangayClearance1}
                          alt="Proof of Sending"
                          className="proof-image"/> ) : ( <p>No Barangay Business Clearance available</p>)}
                      {selectedImage && (<Modal image={selectedImage} onClose={() => setSelectedImage(null)} />)}
                    </div>

                    <h3>DTI Registration (Single Proprietor)</h3>
                    <div className="proof" onClick={() => handleImageClick(selectedItem.dti1)}>
                      {selectedItem.dti1 ? (
                        <img
                          src={selectedItem.dti1}
                          alt="Proof of Sending"
                          className="proof-image"/> ) : ( <p>No DTI Registration available</p>)}
                          {selectedImage && (<Modal image={selectedImage} onClose={() => setSelectedImage(null)} />)}
                    </div>

                    <h3>SEC Registration(Corporation & Partnership)</h3>
                    <div className="proof" onClick={() => handleImageClick(selectedItem.sec1)}>
                      {selectedItem.sec1 ? (
                        <img
                          src={selectedItem.sec1}
                          alt="Proof of Sending"
                          className="proof-image"/> ) : ( <p>No SEC Registration available</p>)}
                          {selectedImage && (<Modal image={selectedImage} onClose={() => setSelectedImage(null)} />)}
                    </div>

                    <h3>Fire Safety Clearance</h3>
                    <div className="proof" onClick={() => handleImageClick(selectedItem.fire1)}>
                      {selectedItem.fire1 ? (
                        <img
                          src={selectedItem.fire1}
                          alt="Proof of Sending"
                          className="proof-image"/> ) : ( <p>No Fire Safety Clearance available</p>)}
                          {selectedImage && (<Modal image={selectedImage} onClose={() => setSelectedImage(null)} />)}
                    </div>

                    <h3>Sanitary/Health Certificate</h3>
                    <div className="proof" onClick={() => handleImageClick(selectedItem.sanitary1)}>
                      {selectedItem.sanitary1 ? (
                        <img
                          src={selectedItem.sanitary1}
                          alt="Proof of Sending"
                          className="proof-image"/> ) : ( <p>No Sanitary/health Certificate available</p>)}
                          {selectedImage && (<Modal image={selectedImage} onClose={() => setSelectedImage(null)} />)}
                    </div>

                    <h3>Police Clearance</h3>
                    <div className="proof" onClick={() => handleImageClick(selectedItem.police1)}>
                      {selectedItem.police1 ? (
                        <img
                          src={selectedItem.police1}
                          alt="Proof of Sending"
                          className="proof-image"/> ) : ( <p>No Police Clearance available</p>)}
                          {selectedImage && (<Modal image={selectedImage} onClose={() => setSelectedImage(null)} />)}
                    </div>


                    <h3>Picture 2x2 (1 piece)</h3>
                    <div className="proof" onClick={() => handleImageClick(selectedItem.picture1)}>
                      {selectedItem.picture1 ? (
                        <img
                          src={selectedItem.picture1}
                          alt="Proof of Sending"
                          className="proof-image"/> ) : ( <p>No payment proof available</p>)}
                          {selectedImage && (<Modal image={selectedImage} onClose={() => setSelectedImage(null)} />)}
                    </div>

                    <h3>Official Receipt for Mayor's Permit</h3>
                    <div className="proof" onClick={() => handleImageClick(selectedItem.mayorsPermit1)}>
                      {selectedItem.mayorsPermit1 ? (
                        <img
                          src={selectedItem.mayorsPermit1}
                          alt="Proof of Sending"
                          className="proof-image"/> ) : ( <p>No payment proof available</p>)}
                          {selectedImage && (<Modal image={selectedImage} onClose={() => setSelectedImage(null)} />)}
                    </div>

                    <h3>BMPDC Certificate</h3>
                    <div className="proof" onClick={() => handleImageClick(selectedItem.mpdc1)}>
                      {selectedItem.mpdc1 ? (
                        <img
                          src={selectedItem.mpdc1}
                          alt="Proof of Sending"
                          className="proof-image"/> ) : ( <p>No payment proof available</p>)}
                          {selectedImage && (<Modal image={selectedImage} onClose={() => setSelectedImage(null)} />)}
                    </div>

                    <h3>MEO Certification</h3>
                    <div className="proof" onClick={() => handleImageClick(selectedItem.meo1)}>
                      {selectedItem.meo1 ? (
                        <img
                          src={selectedItem.meo1}
                          alt="Proof of Sending"
                          className="proof-image"/> ) : ( <p>No payment proof available</p>)}
                          {selectedImage && (<Modal image={selectedImage} onClose={() => setSelectedImage(null)} />)}
                    </div>
                    </div>
                 </div>


                  <div className="form-group">
                      <label>Status of Appointment</label>
                      <div className="placeholder">{selectedItem.status}</div>
                    </div>


                    <div className="buttons">
                    <button
                      onClick={() =>
                        handleStatusChange(selectedItem.id, "Approved")
                      }
                      className="completed-button"
                      disabled={selectedItem.status === "Approved"}
                    >
                      Approved
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
                        handleStatusChange(selectedItem.id, "Completed")
                      }
                      className="completed-button"
                      disabled={selectedItem.status === "Completed"}
                    >
                      Completed
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
                    <FontAwesomeIcon icon={faPaperPlane} style={{ marginLeft: "5px" }} /> Submit 
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}

export default App;
