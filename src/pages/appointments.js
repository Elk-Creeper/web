import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore"; 
import { useTable } from "react-table";
import { FaSearch } from 'react-icons/fa'; // Import icons
import './appointment.css';
import Sidebar from "../components/sidebar";
import logo from '../assets/logo.png';
import notification from '../assets/icons/Notification.png';

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

    // Function to fetch data from Firestore
    const fetchData = async () => {
        try {
            const snapshot = await collection(firestore, "appointments");
            const querySnapshot = await getDocs(snapshot);
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
                accessor: "name",
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
                Header: "Date",
                accessor: "date",
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
                Header: "Time",
                accessor: "time",
                Cell: ({ value }) => {
                    if (value) {
                        const timestamp = value.toDate();
                        const formattedTime = timestamp.toLocaleTimeString();
                        return formattedTime;
                    } else {
                        return "N/A"; // Handle the case where value is null or undefined
                    }
                },
            },
            {
                Header: "Reason for Appointment",
                accessor: "reason",
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
                            onClick={() => handleStatusClick(row.original.id, "Approved")}
                            className="approve-button"
                            disabled={row.original.status === "Approved"}
                        >
                            Approved
                        </button>

                        <button
                            onClick={() => handleStatusClick(row.original.id, "Disapproved")}
                            className="disapprove-button"
                            disabled={row.original.status === "Disapproved"}
                        >
                            Disapproved
                        </button>
                    </div>
                ),
            },
            // Add more columns as needed
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
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Apply filters
    const applyFilters = () => {
        let filteredResult = filteredData;

        if (departmentFilter) {
            filteredResult = filteredResult.filter(item => item.department.includes(departmentFilter));
        }
        if (dateFilter) {
            filteredResult = filteredResult.filter(item => item.date && item.date.toDate().toLocaleDateString().includes(dateFilter));
        }
        if (personnelFilter) {
            filteredResult = filteredResult.filter(item => item.personnel.includes(personnelFilter));
        }
        if (statusFilter) {
            filteredResult = filteredResult.filter(item => item.status.includes(statusFilter));
        }

        return filteredResult;
    };

    // React Table configuration
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({
        columns,
        data: applyFilters(), filteredData, // Use the filtered data
    });

    return (
        <div>
            <div className="sidebar">
            <Sidebar />
            </div>

            <div className='container'>
                <div className="header">
                    <div className='icons'>
                        <h2>Appointments</h2>
                        <img src={notification} alt="Notification.png" className='notif-icon' />
                        <img src={logo} alt="logo" className='account-img' />
                        <div className='account-name'><h1>Admin</h1></div>
                    </div>
                </div>
                
                {/* Search input */}
                <div className="search-containers">
                    <FaSearch className="search-icon"></FaSearch>
                    <input
                        type="text"
                        placeholder="Search by Name"
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
                            <option value="Municipal Mayor's Office">Municipal mayor's Office</option>
                            <option value="Municipal Vice Mayor's Office">Municipal Vice Mayor's Office</option>
                            <option value="Sangguniang Bayan Office">Sangguniang Bayan Office</option>
                            <option value="Municipal Accountant's Office">Municipal Accountant's Office</option>
                            <option value="Municipal Agricultural Office">Municipal Agricultural Office</option>
                            <option value="Municipal Assessor's Office">Municipal Assessor's Office</option>
                            <option value="Municipal Civil Registrar Office">Municipal Civil Registrar Office</option>
                            <option value="Municipal Budget Office">Municipal Budget Office</option>
                            <option value="Municipal Disaster Risk Reduction and Management Office">Municipal Disaster Risk Reduction and Management Office</option>
                            <option value="Municipal Engineering Office">Municipal Engineering Office</option>
                            <option value="Municipal Environment and Natural Resources Office">Municipal Environment and Natural Resources Office</option>
                            <option value="Municipal Health Office">Municipal Health Office</option>
                            <option value="Municipal Human Resource and Management Office">Municipal Human Resource and Management Office</option>
                            <option value="Municipal Planning and Development Office">Municipal Planning and Development Office</option>
                            <option value="Municipal Social Welfare and Development Office">Municipal Social Welfare and Development Office</option>
                            <option value="Municipal Treasurer's Office">Municipal Treasurer's Office</option>
                            <option value="General Service Office">General Service Office</option>
                            <option value="Public Employment Service Office">Public Employment Service Office</option>
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
                            <option value="Hon. Melanie Abarientos-Garcia">Hon. Melanie Abarientos-Garcia</option>
                            <option value="Hon. Florencia G. Bargo">Hon. Florencia G. Bargo</option>
                            <option value="Mr. Allan Ronquillo">Mr. Allan Ronquillo</option>
                            <option value="Ms. Deta P. Gaspar, CPA">Ms. Deta P. Gaspar, CPA</option>
                            <option value="Engr. Alex B. Idanan">Engr. Alex B. Idanan</option>
                            <option value="Mr. Elberto R. Adulta">Mr. Elberto R. Adulta</option>
                            <option value="Mr. Ceasar P. Manalo">Mr. Ceasar P. Manalo</option>
                            <option value="Mrs. Maria Elinar N. Ilagan">Mrs. Maria Elinar N. Ilagan</option>
                            <option value="Mr. Laurence V. Rojo">Mr. Laurence V. Rojo</option>
                            <option value="Engr. Fernando P Lojo Jr.">Engr. Fernando P Lojo Jr.</option>
                            <option value="Dr. Jeffrey James B. Motos">Dr. Jeffrey James B. Motos</option>
                            <option value="Ms. Ma. Glaiza C. Bermudo">Ms. Ma. Glaiza C. Bermudo</option>
                            <option value="Eng. Paz C. Caguimbal">Eng. Paz C. Caguimbal</option>
                            <option value="Ms.Ana C. Mangubat, RSW">Ms.Ana C. Mangubat, RSW</option>
                            <option value="Mr. Dante A. Cadag">Mr. Dante A. Cadag</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Filter by Status</option>
                            <option value="Approved">Approved</option>
                            <option value="Disapproved">Disapproved</option>
                            {/* Add more options as needed */}
                        </select>
                    </div>
                </div>

                <table {...getTableProps()} className="tables" style={{ border: "1px solid black" }}>
                    <thead>
                        {headerGroups.map((headerGroup) => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map((column) => (
                                    <th
                                        {...column.getHeaderProps()}
                                        style={{ borderBottom: "1px solid black" }}
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
                                <tr {...row.getRowProps()} style={{ borderBottom: "1px solid black" }}>
                                    {row.cells.map((cell) => {
                                        return (
                                            <td
                                                {...cell.getCellProps()}
                                                style={{ padding: "8px", border: "1px solid black", }}
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
            </div>
        </div>
    );
}

export default App;