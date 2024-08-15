import React, { useEffect, useState } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  orderBy,
  query,
  limit,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  onSnapshot 
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import "./marriageCert.css";
import logo from "../assets/logo.png";
import notification from "../assets/icons/Notification.png";
import { FaSearch, FaSend } from "react-icons/fa";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { debounce } from "lodash";
import jsPDF from "jspdf";
import "@react-pdf-viewer/core/lib/styles/index.css";
import useAuth from "../components/useAuth";
import Footer from "../components/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faTimes, faUser, faHistory, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

function drawDottedBox(pdfDoc, x, y, size) {
  pdfDoc.setDrawColor("green"); // Set the border color
  pdfDoc.setLineWidth(0.1); // Set the border width
  pdfDoc.setLineDash([1, 1], 0); // Set the line dash pattern for a dotted line
  pdfDoc.rect(x, y, size, size, "D");
  pdfDoc.setLineDash(); // Reset the line dash pattern to default (solid line)
}

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
  const [initialLoad, setInitialLoad] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [approvedButtonDisabled, setApprovedButtonDisabled] = useState(false);
  const [rejectedButtonDisabled, setRejectedButtonDisabled] = useState(false);
  const [onProcessButtonDisabled, setOnProcessButtonDisabled] = useState(false);
  const [completedButtonDisabled, setCompletedButtonDisabled] = useState(false);

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
          email.length > 11 ? `${email.substring(0, 11)}...` : email;
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
        querySnapshot.forEach(async (doc) => {
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
        });
  
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
  
    const unsubscribe = onSnapshot(collection(firestore, "birth_reg"), (snapshot) => {
      fetchData();
    });
  
    return () => unsubscribe();
  }, []);

  const openDetailsModal = async (item) => {
    setSelectedItem(item);
    setTableVisible(false);
    // Hide the search container
    document.querySelector(".search-container").style.display = "none";
  };

  const closeDetailsModal = () => {
    setSelectedItem(null);
    setTableVisible(true);
    // Show the search container
    document.querySelector(".search-container").style.display = "flex";
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      // Update the status of the selected item
      const appointmentRef = doc(firestore, "birth_reg", id);
      await updateDoc(appointmentRef, {
        status: newStatus,
      });
  
      // Subscribe to changes in the document
      const unsubscribe = onSnapshot(appointmentRef, (doc) => {
        const selectedItemData = doc.data();
  
        // Add the status change to the histories collection
        addDoc(collection(firestore, "histories"), {
          itemId: id,
          status: newStatus,
          timestamp: serverTimestamp(),
          createdAt: selectedItemData.createdAt,
          serviceType: "Birth Registration", // Assuming serviceType is available in selectedItemData
          userName: selectedItemData.userName,
          address: selectedItemData.userBarangay,
        });
  
        // Update the local state to reflect the new status
        setSelectedItem((prevItem) => ({
          ...prevItem,
          status: newStatus,
        }));
  
        // Disable buttons based on the new status
        if (newStatus === "Approved") {
          setApprovedButtonDisabled(true);
          setRejectedButtonDisabled(true);
          setOnProcessButtonDisabled(false);
          setCompletedButtonDisabled(false);
        } else if (newStatus === "On Process") {
          setApprovedButtonDisabled(true);
          setRejectedButtonDisabled(true);
          setOnProcessButtonDisabled(true);
          setCompletedButtonDisabled(false);
        } else if (newStatus === "Completed" || newStatus === "Rejected") {
          setApprovedButtonDisabled(true);
          setRejectedButtonDisabled(true);
          setOnProcessButtonDisabled(true);
          setCompletedButtonDisabled(true);
        }
      });
  
      // Unsubscribe from snapshot listener
      return unsubscribe;
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  useEffect(() => {
    // Disable buttons based on the initial status
    if (selectedItem && selectedItem.status) {
      if (selectedItem.status === "Approved") {
        setApprovedButtonDisabled(true);
        setRejectedButtonDisabled(true);
        setOnProcessButtonDisabled(false);
        setCompletedButtonDisabled(false);
      } else if (selectedItem.status === "On Process") {
        setApprovedButtonDisabled(true);
        setRejectedButtonDisabled(true);
        setOnProcessButtonDisabled(true);
        setCompletedButtonDisabled(false);
      } else if (selectedItem.status === "Rejected" || selectedItem.status === "Completed") {
        setApprovedButtonDisabled(true);
        setRejectedButtonDisabled(true);
        setOnProcessButtonDisabled(true);
        setCompletedButtonDisabled(true);
      }
    }
  }, [selectedItem]);
  
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

  /*const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const itemsPerPage = 11;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );*/

  const centerText = (pdf, text, y) => {
    const textWidth =
      (pdf.getStringUnitWidth(text) * pdf.internal.getFontSize()) /
      pdf.internal.scaleFactor;
    const x = (pdf.internal.pageSize.width - textWidth) / 2;
    pdf.text(text, x, y);
  };

  // Function to draw a thin border line below the certificate text
  const drawThinBorderLine = (
    pdfDoc,
    startY,
    lineWidth,
    lineHeight,
    margin
  ) => {
    pdfDoc.setLineWidth(lineHeight);
    pdfDoc.rect(margin, startY, lineWidth, lineHeight);
  };

  const generateBirthRegistrationForm = (
    c_fname,
    c_mname,
    c_lname,
    sex,
    birthdate,
    birthplace,
    typeofbirth,
    c_multiple,
    birthorder,
    c_weight,
    m_name,
    m_citizenship,
    m_religion,
    bornAlive,
    childStillLiving,
    childAliveButNowDead,
    m_occur,
    m_age,
    m_residence,
    f_name,
    f_citizenship,
    f_religion,
    f_occur,
    f_age,
    f_residence,
    mpDate,
    mpPlace,
    attendant
  ) => {
    const pdfWidth = 8.5 * 25.4;
    const pdfHeight = 15 * 25.4;

    const pdfDoc = new jsPDF({
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });

    const formBorderWidth = 0.5;
    const borderColor = "green";
    const margin = 15.5;

    pdfDoc.setDrawColor(borderColor);
    pdfDoc.setLineWidth(formBorderWidth);

    pdfDoc.rect(
      margin,
      margin,
      pdfDoc.internal.pageSize.width - 2 * margin,
      pdfDoc.internal.pageSize.height - 2 * margin
    );

    // Customize the form design
    pdfDoc.setFontSize(7);
    pdfDoc.text("Municipal Form No. 102", 17, 20);
    pdfDoc.text(
      "(To be accomplished in quadruplicate using black ink)",
      135,
      20
    );
    pdfDoc.text("(Revised August 2016)", 17, 23);

    pdfDoc.setFontSize(9);
    centerText(pdfDoc, "Republic of the Philippines", 22);
    centerText(pdfDoc, "OFFICE OF THE CIVIL REGISTRAR GENERAL", 26);

    pdfDoc.setFontSize(17);
    pdfDoc.setFont("bold");
    centerText(pdfDoc, "CERTIFICATE OF LIVE BIRTH", 31);
    pdfDoc.setFont("normal");

    // Draw thin border line below the certificate text
    const lineWidth = pdfDoc.internal.pageSize.width - 2 * margin;
    const lineHeight = 0.08; // Thin border size
    pdfDoc.setLineWidth(lineHeight);
    pdfDoc.rect(margin, 22 + 10, lineWidth, lineHeight);

    // Add form fields with data in two columns
    const column1X = 17;
    const startY = 38;
    const lineHeightText = 7; // Line height for text

    pdfDoc.setFontSize(11);

    // Draw a line after the word "Province" (manually adjust both ends)
    pdfDoc.line(33, startY, 126, startY);

    pdfDoc.text("Province", column1X, startY);
    pdfDoc.text("CAMARINES SUR", 55, 37);

    // Draw a line after the word "City/Municipality" (manually adjust both ends)
    const line2X = column1X + 95 + 20; // Adjust the length of the line manually
    pdfDoc.line(
      45,
      startY + lineHeightText,
      line2X - 5,
      startY + lineHeightText
    );

    pdfDoc.text("City/Municipality", column1X, startY + lineHeightText);
    pdfDoc.text("DEL GALLEGO", 60, 44);

    // Draw thin border line below
    const lineWidths = pdfDoc.internal.pageSize.width - 2 * margin;
    const lineHeights = 0.3; // Thin border size
    pdfDoc.setLineWidth(lineHeights);
    pdfDoc.rect(margin, 37 + 10, lineWidths, lineHeights);

    // Draw vertical border line before the "Registry No." part (thinner and shorter)
    const thinnerLineWidth = 0.1; // Adjust the thickness of the vertical line
    const shorterLineHeight = 15; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(130, 32, 130, 32 + shorterLineHeight);

    pdfDoc.text("Registry No.", 133, 38);

    const lineWidthss = pdfDoc.internal.pageSize.width - 2 * margin;
    const lineHeightss = 0.1;

    pdfDoc.setFontSize(11);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("C", 17, 60);
    pdfDoc.text("H", 17, 66);
    pdfDoc.text("I", 17, 72);
    pdfDoc.text("L", 17, 78);
    pdfDoc.text("D", 17, 84);

    // Draw a vertical line
    const verticalLine = 22;
    const verticalHeight = 52; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(formBorderWidth);
    pdfDoc.line(verticalLine, 47, verticalLine, 47 + verticalHeight);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("1. NAME", 24, 51);

    drawThinBorderLine(pdfDoc, 95, lineWidthss, lineHeightss, margin);
    drawThinBorderLine(pdfDoc, 95, lineWidthss, lineHeightss, margin);
    drawThinBorderLine(pdfDoc, 95, lineWidthss, lineHeightss, margin);

    drawThinBorderLine(pdfDoc, 145, lineWidthss, lineHeightss, margin);
    drawThinBorderLine(pdfDoc, 145, lineWidthss, lineHeightss, margin);
    drawThinBorderLine(pdfDoc, 145, lineWidthss, lineHeightss, margin);

    drawThinBorderLine(pdfDoc, 183, lineWidthss, lineHeightss, margin);
    drawThinBorderLine(pdfDoc, 183, lineWidthss, lineHeightss, margin);
    drawThinBorderLine(pdfDoc, 183, lineWidthss, lineHeightss, margin);

    drawThinBorderLine(pdfDoc, 190, lineWidthss, lineHeightss, margin);
    drawThinBorderLine(pdfDoc, 213, lineWidthss, lineHeightss, margin);
    drawThinBorderLine(pdfDoc, 252, lineWidthss, lineHeightss, margin);
    drawThinBorderLine(pdfDoc, 323, lineWidthss, lineHeightss, margin);
    drawThinBorderLine(pdfDoc, 352, lineWidthss, lineHeightss, margin);
    drawThinBorderLine(pdfDoc, 292, lineWidthss, lineHeightss, margin);

    pdfDoc.line(22, 58, 200, 58);
    pdfDoc.line(22, 69, 200, 69);
    pdfDoc.line(22, 170, 200, 170);
    pdfDoc.line(22, 157, 200, 157);
    pdfDoc.line(22, 133, 200, 133);
    pdfDoc.line(22, 117, 200, 117);
    pdfDoc.line(22, 107, 200, 107);

    // Set text color to red
    pdfDoc.setTextColor("green");
    // Name
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(First)", 58, 51);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${c_fname ? c_fname.toUpperCase() : ""}`, 53, 57);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Middle)", 105, 51);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    const uppercasedMiddleName =
      typeof c_mname === "string" ? c_mname.toUpperCase() : "";
    pdfDoc.text(uppercasedMiddleName, 103, 57);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Last)", 158, 51);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    console.log("c_lname:", c_lname);
    pdfDoc.text(`${c_lname ? c_lname.toUpperCase() : ""}`, 159, 57);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("2. SEX", 24, 62);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${sex ? sex.toUpperCase() : ""}`, 34, 66);

    pdfDoc.setFontSize(7);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("green");
    pdfDoc.text("(Male/Female)", 35, 62);

    const verticalLines = 58;
    const verticalHeights = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLines, 58, verticalLines, 69);

    //3rd Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("3. DATE OF BIRTH", 65, 62);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    //pdfDoc.text(`${birthdate ? birthdate.toUpperCase() : ""}`, 65, 57);
    // Draw a line after the word

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("green");
    pdfDoc.text("(Day)", 110, 62);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Month)", 140, 62);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Year)", 170, 62);

    // Set text color to red
    pdfDoc.setTextColor("green");

    //4th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("4. PLACE OF BIRTH", 24, 72);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${birthplace ? birthplace.toUpperCase() : ""}`, 40, 79);
    // Draw a line after the word
    pdfDoc.line(22, 81, 200, 81);

    pdfDoc.setTextColor("green");

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Name of hospital/Clinic/Institution", 58, 72);
    pdfDoc.text("House No. St., Barangay)", 58, 74);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(City/Municipality)", 115, 72);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Province)", 160, 72);

    pdfDoc.setTextColor("black");
    //5th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("5a. TYPE OF BIRTH", 24, 84);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${typeofbirth ? typeofbirth.toUpperCase() : ""}`, 27, 92);
    // Draw a line after the word
    pdfDoc.line(58, 68, 121, 68);

    pdfDoc.setFontSize(7);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("green");
    pdfDoc.text("(Single, Twin, Triplets, etc.)", 25, 86);

    const verticalLiness = 57;
    const verticalHeightss = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLiness, 81, verticalLiness, 95);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("black");
    pdfDoc.text("5b. IF MULTIPLE BIRTH, CHILD WAS", 58, 84);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${c_multiple ? c_multiple.toUpperCase() : ""}`, 62, 92);

    pdfDoc.setFontSize(7);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("green");
    pdfDoc.text("(First, Second, Third, etc.)", 59, 86);

    const verticalLinessn = 113;
    const verticalHeightssn = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinessn, 81, verticalLinessn, 95);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("black");
    pdfDoc.text("5c. BIRTH ORDER", 115, 84);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${birthorder ? birthorder.toUpperCase() : ""}`, 120, 92);

    pdfDoc.setFontSize(7);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("green");
    pdfDoc.text("(Order of this birth to)", 141, 84);
    pdfDoc.text("(previous live births including fetal death)", 115, 86);
    pdfDoc.text("(First, Second, Third, etc.)", 115, 89);

    const verticalLinessnn = 165;
    const verticalHeightssnn = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinessnn, 81, verticalLinessnn, 95);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("black");
    pdfDoc.text("6. WEIGHT AT BIRTH", 167, 84);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${c_weight ? c_weight.toUpperCase() : ""}`, 175, 90);

    //Mother
    pdfDoc.setFontSize(11);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("M", 17, 105);
    pdfDoc.text("O", 17, 111);
    pdfDoc.text("T", 17, 117);
    pdfDoc.text("H", 17, 123);
    pdfDoc.text("E", 17, 129);
    pdfDoc.text("R", 17, 135);

    // Draw a vertical line
    const verticalLinessss = 22;
    const verticalHeightssss = 103; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(formBorderWidth);
    pdfDoc.line(
      verticalLinessss,
      47,
      verticalLinessss,
      47 + verticalHeightssss
    );

    // Name of mother
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("7. MAIDEN NAME", 24, 98);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${m_name ? m_name.toUpperCase() : ""}`, 70, 104);

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("green");
    pdfDoc.text("(First)", 60, 98);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Middle)", 105, 98);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Last)", 158, 98);

    // Set text color to black
    pdfDoc.setTextColor("#000000");

    //7TH Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("8. CITIZENSHIP", 24, 110);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${m_citizenship ? m_citizenship.toUpperCase() : ""}`, 30, 115);

    const verticalLinessnm = 100;
    const verticalHeightssnm = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinessnm, 107, verticalLinessnm, 117);

    //9TH Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("9. RELIGION/RELIGIOUS SECT", 105, 110);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    const religionText =
      typeof m_religion === "string" ? m_religion.toUpperCase() : "";
    pdfDoc.text(religionText, 113, 115);

    //10 Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("10a. Total number of", 24, 120);
    pdfDoc.text("children born alive ", 27, 123); //bornAlive
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${bornAlive ? bornAlive.toUpperCase() : ""}`, 40, 129);
    // Draw a line after the word

    const verticalLinessnmm = 58;
    const verticalHeightssnmm = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinessnmm, 117, verticalLinessnmm, 133);

    //10 Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("10b. No. of children still", 60, 120);
    pdfDoc.text("living including this birth", 62, 123);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(
      `${childStillLiving ? childStillLiving.toUpperCase() : ""}`,
      75,
      129
    );

    const verticalLinessnmmm = 96;
    const verticalHeightssnmmm = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinessnmmm, 117, verticalLinessnmmm, 133);

    //10 Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("10c. No. of children born", 97, 120);
    pdfDoc.text("alive but are now dead", 99, 123);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(
      `${childAliveButNowDead ? childAliveButNowDead.toUpperCase() : ""}`,
      116,
      129
    );

    const verticalLinessnnn = 131;
    const verticalHeightssnnn = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinessnnn, 117, verticalLinessnnn, 133);

    //11 Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("11. OCCUPATION", 133, 120);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${m_occur ? m_occur.toUpperCase() : ""}`, 133, 129);

    const verticalLinessns = 161;
    const verticalHeightssns = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinessns, 117, verticalLinessns, 133);
    //12 part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("12. Age at the time of this ", 163, 120);
    pdfDoc.text("birth (complete years)", 164, 123);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${m_age ? m_age.toUpperCase() : ""}`, 175, 129);

    //13
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("19. RESIDENCE", 24, 136);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${m_residence ? m_residence.toUpperCase() : ""}`, 59, 142);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("green");
    pdfDoc.text("House No. St., Barangay)", 60, 136);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(City/Municipality)", 110, 136);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Province)", 165, 136);

    //Father
    pdfDoc.setFontSize(11);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("F", 17, 150);
    pdfDoc.text("A", 17, 156);
    pdfDoc.text("T", 17, 162);
    pdfDoc.text("H", 17, 168);
    pdfDoc.text("E", 17, 174);
    pdfDoc.text("R", 17, 180);

    // Draw a vertical line
    const verticalLinesss = 22;
    const verticalHeightsss = 136; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(formBorderWidth);
    pdfDoc.line(verticalLinesss, 47, verticalLinesss, 47 + verticalHeightsss);

    // Name of father
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("7. NAME", 24, 148);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${f_name ? f_name.toUpperCase() : ""}`, 77, 153);

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");

    //Husband
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("green");
    pdfDoc.text("(First)", 58, 148);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Middle)", 105, 148);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Last)", 158, 148);

    //11th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("black");
    pdfDoc.text("15. CITIZENSHIP", 24, 160);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${f_citizenship ? f_citizenship.toUpperCase() : ""}`, 26, 167);

    const verticalLinessv = 56;
    const verticalHeightssv = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinessv, 157, verticalLinessv, 170);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("16. RELIGION/RELIGIOUS SECT", 58, 160);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${f_religion ? f_religion.toUpperCase() : ""}`, 61, 167);

    const verticalLinev = 113;
    const verticalHeightv = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinev, 157, verticalLinev, 170);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("17. OCCUPATION", 117, 160);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${f_occur ? f_occur.toUpperCase() : ""}`, 120, 167);

    const verticalLinessvv = 156;
    const verticalHeightssvv = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinessvv, 157, verticalLinessvv, 170);
    //12 part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("18. Age at the time of this ", 160, 160);
    pdfDoc.text("birth (complete years)", 161, 163);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${f_age ? f_age.toUpperCase() : ""}`, 163, 167);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("19. RESIDENCE", 24, 173);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);

    // Ensure f_residence is a string before calling toUpperCase
    const uppercasedResidence =
      typeof f_residence === "string" ? f_residence.toUpperCase() : "";
    pdfDoc.text(uppercasedResidence, 58, 180);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("green");
    pdfDoc.text("House No. St., Barangay)", 60, 173);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(City/Municipality)", 110, 173);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Province)", 165, 173);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text(
      "MARRIAGE OF PARENTS (if not married accomplish Affidavit of Acknowledgement/Admission of Paternity at the back.)",
      17,
      187
    );

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("20a. DATE", 17, 194);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${mpDate ? mpDate.toUpperCase() : ""}`, 25, 199);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("green");
    pdfDoc.text("(Month)", 52, 194);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Day)", 66, 194);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Year)", 78, 194);

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");

    const verticalLinessrv = 92;
    const verticalHeightssrv = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinessrv, 190, verticalLinessrv, 200);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("20b. PLACE", 93, 194);
    pdfDoc.setTextColor("black");
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${mpPlace ? mpPlace.toUpperCase() : ""}`, 113, 199);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("green");
    pdfDoc.text("(City/Municipality)", 115, 194);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Province)", 152, 194);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Country)", 179, 194);

    //21
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("black");
    pdfDoc.text("21a. ATTENDANT", 17, 205);
    pdfDoc.setTextColor("#000000");

    // Check if the selected attendant is "Nurse"
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.line(17, 212, 24, 212);
    pdfDoc.text("1 Physician", 25, 212);

    if (attendant && attendant.toLowerCase() === "physician") {
      pdfDoc.setFontSize(14);
      pdfDoc.setFont("bold");
      pdfDoc.text("/", 22, 212);
      pdfDoc.text("/", 22, 212);
      pdfDoc.text("/", 22, 212);
      pdfDoc.text("/", 22, 212);
      pdfDoc.text("/", 22, 212);
      pdfDoc.text("/", 22, 212);
      pdfDoc.text("/", 22, 212);
      pdfDoc.text("/", 22, 212);
      pdfDoc.text("/", 22, 212);
      pdfDoc.text("/", 22, 212);
    }

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.line(43, 212, 50, 212);
    pdfDoc.text("2 Nurse", 51, 212);

    if (attendant && attendant.toLowerCase() === "nurse") {
      pdfDoc.setFontSize(14);
      pdfDoc.setFont("bold");
      pdfDoc.text("/", 45, 212);
      pdfDoc.text("/", 45, 212);
      pdfDoc.text("/", 45, 212);
      pdfDoc.text("/", 45, 212);
      pdfDoc.text("/", 45, 212);
      pdfDoc.text("/", 45, 212);
      pdfDoc.text("/", 45, 212);
      pdfDoc.text("/", 45, 212);
      pdfDoc.text("/", 45, 212);
      pdfDoc.text("/", 45, 212);
    }

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.line(67, 212, 74, 212);
    pdfDoc.text("3 Midwife", 75, 212);

    if (attendant && attendant.toLowerCase() === "midwife") {
      pdfDoc.setFontSize(14);
      pdfDoc.setFont("bold");
      pdfDoc.text("/", 69, 212);
      pdfDoc.text("/", 69, 212);
      pdfDoc.text("/", 69, 212);
      pdfDoc.text("/", 69, 212);
      pdfDoc.text("/", 69, 212);
      pdfDoc.text("/", 69, 212);
      pdfDoc.text("/", 69, 212);
      pdfDoc.text("/", 69, 212);
      pdfDoc.text("/", 69, 212);
      pdfDoc.text("/", 69, 212);
    }

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.line(93, 212, 100, 212);
    pdfDoc.text("4 Hilot (Traditional Birth Attendant) ", 101, 212);

    if (attendant && attendant.toLowerCase() === "hilot") {
      pdfDoc.setFontSize(14);
      pdfDoc.setFont("bold");
      pdfDoc.text("/", 95, 212);
      pdfDoc.text("/", 95, 212);
      pdfDoc.text("/", 95, 212);
      pdfDoc.text("/", 95, 212);
      pdfDoc.text("/", 95, 212);
      pdfDoc.text("/", 95, 212);
      pdfDoc.text("/", 95, 212);
      pdfDoc.text("/", 95, 212);
      pdfDoc.text("/", 95, 212);
      pdfDoc.text("/", 95, 212);
    }
    //HERE AGAIN

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.line(153, 212, 160, 212);
    pdfDoc.text("5 Others (Specify) ", 161, 212);
    pdfDoc.line(186, 212, 195, 212);

    if (attendant && attendant.toLowerCase() === "Others") {
      pdfDoc.setFontSize(14);
      pdfDoc.setFont("bold");
      pdfDoc.text("/", 155, 212);
      pdfDoc.text("/", 155, 212);
      pdfDoc.text("/", 155, 212);
      pdfDoc.text("/", 155, 212);
      pdfDoc.text("/", 155, 212);
      pdfDoc.text("/", 155, 212);
      pdfDoc.text("/", 155, 212);
      pdfDoc.text("/", 155, 212);
      pdfDoc.text("/", 155, 212);
      pdfDoc.text("/", 155, 212);
    }

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text(
      "21b. CERTIFICATION OF ATTENDANT AT BIRTH (Physician, Nurse, Midwife, Traditional Birth Attendant/Hilot etc.)",
      17,
      219
    );
    pdfDoc.text(
      "I hereby certify that I attended the birth of the child who was born alive at ______ am/pm on the date of birth specified above.)",
      26,
      222
    );

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("Signature", 17, 230);
    pdfDoc.line(30, 230, 99, 230);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("Address", 103, 230);
    pdfDoc.line(115, 230, 197, 230);
    pdfDoc.line(103, 240, 197, 240);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("Name in Print", 17, 240);
    pdfDoc.line(36, 240, 99, 240);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("Time or Position", 17, 250);
    pdfDoc.line(39, 250, 99, 250);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("Date", 103, 250);
    pdfDoc.line(111, 250, 197, 250);

    pdfDoc.setFontSize(9);
    pdfDoc.text("22. CERTIFICATION OF INFORMATION ", 17, 260);
    pdfDoc.text(
      "I hereby certify that all information supplied are true and",
      26,
      264
    );
    pdfDoc.text("correct to my own knowledge and belief", 22, 268);
    pdfDoc.text("Signature", 17, 275);
    pdfDoc.line(30, 275, 105, 275);
    pdfDoc.text("Name in Print", 17, 280);
    pdfDoc.line(35, 280, 105, 280);
    pdfDoc.text("Relationship to the Child", 17, 285);
    pdfDoc.line(49, 285, 105, 285);
    pdfDoc.text("Date", 17, 290);
    pdfDoc.line(24, 290, 105, 290);

    pdfDoc.text("23. PREPARED BY", 108, 260);
    pdfDoc.text("Signature", 108, 275);
    pdfDoc.line(122, 275, 197, 275);
    pdfDoc.text("Name in Print", 108, 280);
    pdfDoc.line(127, 280, 197, 280);
    pdfDoc.text("Title or Position", 108, 285);
    pdfDoc.line(130, 285, 197, 285);
    pdfDoc.text("Date", 108, 290);
    pdfDoc.line(116, 290, 197, 290);

    //24
    pdfDoc.setFontSize(9);
    pdfDoc.text("21. RECEIVED BY ", 17, 297);
    pdfDoc.text("Signature", 17, 302);
    pdfDoc.line(30, 302, 105, 302);
    pdfDoc.text("Name in Print", 17, 307);
    pdfDoc.line(35, 307, 105, 307);
    pdfDoc.text("Title or Position", 17, 312);
    pdfDoc.line(40, 312, 105, 312);
    pdfDoc.text("Date", 17, 317);
    pdfDoc.line(24, 317, 105, 317);

    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(106, 252, 106, 323);

    pdfDoc.text(
      "22. REGISTERED AT THE OFFICE OF THE CIVIL REGISTRAR ",
      108,
      297
    );
    pdfDoc.text("Signature", 108, 302);
    pdfDoc.line(122, 302, 197, 302);
    pdfDoc.text("Name in Print", 108, 307);
    pdfDoc.line(127, 307, 197, 307);
    pdfDoc.text("Title or Position", 108, 312);
    pdfDoc.line(130, 312, 197, 312);
    pdfDoc.text("Date", 108, 317);
    pdfDoc.line(116, 317, 197, 317);

    pdfDoc.setFont("bold");
    pdfDoc.setFontSize(8);
    pdfDoc.text(
      "TO BE FILLED-UP AT THE OFFICE OF THE CIVIL REGISTRAR",
      17,
      354.5
    );

    pdfDoc.setFont("bold");
    pdfDoc.setFontSize(8);
    pdfDoc.text("8", 28, 358);
    drawDottedBox(pdfDoc, 28, 359, 5);
    drawDottedBox(pdfDoc, 33, 359, 5);

    pdfDoc.text("9", 41, 358);
    drawDottedBox(pdfDoc, 41, 359, 5);
    drawDottedBox(pdfDoc, 46, 359, 5);

    pdfDoc.text("11", 54, 358);
    drawDottedBox(pdfDoc, 54, 359, 5);
    drawDottedBox(pdfDoc, 59, 359, 5);
    drawDottedBox(pdfDoc, 64, 359, 5);

    pdfDoc.text("13", 72, 358);
    drawDottedBox(pdfDoc, 72, 359, 5);
    drawDottedBox(pdfDoc, 77, 359, 5);
    drawDottedBox(pdfDoc, 82, 359, 5);
    drawDottedBox(pdfDoc, 87, 359, 5);
    drawDottedBox(pdfDoc, 92, 359, 5);
    drawDottedBox(pdfDoc, 97, 359, 5);
    drawDottedBox(pdfDoc, 92, 359, 5);
    drawDottedBox(pdfDoc, 97, 359, 5);

    pdfDoc.text("15", 105, 358);
    drawDottedBox(pdfDoc, 105, 359, 5);
    drawDottedBox(pdfDoc, 110, 359, 5);

    pdfDoc.text("15", 118, 358);
    drawDottedBox(pdfDoc, 118, 359, 5);
    drawDottedBox(pdfDoc, 123, 359, 5);

    pdfDoc.text("15", 131, 358);
    drawDottedBox(pdfDoc, 131, 359, 5);
    drawDottedBox(pdfDoc, 136, 359, 5);
    drawDottedBox(pdfDoc, 141, 359, 5);

    pdfDoc.text("15", 148, 358);
    drawDottedBox(pdfDoc, 148, 359, 5);
    drawDottedBox(pdfDoc, 153, 359, 5);
    drawDottedBox(pdfDoc, 158, 359, 5);
    drawDottedBox(pdfDoc, 163, 359, 5);
    drawDottedBox(pdfDoc, 168, 359, 5);
    drawDottedBox(pdfDoc, 173, 359, 5);
    drawDottedBox(pdfDoc, 178, 359, 5);
    drawDottedBox(pdfDoc, 183, 359, 5);

    const lineWidthsss = pdfDoc.internal.pageSize.width - 2 * margin;
    const lineHeightsss = 0.2; // Thin border size
    drawThinBorderLine(pdfDoc, 200, lineWidthsss, lineHeightsss, margin);

    // Move to the back of the document
    pdfDoc.addPage();

    // Back of the form
    pdfDoc.setDrawColor(borderColor);
    pdfDoc.setLineWidth(formBorderWidth);

    pdfDoc.rect(
      margin,
      margin,
      pdfDoc.internal.pageSize.width - 2 * margin,
      pdfDoc.internal.pageSize.height - 2 * margin
    );

    // Set font and other properties for the back of the form
    pdfDoc.setFontSize(12);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");

    // Add a title for the affidavit on the back
    pdfDoc.text("AFFIDAVIT OF ACKNOWLEDGEMENT/ADMISSION OF PATERNITY", 48, 22);

    pdfDoc.setFontSize(8);
    pdfDoc.text("(For births before 3 August 1988)", 63, 27);
    pdfDoc.text("(For births after 3 August 1988)", 115, 27);

    // Add the content of the affidavit on the back
    const affidavitText = `

           I/We, _________________________________________ and ___________________________________________, 
of legal age, am/are the natural mother and/or father of _________________________________________, who was
born on _____________________________ at ______________________________ 

          I am/We are executing this affidavit to attest to the truthfulness of the foregoing statements and for purposes of
acknowledging my/our child. 

`;

    pdfDoc.setFontSize(10);
    pdfDoc.text(affidavitText, 17, 40);

    pdfDoc.setFontSize(9);
    pdfDoc.line(17, 75, 95, 75);
    pdfDoc.text("(Signature Over Printed Name of Father)", 21, 80);

    pdfDoc.setFontSize(9);
    pdfDoc.line(119, 75, 199, 75);
    pdfDoc.text("(Signature Over Printed Name of Mother)", 124, 80);

    const affidavitTextss = `

          SUBSCRIBED AND SWORN to before me this ____ day of _________________________________, _________ by
  __________________________________________ and _______________________________, who exhibit to me (his/her)
CTC/valid ID _____________________________________ issued on ________________________________________ at
_________________________________.
 

`;
    pdfDoc.setFontSize(10);
    pdfDoc.text(affidavitTextss, 17, 85);

    pdfDoc.setFontSize(9);
    pdfDoc.line(17, 118, 95, 118);
    pdfDoc.text("Signature of the Administering Officer", 28, 123);

    pdfDoc.setFontSize(9);
    pdfDoc.line(119, 118, 199, 118);
    pdfDoc.text("Position/ Title/ Designation", 144, 123);

    pdfDoc.setFontSize(9);
    pdfDoc.line(17, 130, 95, 130);
    pdfDoc.text("Name in Print", 45, 135);

    pdfDoc.setFontSize(9);
    pdfDoc.line(119, 130, 199, 130);
    pdfDoc.text("Address", 150, 135);

    drawThinBorderLine(pdfDoc, 140, lineWidthss, lineHeightss, margin);

    pdfDoc.setFontSize(12);
    pdfDoc.text("AFFIDAVIT FOR DELAYED REGISTRATION OF BIRTH", 45, 145);

    pdfDoc.setFontSize(8);
    pdfDoc.text(
      "(To be accomplished by the hospital/clinic administrator, father, mother, or guardian or the person himself if 18 years old or over.)",
      27,
      148
    );

    const affidavitTexts = `

    I,__________________________________________, of legal age, single/married/divorced/widow/widower, with
residence and postal address at ___________________________________________________________________________
_________________ after having been duly sworn in accordance with law, do hereby depose and say:

`;
    pdfDoc.setFontSize(10);
    pdfDoc.text(affidavitTexts, 17, 149);

    pdfDoc.text(
      "1. That I am the applicant for the delayed registration of: ",
      24,
      175
    );
    drawDottedBox(pdfDoc, 27, 177, 3);
    pdfDoc.text("my birth in", 32, 179);
    pdfDoc.line(50, 180, 120, 180);
    pdfDoc.text("on", 122, 179);
    pdfDoc.line(127, 180, 198, 180);

    drawDottedBox(pdfDoc, 27, 181, 3);
    pdfDoc.text("the birth of ", 32, 184);
    pdfDoc.line(50, 185, 117, 185);
    pdfDoc.text("who was born in ", 119, 184);
    pdfDoc.line(145, 185, 198, 185);

    pdfDoc.line(32, 191, 86, 191);
    pdfDoc.text("on ", 88, 190);
    pdfDoc.line(93, 191, 160, 191);

    pdfDoc.text("2.That  I/he/she was  attended  at  birth  by ", 24, 196);
    pdfDoc.line(85, 197, 166, 197);
    pdfDoc.text("who resides at ", 168, 196);
    pdfDoc.line(24, 201, 130, 201);
    pdfDoc.text("3. That I am/he/she is a citizen of", 24, 206);
    pdfDoc.line(73, 207, 169, 207);
    pdfDoc.text("4. That my/his/her parents where.", 24, 213);
    drawDottedBox(pdfDoc, 73, 210, 3);
    pdfDoc.text("married on", 79, 213);
    pdfDoc.line(96, 213, 145, 213);
    pdfDoc.text("at", 147, 213);
    pdfDoc.line(152, 213, 198, 213);
    pdfDoc.line(85, 220, 198, 220);
    drawDottedBox(pdfDoc, 73, 222, 3);
    pdfDoc.text(
      "not married but I/he/she was acknowledged/not acknowledged by ",
      79,
      225
    );
    pdfDoc.text("my/his/her fat2her whose name is", 83, 230);
    pdfDoc.line(133, 231, 196, 231);
    pdfDoc.text(
      "5. That the reason for the delay in registering my/his/her birth was",
      24,
      236
    );
    pdfDoc.line(120, 237, 198, 237);
    pdfDoc.line(30, 242, 190, 242);
    pdfDoc.text("6. (For the applicant only) That I am married to", 24, 248);
    pdfDoc.line(95, 249, 190, 249);
    pdfDoc.text(
      "(if the applicant is other than the  document owner) That I am the",
      28,
      254
    );
    pdfDoc.line(120, 255, 159, 255);
    pdfDoc.text("of the said person.", 161, 254);
    pdfDoc.text(
      "7. That I am executing this affidavit to attest to the truthfulness of the foregoing statements for all legal",
      24,
      260
    );
    pdfDoc.text("intents and purposes.", 28, 264);
    pdfDoc.text(
      "In  truth  whereof, I  have  affixed  my  signature  below  this",
      24,
      275
    );
    pdfDoc.line(110, 276, 128, 276);
    pdfDoc.text("day  of", 130, 276);
    pdfDoc.line(142, 276, 198, 276);
    pdfDoc.line(17, 281, 69, 281);
    pdfDoc.text("at", 71, 281);
    pdfDoc.line(75, 281, 129, 281);
    pdfDoc.text(",  Philippines.", 130, 281);

    pdfDoc.line(130, 295, 198, 295);
    pdfDoc.text("(Signature Over Printed Name of Affirdavit)", 133, 299);

    pdfDoc.setFont("bold");
    pdfDoc.text("SUBSCRIBED AND SWORN", 24, 307);

    pdfDoc.text("to before me this", 69, 307);
    pdfDoc.line(94, 308, 102, 308);
    pdfDoc.text("day of", 104, 307);
    pdfDoc.line(114, 308, 179, 308);
    pdfDoc.line(180, 308, 192, 308);
    pdfDoc.text("at", 195, 307);
    pdfDoc.line(17, 315, 77, 315);
    pdfDoc.text(",   Philippines,", 78, 315);
    pdfDoc.text(
      "affiant  who  exhibited  to  me  his/her  CTC/valid  ID",
      100,
      315
    );
    pdfDoc.line(17, 322, 70, 322);
    pdfDoc.text("issued on", 75, 322);
    pdfDoc.line(91, 322, 137, 322);
    pdfDoc.text("at", 139, 322);
    pdfDoc.line(143, 322, 198, 322);

    pdfDoc.setFontSize(9);
    pdfDoc.line(17, 340, 95, 340);
    pdfDoc.text("Signature of the Administering Officer", 28, 345);

    pdfDoc.setFontSize(9);
    pdfDoc.line(119, 340, 199, 340);
    pdfDoc.text("Position/ Title/ Designation", 144, 345);

    pdfDoc.setFontSize(9);
    pdfDoc.line(17, 355, 95, 355);
    pdfDoc.text("Name in Print", 45, 360);

    pdfDoc.setFontSize(9);
    pdfDoc.line(119, 355, 199, 355);
    pdfDoc.text("Address", 150, 360);

    // Save the PDF or open in a new window
    pdfDoc.save("Certificate of Live Birth.pdf");
  };

  const generateCustomizedForm = () => {
    if (selectedItem) {
      const {
        c_fname,
        c_mname,
        c_lname,
        sex,
        birthdate,
        birthplace,
        typeofbirth,
        c_multiple,
        birthorder,
        c_weight,
        m_name,
        m_citizenship,
        m_religion,
        bornAlive,
        childStillLiving,
        childAliveButNowDead,
        m_occur,
        m_age,
        m_residence,
        f_name,
        f_citizenship,
        f_religion,
        f_occur,
        f_age,
        f_residence,
        mpDate,
        mpPlace,
        attendant,
      } = selectedItem;
      generateBirthRegistrationForm(
        c_fname,
        c_mname,
        c_lname,
        sex,
        birthdate,
        birthplace,
        typeofbirth,
        c_multiple,
        birthorder,
        c_weight,
        m_name,
        m_citizenship,
        m_religion,
        bornAlive,
        childStillLiving,
        childAliveButNowDead,
        m_occur,
        m_age,
        m_residence,
        f_name,
        f_citizenship,
        f_religion,
        f_occur,
        f_age,
        f_residence,
        mpDate,
        mpPlace,
        attendant
      );
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
          <h1>Registration of Live Birth</h1>
        </div>

        <div className="search-container">
          <FaSearch className="search-icon"></FaSearch>
          <input
            type="text"
            placeholder="Search"
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
                  <th style={{ border: "1px solid black" }}>No.</th>
                  <th style={{ border: "1px solid black" }}>
                    Name of Applicant
                  </th>
                  <th style={{ border: "1px solid black" }}>Name of Child</th>
                  <th style={{ border: "1px solid black" }}>Residency</th>
                  <th style={{ border: "1px solid black" }}>Contact</th>
                  <th style={{ border: "1px solid black" }}>
                    Date of Application
                  </th>
                  <th style={{ border: "1px solid black" }}>Status</th>
                  <th style={{ border: "1px solid black" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id}>
                      <td style={{ border: "1px solid black" }}>{index + 1}</td>
                      <td style={{ border: "1px solid black" }}>
                        {`${item.userName || "N/A"} ${
                          item.userLastName || ""
                        }`.trim() || "N/A"}
                      </td>
                      <td style={{ border: "1px solid black" }}>
                        {`${item.c_fname || "N/A"} ${item.c_mname || "N/A"} ${
                          item.c_lname || ""
                        }`.trim() || "N/A"}
                      </td>
                      <td style={{ border: "1px solid black" }}>
                        {item.userBarangay || "N/A"}
                      </td>
                      <td style={{ border: "1px solid black" }}>
                        {item.userEmail || "N/A"}
                      </td>
                      <td style={{ border: "1px solid black" }}>
                        {item.createdAt && item.createdAt.toDate
                          ? item.createdAt.toDate().toLocaleString()
                          : "Invalid Date"}
                      </td>
                      <td style={{ border: "1px solid black" }}>
                        {item.status || "N/A"}
                      </td>
                      <td style={{ border: "1px solid black" }}>
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
                            : "N/A"}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Birth Order</label>
                        <div className="placeholder">
                          {selectedItem.c_birthorder
                            ? selectedItem.c_birthorder
                            : "N/A"}
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
                            : "Not Married"}
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
                      disabled={approvedButtonDisabled}
                    >
                      Approved
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(selectedItem.id, "On Process")
                      }
                      className="on-process-button"
                      disabled={onProcessButtonDisabled}
                    >
                      On Process
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(selectedItem.id, "Completed")
                      }
                      className="on-process-button"
                      disabled={completedButtonDisabled}
                    >
                      Completed
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(selectedItem.id, "Rejected")
                      }
                      className="on-process-button"
                      disabled={rejectedButtonDisabled}
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

                  <div>
                    <button
                      onClick={generateCustomizedForm}
                      className="open-pdf-button-container"
                    >
                      Generate Form
                    </button>
                  </div>
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
