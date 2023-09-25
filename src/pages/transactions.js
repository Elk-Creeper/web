import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage"; // Import Firebase Storage related functions
import './transactions.css';
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
    const [data, setData] = useState([]);

    // Initialize Firebase Firestore and Storage (you should have already done this)
    const storage = getStorage();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const snapshot = await collection(firestore, "birth_reg");
            const querySnapshot = await getDocs(snapshot);
            const items = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Fetch image URLs from Firebase Storage and add them to the data
            for (const item of items) {
                if (item.imagePath) {
                    const imageUrl = await getDownloadURL(ref(storage, item.imagePath));
                    item.imageUrl = imageUrl;
                }
            }

            setData(items);
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Function to handle status change
    const handleStatusChange = async (id, newStatus) => {
        try {
            // Update the status in Firestore
            const appointmentRef = doc(firestore, "birth_reg", id);
            await updateDoc(appointmentRef, {
                status: newStatus,
            });

            // Update the local data to reflect the new status
            setData((prevData) =>
                prevData.map((item) =>
                    item.id === id ? { ...item, status: newStatus } : item
                )
            );
        } catch (error) {
            console.error("Error updating status: ", error);
        }
    };

    return (
        <div>
            <div className="sidebar">
                <Sidebar />
            </div>
            <div className="container">
                <h1>Service Requests and Transaction Records</h1>
            </div>

            <div className="subheads">
                <div className="request">
                    {data.map((item) => (
                        <div key={item.id} className="request-item">
                            <div className="title">
                                <h6>Birth Registration</h6>
                            </div>
                            <p>This registration form is requested by {item.m_name}.</p>

                            {/* Child's Information */}
                            <div className="section">
                                <h3>Child's Information</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Name of Child</label>
                                        <div className="placeholder">
                                            {item.childname}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Birthdate</label>
                                        <div className="placeholder">
                                            {item.c_birthdate}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Birth Place</label>
                                        <div className="placeholder">
                                            {item.c_birthplace}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Sex</label>
                                        <div className="placeholder">
                                            {item.c_sex}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Type of Birth</label>
                                        <div className="placeholder">
                                            {item.c_typeofbirth}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Weight</label>
                                        <div className="placeholder">
                                            {item.c_weight}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Birth Order</label>
                                        <div className="placeholder">
                                            {item.c_birthorder}
                                        </div>
                                    </div>

                                    {/* Add more child fields here */}
                                </div>
                            </div>

                            {/* Mother's Information */}
                            <div className="section">
                                <h3>Mother's Information</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Mother's Name</label>
                                        <div className="placeholder">
                                            {item.m_name}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Mother's Age at the time of Birth</label>
                                        <div className="placeholder">
                                            {item.m_age}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Mother's Occupation</label>
                                        <div className="placeholder">
                                            {item.m_occur}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Mother's Citizenship</label>
                                        <div className="placeholder">
                                            {item.m_citizenship}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Mother's Religion</label>
                                        <div className="placeholder">
                                            {item.m_religion}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Total Children</label>
                                        <div className="placeholder">
                                            {item.m_totchild}
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
                                        <div className="placeholder">
                                            {item.f_name}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Father's Age at the time of Birth</label>
                                        <div className="placeholder">
                                            {item.f_age}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Father's Occupation</label>
                                        <div className="placeholder">
                                            {item.f_occur}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Father's Citizenship</label>
                                        <div className="placeholder">
                                            {item.f_citizenship}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Father's Religion</label>
                                        <div className="placeholder">
                                            {item.f_religion}
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
                                        <label>Place of Marriage</label>
                                        <div className="placeholder">
                                            {item.f_placemarried}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Attendant</label>
                                        <div className="placeholder">
                                            {item.attendant}
                                        </div>
                                    </div>
                                    {/* Add more other fields here */}
                                </div>
                            </div>

                            <div className="section">
                                <h3>Proof of Payment</h3>
                                <div className="proof">
                                    {item.payment ? (
                                        <img src={item.payment} alt="Proof of Payment" style={{ width: "150px", height: "300px" }} />
                                    ) : (
                                        <p>No payment proof available</p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Status of Appointment</label>
                                    <div className="placeholder">
                                        {item.status}
                                    </div>
                                </div>
                            </div>

                            <div className="btn">
                                <button
                                    onClick={() => handleStatusChange(item.id, "Completed")}
                                    className="completed-button"
                                    disabled={item.status === "Completed"}
                                >
                                    Completed
                                </button>
                                <button
                                    onClick={() => handleStatusChange(item.id, "On Process")}
                                    className="on-process-button"
                                    disabled={item.status === "On Process"}
                                >
                                    On Process
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;