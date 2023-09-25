import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore"; 
import { useTable } from "react-table";
import { FaSearch } from 'react-icons/fa'; // Import icons
import './appointment.css';
import Sidebar from "../components/sidebar";

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
            filteredResult = filteredResult.filter(item => item.department.toLowerCase().includes(departmentFilter.toLowerCase()));
        }
        if (dateFilter) {
            filteredResult = filteredResult.filter(item => item.date && item.date.toDate().toLocaleDateString().includes(dateFilter));
        }
        if (personnelFilter) {
            filteredResult = filteredResult.filter(item => item.personnel.toLowerCase().includes(personnelFilter.toLowerCase()));
        }
        if (statusFilter) {
            filteredResult = filteredResult.filter(item => item.status.toLowerCase().includes(statusFilter.toLowerCase()));
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
            <div className="container">
                <h1>Appointment Records</h1>
                {/* Search input */}
                <div className="search-container">
                    <FaSearch className="search-icon"></FaSearch>
                    <input
                    type="text"
                    placeholder="Search by Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />

                {/* Filter input fields or select dropdowns */}
                <div className="filter-container">
                    <input
                        type="text"
                        placeholder="Filter by Department"
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="filter-input"
                    />
                    <input
                        type="text"
                        placeholder="Filter by Date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="filter-input"
                    />
                    <input
                        type="text"
                        placeholder="Filter by Personnel"
                        value={personnelFilter}
                        onChange={(e) => setPersonnelFilter(e.target.value)}
                        className="filter-input"
                    />
                    <input
                        type="text"
                        placeholder="Filter by Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-input"
                    />
                </div>
                </div>
                <table {...getTableProps()} className="custom-table" style={{ border: "1px solid black" }}>
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