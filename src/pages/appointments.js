import React, { useEffect, useState, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { useTable } from "react-table";
import { FaSearch } from "react-icons/fa"; // Import icons
import "./appointment.css";
import logo from "../assets/logo.png";
import notification from "../assets/icons/Notification.png";
import useAuth from "../components/useAuth";
import Footer from "../components/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";


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
  // State to hold the fetched data
  const [data, setData] = useState([]);
  const [localData, setLocalData] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // New state for the search query
  const [departmentFilter, setDepartmentFilter] = useState(""); // State for department filter
  const [dateFilter, setDateFilter] = useState(""); // State for date filter
  const [personnelFilter, setPersonnelFilter] = useState(""); // State for personnel filter
  const [statusFilter, setStatusFilter] = useState(""); // State for status filter
  const [initialLoad, setInitialLoad] = useState(true); //automatic pending
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showTable, setShowTable] = useState(true);
  const [showSearchContainer, setShowSearchContainer] = useState(true);
  const [textInput, setTextInput] = useState("");
  

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

  // Function to fetch data from Firestore
  const fetchData = async () => {
    try {
      const snapshot = await collection(firestore, "appointments");
      const querySnapshot = await getDocs(snapshot);

      // Map the data and add the id field
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort the data by createdAt in descending order (newest to oldest)
      const sortedData = items.sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.toDate() : null;
        const dateB = b.createdAt ? b.createdAt.toDate() : null;

        return dateB - dateA;
      });

      setData(sortedData);
      setLocalData(sortedData); // Initialize localData with the sorted data
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  useEffect(() => {
    // Fetch data when the component mounts
    fetchData();
  }, []);

  // Define table columns
  const columns = React.useMemo(
    () => [
      {
        Header: "No.", // Auto-numbering column
        accessor: (row, index) => index + 1, // Calculate row number
      },
      {
        Header: "User Name",
        accessor: (row) => `${row.userName} ${row.userLastName}`,
      },
      {
        Header: "Department",
        accessor: "department",
      },
      {
        Header: "Personnel",
        accessor: "personnel",
      },
      {
        Header: "Residency",
        accessor: "userBarangay",
      },
      {
        Header: "Date of Application",
        accessor: "createdAt",
        Cell: ({ value }) => {
          if (value) {
            const date = value.toDate();
            return date.toLocaleDateString();
          } else {
            return "N/A"; // Handle the case where value is null or undefined
          }
        },
      },
      {
        Header: "Status",
        accessor: "status",
        headerClassName: "status-header-class",
      },
      {
        Header: "Actions",
        accessor: "actions",
        Cell: ({ row }) => (
          <div className="action-buttons">
            <button
              onClick={() => handleViewClick(row.original)}
              className="view-button"
            >
              View
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Handle status button click
  const handleStatusClick = async (appointmentId, newStatus) => {
    try {
      // Update the status in Firestore
      const appointmentRef = doc(firestore, "appointments", appointmentId);
      await updateDoc(appointmentRef, {
        status: newStatus,
      });

      // Update the local data
      setLocalData((prevLocalData) =>
        prevLocalData.map((item) =>
          item.id === appointmentId ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  useEffect(() => {
    setData(localData);
  }, [localData]);

  // Filter data based on the search query
  const filteredData = data.filter((item) => {
    return item.userName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Apply filters
  const applyFilters = () => {
    let filteredResult = filteredData;

    if (departmentFilter) {
      filteredResult = filteredResult.filter((item) =>
        item.department.includes(departmentFilter)
      );
    }
    if (dateFilter) {
      filteredResult = filteredResult.filter(
        (item) =>
          item.date &&
          item.date.toDate().toLocaleDateString().includes(dateFilter)
      );
    }
    if (personnelFilter) {
      filteredResult = filteredResult.filter((item) =>
        item.personnel.includes(personnelFilter)
      );
    }
    if (statusFilter) {
      filteredResult = filteredResult.filter((item) =>
        item.status.includes(statusFilter)
      );
    }

    return filteredResult;
  };

  // React Table configuration
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({
      columns,
      data: applyFilters(),
      filteredData, // Use the filtered data
    });

  const handleViewClick = (rowData) => {
    setSelectedAppointment(rowData);
    setShowTable(false); // Hide table
    setShowSearchContainer(false); // Hide search container
  };

  const handleBackClick = () => {
    setSelectedAppointment(null);
    setShowTable(true); // Show table
    setShowSearchContainer(true); // Show search container
  };

  const textareaRef = useRef(null);

  const handleTextChange = (event) => {
    setTextInput(event.target.value);
  };

  useEffect(() => {
    // Set focus on the textarea whenever textInput changes
    if (textareaRef.current) {
      textareaRef.current.value = textInput;
      textareaRef.current.focus();
    }
  }, [textInput]);

  const handleSubmit = async () => {
    try {
      if (selectedAppointment) {
        // If there is a selected item, update its remarks
        const appointmentRef = doc(
          firestore,
          "appointments",
          selectedAppointment.id
        );
        await updateDoc(appointmentRef, {
          remarks: textInput,
        });

        // Update the selected item with the new remarks
        setSelectedAppointment((prevItem) => ({
          ...prevItem,
          remarks: textInput,
        }));

        console.log("Remarks updated for ID: ", selectedAppointment.id);
      } else {
        // If there is no selected item, add a new document with the remarks
        const remarksCollectionRef = collection(firestore, "appointments");
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

  const handleStatusChange = async (id, newStatus) => {
    try {
      const appointmentRef = doc(firestore, "appointments", id);
      await updateDoc(appointmentRef, {
        status: newStatus,
      });

      setSelectedAppointment((prevItem) => ({
        ...prevItem,
        status: newStatus,
      }));
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  // Modal component to display appointment details
  const AppointmentDetailsModal = () => {
    return (
      <div className="details-modal">
        <div className="details-content">
          <div className="subheads">
            <div className="request-item">
              <div className="title">
                <h6>Full Details</h6>
                <span className="close-button" onClick={handleBackClick}>
                  &times;
                </span>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Name of Applicant</label>
                  <div className="placeholder">{`${selectedAppointment.userName} ${selectedAppointment.userLastName}`}</div>
                </div>

                <div className="form-group">
                  <label>Barangay</label>
                  <div className="placeholder">
                    {selectedAppointment.userBarangay}
                  </div>
                </div>

                <div className="form-group">
                  <label>Mobile Number</label>
                  <div className="placeholder">
                    {selectedAppointment.userContact}
                  </div>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <div className="placeholder">
                    {selectedAppointment.userEmail}
                  </div>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <div className="placeholder">
                    {selectedAppointment.department}
                  </div>
                </div>

                <div className="form-group">
                  <label>Personnel</label>
                  <div className="placeholder">
                    {selectedAppointment.personnel}
                  </div>
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <div className="placeholder">
                    {selectedAppointment.createdAt &&
                      selectedAppointment.createdAt
                        .toDate()
                        .toLocaleDateString()}
                  </div>
                </div>

                <div className="form-group">
                  <label>Time</label>
                  <div className="placeholder">
                    {selectedAppointment.time &&
                      selectedAppointment.time.toDate().toLocaleTimeString()}
                  </div>
                </div>

                <div className="form-group">
                  <label>Reason</label>
                  <div className="placeholder">
                    {selectedAppointment.reason}
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="form-group">
                  <label>Status of Appointment</label>
                  <div className="placeholder">
                    {selectedAppointment.status}
                  </div>
                </div>
              </div>

              <div className="buttons">
                <button
                  onClick={() =>
                    handleStatusChange(
                      selectedAppointment.id,
                      "Approved",
                      selectedAppointment.collectionType
                    )
                  }
                  className="on-process-button"
                  disabled={selectedAppointment.status === "Approved"}
                >
                  Approved
                </button>
                <button
                  onClick={() =>
                    handleStatusChange(
                      selectedAppointment.id,
                      "Disapproved",
                      selectedAppointment.collectionType
                    )
                  }
                  className="on-process-button"
                  disabled={selectedAppointment.status === "Disapproved"}
                >
                  Disapproved
                </button>
              </div>

              <div className="remarks">
                <label>Remarks</label>
                <textarea
                ref={textareaRef}
                id="textArea"
                defaultValue={selectedAppointment.remarks || ""}  // Use defaultValue instead of value
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
                />
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
          <h1>APPOINTMENTS</h1>
        </div>

        {showSearchContainer && (
          <div className="search-containerss">
            <FaSearch className="search-icon"></FaSearch>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />

            {/* Filter dropdowns */}
            <div className="filter-container">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Filter by Offices</option>
                <option value="Municipal Mayor's Office">
                  Municipal mayor's Office
                </option>
                <option value="Municipal Vice Mayor's Office">
                  Municipal Vice Mayor's Office
                </option>
                <option value="Sangguniang Bayan Office">
                  Sangguniang Bayan Office
                </option>
                <option value="Municipal Accountant's Office">
                  Municipal Accountant's Office
                </option>
                <option value="Municipal Agricultural Office">
                  Municipal Agricultural Office
                </option>
                <option value="Municipal Assessor's Office">
                  Municipal Assessor's Office
                </option>
                <option value="Municipal Civil Registrar Office">
                  Municipal Civil Registrar Office
                </option>
                <option value="Municipal Budget Office">
                  Municipal Budget Office
                </option>
                <option value="Municipal Disaster Risk Reduction and Management Office">
                  Municipal Disaster Risk Reduction and Management Office
                </option>
                <option value="Municipal Engineering Office">
                  Municipal Engineering Office
                </option>
                <option value="Municipal Environment and Natural Resources Office">
                  Municipal Environment and Natural Resources Office
                </option>
                <option value="Municipal Health Office">
                  Municipal Health Office
                </option>
                <option value="Municipal Human Resource and Management Office">
                  Municipal Human Resource and Management Office
                </option>
                <option value="Municipal Planning and Development Office">
                  Municipal Planning and Development Office
                </option>
                <option value="Municipal Social Welfare and Development Office">
                  Municipal Social Welfare and Development Office
                </option>
                <option value="Municipal Treasurer's Office">
                  Municipal Treasurer's Office
                </option>
              </select>
              <input
                type="text"
                placeholder="Filter by Date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="filter-input"
              />
              <select
                value={personnelFilter}
                onChange={(e) => setPersonnelFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Filter by Personnel</option>
                <option value="Hon. Melanie Abarientos-Garcia">
                  Hon. Melanie Abarientos-Garcia
                </option>
                <option value="Hon. Florencia G. Bargo">
                  Hon. Florencia G. Bargo
                </option>
                <option value="Mr. Allan Ronquillo">Mr. Allan Ronquillo</option>
                <option value="Ms. Deta P. Gaspar, CPA">
                  Ms. Deta P. Gaspar, CPA
                </option>
                <option value="Engr. Alex B. Idanan">
                  Engr. Alex B. Idanan
                </option>
                <option value="Mr. Elberto R. Adulta">
                  Mr. Elberto R. Adulta
                </option>
                <option value="Mr. Ceasar P. Manalo">
                  Mr. Ceasar P. Manalo
                </option>
                <option value="Mrs. Maria Elinar N. Ilagan">
                  Mrs. Maria Elinar N. Ilagan
                </option>
                <option value="Mr. Laurence V. Rojo">
                  Mr. Laurence V. Rojo
                </option>
                <option value="Engr. Fernando P Lojo Jr.">
                  Engr. Fernando P Lojo Jr.
                </option>
                <option value="Dr. Jeffrey James B. Motos">
                  Dr. Jeffrey James B. Motos
                </option>
                <option value="Ms. Ma. Glaiza C. Bermudo">
                  Ms. Ma. Glaiza C. Bermudo
                </option>
                <option value="Eng. Paz C. Caguimbal">
                  Eng. Paz C. Caguimbal
                </option>
                <option value="Ms.Ana C. Mangubat, RSW">
                  Ms.Ana C. Mangubat, RSW
                </option>
                <option value="Mr. Dante A. Cadag">Mr. Dante A. Cadag</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Filter by Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Disapproved">Disapproved</option>
                {/* Add more options as needed */}
              </select>
            </div>
          </div>
        )}

        {showTable && (
          <table
            {...getTableProps()}
            className="tables"
            style={{ border: "1px solid black", marginBottom: "30px" }}
          >
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps()}
                      style={{ border: "1px solid black", fontSize: "16px" }}
                    >
                      {column.render("Header")}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {rows.map((row) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    style={{ borderBottom: "1px solid black" }}
                  >
                    {row.cells.map((cell) => {
                      return (
                        <td
                          {...cell.getCellProps()}
                          style={{ padding: "8px", border: "1px solid black" }}
                        >
                          {cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {selectedAppointment && <AppointmentDetailsModal />}
      </div>
      <Footer />
    </div>
  );
}

export default App;
