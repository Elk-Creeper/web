// Import necessary packages
import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useTable } from "react-table";
import './news.css';
import Sidebar from "../components/sidebar";

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

function App() {
  // State to hold the fetched data
  const [data, setData] = useState([]);

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
        Header: "ID",
        accessor: "id",
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
          // Convert the Firebase timestamp to a string before rendering
          const date = value.toDate(); // Assuming "date" is a Firebase timestamp
          return date.toLocaleDateString(); // You can format the date as needed
        },
      },
      {
        Header: "Time",
        accessor: "time",
        Cell: ({ value }) => {
          // Assuming "value" is a Firebase Firestore timestamp
          const timestamp = value.toDate(); // Convert Firebase Firestore timestamp to JavaScript Date
          const formattedTime = timestamp.toLocaleTimeString(); // Format as a time string
          return formattedTime;
        },
      },
      {
        Header: "Status",
        accessor: "status",
      },
      // Add more columns as needed
    ],
    []
  );

  // React Table configuration
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data,
  });

  return (
    <div>
      <Sidebar />
    <div className="container">
      <table {...getTableProps()} style={{ border: "1px solid black" }}>
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
    </div>
    </div>
  );
}

export default App;
