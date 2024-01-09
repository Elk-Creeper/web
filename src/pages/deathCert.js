import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage"; // Import Firebase Storage related functions
import './birthReg.css';
import logo from '../assets/logo.png';
import notification from '../assets/icons/Notification.png';
import Sidebar from "../components/sidebar";
import { FaSearch } from 'react-icons/fa'; // Import icons
import useAuth from "../components/useAuth";
import Footer from '../components/footer';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAsIqHHA8727cGeTjr0dUQQmttqJ2nW_IE",
    authDomain: "muniserve-4dc11.firebaseapp.com",
    projectId: "muniserve-4dc11",
    storageBucket: "muniserve-4dc11.appspot.com",
    messagingSenderId: "874813480248",
    appId: "1:874813480248:web:edd1ff1f128b5bb4a2b5cd",
    measurementId: "G-LS66HXR3GT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);

function App() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [tableVisible, setTableVisible] = useState(true);

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

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedYearFilter, setSelectedYearFilter] = useState("");
    const [selectedMonthFilter, setSelectedMonthFilter] = useState("");
    const [selectedDayFilter, setSelectedDayFilter] = useState("");
    const [selectedStatusFilter, setSelectedStatusFilter] = useState("");

    const collectionTypeMap = {
        deathCert: "Request  Copy of Death Certificate",
        death_reg: "Death Registration",
    };

    const fetchData = async () => {
        try {
            const collections = [
                "deathCert",
                "death_reg",
            ];
            let allData = [];

            for (const collectionName of collections) {
                const snapshot = await collection(firestore, collectionName);
                console.log(`Fetching data from ${collectionName}...`);
                const querySnapshot = await getDocs(snapshot);

                const items = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    collectionType: collectionTypeMap[collectionName],
                    createdAt: doc.data().createdAt || { seconds: 0 },
                    ...doc.data(),
                }));

                for (const item of items) {
                    if (item.imagePath) {
                        const imageUrl = await getDownloadURL(ref(storage, item.imagePath));
                        item.imageUrl = imageUrl;
                    }
                    if (!item.createdAt) {
                        console.error(`Missing createdAt field in document with id: ${item.id}`);
                        continue;
                    }
                }
                allData = allData.concat(items);
            }
            allData.sort(
                (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
            );

            setData(allData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data: ", error);
            setError(error);
            setLoading(false);
        }
    };

    useEffect(() => {
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
            const appointmentRef = doc(firestore, "death_reg", id);
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

    const filteredData = data.filter((item) => {
        const getMonthName = (monthNumber) => {
            const monthNames = [
                "January", "February", "March", "April",
                "May", "June", "July", "August",
                "September", "October", "November", "December"
            ];
            return monthNames[monthNumber - 1];
        };

        const matchSearchQuery = !searchQuery || item.childname.toLowerCase().includes(searchQuery.toLowerCase());
        const matchYearFilter = !selectedYearFilter || (item.c_birthdate && item.c_birthdate.toDate && item.c_birthdate.toDate().getFullYear().toString() === selectedYearFilter);
        const matchMonthFilter = !selectedMonthFilter || (item.c_birthdate && item.c_birthdate.toDate && getMonthName(item.c_birthdate.toDate().getMonth() + 1).toLowerCase() === selectedMonthFilter.toLowerCase());
        const matchDayFilter = !selectedDayFilter || (item.c_birthdate && item.c_birthdate.toDate && item.c_birthdate.toDate().getDate().toString() === selectedDayFilter);
        const matchStatusFilter = !selectedStatusFilter || item.status.toLowerCase().includes(selectedStatusFilter.toLowerCase());

        return matchSearchQuery && matchYearFilter && matchMonthFilter && matchDayFilter && matchStatusFilter;
    });

    const finalData = filteredData.length > 0 ? filteredData : data;

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
                    <h1>Registration of Death Certificate</h1>
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
                        <select value={selectedYearFilter} onChange={handleYearFilterChange} className="filter">
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
                        <select value={selectedMonthFilter} onChange={handleMonthFilterChange} className="filter">
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
                        <select value={selectedDayFilter} onChange={handleDayFilterChange} className="filter">
                            <option value="">Day</option>
                            <option value="1">1</option>
                            <option value="2">2</option>\
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
                        <table className="custom-table" style={{ border: "1px solid black" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid black" }}>
                                    <th style={{ borderBottom: "1px solid black" }}>Name of the Applicant</th>
                                    <th style={{ borderBottom: "1px solid black" }}>Service Type</th>
                                    <th style={{ borderBottom: "1px solid black" }}>Residency</th>
                                    <th style={{ borderBottom: "1px solid black" }}>Contact</th>
                                    <th style={{ borderBottom: "1px solid black" }}>Date of Application</th>
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
                                            <td style={{ padding: "8px", border: "1px solid black" }}>{item.userName}</td>
                                            <td style={{ padding: "8px", border: "1px solid black" }}>{item.collectionType}</td>
                                            <td style={{ padding: "8px", border: "1px solid black" }}>{item.userBarangay}</td>
                                            <td style={{ padding: "8px", border: "1px solid black" }}>{item.userEmail}</td>
                                            <td style={{ padding: "8px", border: "1px solid black" }}>
                                                {item.createdAt && item.createdAt.toDate
                                                    ? item.createdAt.toDate().toLocaleString()
                                                    : "Invalid Date"}
                                            </td>
                                            <td style={{ padding: "8px", border: "1px solid black" }}>{item.status}</td>
                                            <td style={{ padding: "8px", border: "1px solid black" }}>
                                                <button onClick={() => openDetailsModal(item)} className="view-button">
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

                                    {/* Person's Information */}
                                    <div className="section">
                                        <h3>Child's Information</h3>
                                        <div className="form-grid">

                                            <div className="form-group">
                                                <label>Name</label>
                                                <div className="placeholder">{selectedItem.name}</div>
                                            </div>

                                            <div className="form-group">
                                                <label>Sex</label>
                                                <div className="placeholder">{selectedItem.sex}</div>
                                            </div>

                                            <div className="form-group">
                                                <label>Date of Death</label>
                                                <div className="placeholder">
                                                    {selectedItem.dateDeath && selectedItem.dateDeath.toDate
                                                        ? selectedItem.dateDeath.toDate().toLocaleString()
                                                        : "Invalid Date"}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Date of Birth</label>
                                                <div className="placeholder">
                                                    {selectedItem.dateBirth && selectedItem.dateBirth.toDate
                                                        ? selectedItem.dateBirth.toDate().toLocaleString()
                                                        : "Invalid Date"}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Age at the Time of Death</label>
                                                <div className="placeholder">
                                                    {selectedItem.age}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Place of Death</label>
                                                <div className="placeholder">
                                                    {selectedItem.place}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Civil Status</label>
                                                <div className="placeholder">
                                                    {selectedItem.civilstat}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Religion/Religious Sect</label>
                                                <div className="placeholder">
                                                    {selectedItem.religion}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Citizenship</label>
                                                <div className="placeholder">
                                                    {selectedItem.citizenship}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Residence</label>
                                                <div className="placeholder">
                                                    {selectedItem.residence}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Occupation</label>
                                                <div className="placeholder">
                                                    {selectedItem.occupation}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Name of Father</label>
                                                <div className="placeholder">
                                                    {selectedItem.fatherName}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Maiden Name of Mother</label>
                                                <div className="placeholder">
                                                    {selectedItem.motherName}
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Medical Certificate */}
                                    <div className="section">
                                        <h3>Medical Certificate</h3>
                                        <div className="form-grid">

                                        <div className="form-group">
                                                <label>Does the deceased aged 0 - 7 </label>
                                                <div className="placeholder">
                                                    {selectedItem.forChild}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Causes of Death</label>
                                                <div className="placeholder">
                                                    {selectedItem.causeOfDeath}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Maternal Condition</label>
                                                <div className="placeholder">
                                                    {selectedItem.maternalCondi}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Death by External Causes</label>
                                                <div className="placeholder">
                                                    {selectedItem.externalCause}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Autopsy</label>
                                                <div className="placeholder">
                                                    {selectedItem.autopsy}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Attendant</label>
                                                <div className="placeholder">
                                                    {selectedItem.attendant}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Corpse Disposal</label>
                                                <div className="placeholder">
                                                    {selectedItem.corpseDis}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Name and Address of Cemetery or Crematory</label>
                                                <div className="placeholder">
                                                    {selectedItem.addOfCemetery}
                                                </div>
                                            </div>
                                            {/* Add more mother fields here */}
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
                                            onClick={() => handleStatusChange(selectedItem.id, "Completed")}
                                            className="completed-button"
                                            disabled={selectedItem.status === "Completed"}
                                        >
                                            Completed
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(selectedItem.id, "On Process")}
                                            className="on-process-button"
                                            disabled={selectedItem.status === "On Process"}
                                        >
                                            On Process
                                        </button>
                                    </div>
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