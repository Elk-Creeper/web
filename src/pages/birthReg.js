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
import { FaSearch, FaSend } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { debounce } from "lodash";
import jsPDF from "jspdf";
import "@react-pdf-viewer/core/lib/styles/index.css";
import useAuth from "../components/useAuth";
import Footer from "../components/footer";

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
  const [textInput, setTextInput] = useState("");
  const [initialLoad, setInitialLoad] = useState(true); //automatic pending
  const handleTextChange = (event) => {
    setTextInput(event.target.value);
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
      const querySnapshot = await getDocs(collection(firestore, "birth_reg"));
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
        console.log("No documents found in the 'birth_reg' collection.");
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
      const appointmentRef = doc(firestore, "birth_reg", id);
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
      item.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userBarangay?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
  
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
      ? item.status?.toLowerCase() == selectedStatusFilter.toLowerCase()
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
        const appointmentRef = doc(firestore, "birth_reg", selectedItem.id);
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
        const remarksCollectionRef = collection(firestore, "birth_reg");
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
          <h1>Registration of Live Birth</h1>
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
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id}>
                      <td>{`${item.userName || "N/A"} ${item.userLastName || ""}`.trim() || "N/A"}</td>
                      <td>{item.userBarangay || "N/A"}</td>
                      <td>{item.userEmail || "N/A"}</td>
                      <td>
                        {item.createdAt && item.createdAt.toDate
                          ? item.createdAt.toDate().toLocaleString()
                          : "Invalid Date"}
                      </td>
                      <td>{item.status || "N/A"}</td>
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
                  <p>
                    This registration form is requested by{" "}
                    {selectedItem.userName}.
                  </p>

                  {/* Child's Information */}
                  <div className="section">
                    <h3>Child's Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>First Name</label>
                        <div className="placeholder">
                          {selectedItem.c_fname}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Middle Name</label>
                        <div className="placeholder">
                          {selectedItem.c_mname}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Last Name</label>
                        <div className="placeholder">
                          {selectedItem.c_lname}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Sex</label>
                        <div className="placeholder">{selectedItem.sex}</div>
                      </div>

                      <div className="form-group">
                        <label>Birth Date</label>
                        <div className="placeholder">
                          {selectedItem.birthdate &&
                          selectedItem.birthdate.toDate
                            ? selectedItem.birthdate.toDate().toLocaleString()
                            : "Invalid Date"}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Birth of Place</label>
                        <div className="placeholder">
                          {selectedItem.birthplace}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Type of Birth</label>
                        <div className="placeholder">
                          {selectedItem.typeofbirth}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>If Multiple Birth, Child was</label>
                        <div className="placeholder">
                          {selectedItem.c_multiple
                            ? selectedItem.c_multiple
                            : "  "}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Birth Order</label>
                        <div className="placeholder">
                          {selectedItem.c_birthorder}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Weight</label>
                        <div className="placeholder">
                          {selectedItem.c_weight}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mother's Information */}
                  <div className="section">
                    <h3>Mother's Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Mother's Name</label>
                        <div className="placeholder">{selectedItem.m_name}</div>
                      </div>

                      <div className="form-group">
                        <label>Mother's Citizenship</label>
                        <div className="placeholder">
                          {selectedItem.m_citizenship}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Mother's Religion/Religious Sect</label>
                        <div className="placeholder">
                          {selectedItem.m_religion}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Total number of children born alive</label>
                        <div className="placeholder">
                          {selectedItem.bornAlive}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>
                          No. of children still living including this birth
                        </label>
                        <div className="placeholder">
                          {selectedItem.childStillLiving}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>
                          No. of children born alive but are now dead
                        </label>
                        <div className="placeholder">
                          {selectedItem.childAliveButNowDead}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Mother's Occupation</label>
                        <div className="placeholder">
                          {selectedItem.m_occur}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Mother's Age at the time of Birth</label>
                        <div className="placeholder">{selectedItem.m_age}</div>
                      </div>

                      <div className="form-group">
                        <label>Mother's Residence</label>
                        <div className="placeholder">
                          {selectedItem.m_residence}
                        </div>
                      </div>
                      {/* Add more mother fields here */}
                    </div>
                  </div>

                  {/* Father's Information */}
                  <div className="section">
                    <h3>Father's Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Father's Name</label>
                        <div className="placeholder">{selectedItem.f_name}</div>
                      </div>

                      <div className="form-group">
                        <label>Father's Citizenship</label>
                        <div className="placeholder">
                          {selectedItem.f_citizenship}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Father's Religion/Religious Sect</label>
                        <div className="placeholder">
                          {selectedItem.f_religion}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Father's Occupation</label>
                        <div className="placeholder">
                          {selectedItem.f_occur}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Father's Age at the time of Birth</label>
                        <div className="placeholder">{selectedItem.f_age}</div>
                      </div>

                      <div className="form-group">
                        <label>Father's Residence</label>
                        <div className="placeholder">
                          {selectedItem.f_residence}
                        </div>
                      </div>
                      {/* Add more father fields here */}
                    </div>
                  </div>

                  {/* Other Information */}
                  <div className="section">
                    <h3>Other Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Date of Marriage</label>
                        <div className="placeholder">
                          {selectedItem.mpDate && selectedItem.mpDate.toDate
                            ? selectedItem.mpDate.toDate().toLocaleString()
                            : "Invalid Date"}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Place of Marriage</label>
                        <div className="placeholder">
                          {selectedItem.mpPlace}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Attendant</label>
                        <div className="placeholder">
                          {selectedItem.attendant}
                        </div>
                      </div>

                      {/* Add more other fields here */}
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
      <Footer />
    </div>
  );
}

export default App;
