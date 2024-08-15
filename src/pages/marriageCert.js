import React, { useEffect, useState } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
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
  onSnapshot 
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage"; // Import Firebase Storage related functions
import "./birthReg.css";
import jsPDF from "jspdf";
import logo from "../assets/logo.png";
import notification from "../assets/icons/Notification.png";
import { FaSearch } from "react-icons/fa";
import useAuth from "../components/useAuth";
import Footer from "../components/footer";
import { format } from "date-fns"; // Import the format function from date-fns
import CopyMarriageCertificateForm from "./CopyMarriageCertificateForm";
import MarriageRegistrationForm from "./MarriageRegistrationForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretDown,
  faTimes,
  faPaperPlane,
  faUser, faHistory, faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);

function drawDottedBox(pdfDoc, x, y, size) {
  pdfDoc.setDrawColor("#FF0000"); // Set the border color
  pdfDoc.setLineWidth(0.1); // Set the border width
  pdfDoc.setLineDash([1, 1], 0); // Set the line dash pattern for a dotted line
  pdfDoc.rect(x, y, size, size, "D");
  pdfDoc.setLineDash(); // Reset the line dash pattern to default (solid line)
}

function formatDate(date) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString(undefined, options);
}

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableVisible, setTableVisible] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const history = useHistory();
  const [approvedButtonDisabled, setApprovedButtonDisabled] = useState(false);
  const [rejectedButtonDisabled, setRejectedButtonDisabled] = useState(false);
  const [onProcessButtonDisabled, setOnProcessButtonDisabled] = useState(false);
  const [completedButtonDisabled, setCompletedButtonDisabled] = useState(false);


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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("");
  const [selectedDayFilter, setSelectedDayFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [textInput, setTextInput] = useState("");
  const [initialLoad, setInitialLoad] = useState(true); //automatic pending
  const unsubscribeFunctions = [];

  const [selectedItemForForm, setSelectedItemForForm] = useState(null);
  const [showMarriageCertificateForm, setShowMarriageCertificateForm] =
    useState(false);
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  const handleTextChange = (event) => {
    setTextInput(event.target.value);
  };

  const collectionTypeMap = {
    marriageCert: "Request Copy of Marriage Certificate",
    marriage_reg: "Marriage Registration",
  };

  const fetchData = async () => {
    try {
      const collections = ["marriageCert", "marriage_reg"];
      let allData = [];
  
      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(firestore, collectionName));
        console.log(`Fetching data from ${collectionName}...`);
  
        for (const doc of querySnapshot.docs) { // Change here
          const item = {
            id: doc.id,
            status: "Pending",
            collectionType: collectionTypeMap[collectionName],
            createdAt: doc.data().createdAt || { seconds: 0 },
            ...doc.data(),
          };
  
          if (item.imagePath) {
            const imageUrl = await getDownloadURL(ref(storage, item.imagePath));
            item.imageUrl = imageUrl;
          }
  
          if (!item.createdAt) {
            console.error(`Missing createdAt field in document with id: ${item.id}`);
            continue;
          }
  
          allData.push(item);
        }
  
        allData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      }
  
      setData(allData);
      setLoading(false);
  
      if (initialLoad) {
        setSelectedStatusFilter("Pending");
        setInitialLoad(false);
      }
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
    document.querySelector(".search-container").style.display = "none";

    // Additional logic to handle form rendering based on collectionType
    if (item.collectionType === "Request Copy of Marriage Certificate") {
      // Render CopyMarriageCertificateForm
      setSelectedForm(<CopyMarriageCertificateForm selectedItem={item} />);
    } else if (item.collectionType === "Marriage Registration") {
      // Render MarriageRegistrationForm
      setSelectedForm(<MarriageRegistrationForm selectedItem={item} />);
    }
  };

  const closeDetailsModal = () => {
    setSelectedItem(null);
    setTableVisible(true);
    document.querySelector(".search-container").style.display = "flex";
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      // Determine the collection name based on the selected item's collectionType
      const collectionName =
        selectedItem.collectionType === "Marriage Registration"
          ? "marriage_reg"
          : "marriageCert";
  
      // Update the status for the selected item in the appropriate collection
      await updateDoc(doc(firestore, collectionName, id), {
        status: newStatus,
      });
  
      // Subscribe to changes in the document to get real-time updates
      const unsubscribe = onSnapshot(doc(firestore, collectionName, id), (doc) => {
        const selectedItemData = doc.data();
  
        // Add the status change to the histories collection
        addDoc(collection(firestore, "histories"), {
          itemId: id,
          status: newStatus,
          timestamp: serverTimestamp(),
          createdAt: selectedItemData.createdAt,
          serviceType:
            selectedItem.collectionType === "Marriage Registration"
              ? "Marriage Registration"
              : "Marriage Certificate",
          userName: selectedItemData.userName,
          address: selectedItemData.userBarangay,
          employee: user ? user.email : "Unknown", // Assuming you store user's email in user.email
        });
  
        // Update the local state to reflect the new status
        setSelectedItem((prevItem) => ({ ...prevItem, status: newStatus }));
  
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
  
      // Return the unsubscribe function to stop listening for updates when needed
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

    const matchSearchQuery =
      !searchQuery ||
      item.childname.toLowerCase().includes(searchQuery.toLowerCase());
    const matchYearFilter =
      !selectedYearFilter ||
      (item.c_birthdate &&
        item.c_birthdate.toDate &&
        item.c_birthdate.toDate().getFullYear().toString() ===
          selectedYearFilter);
    const matchMonthFilter =
      !selectedMonthFilter ||
      (item.c_birthdate &&
        item.c_birthdate.toDate &&
        getMonthName(item.c_birthdate.toDate().getMonth() + 1).toLowerCase() ===
          selectedMonthFilter.toLowerCase());
    const matchDayFilter =
      !selectedDayFilter ||
      (item.c_birthdate &&
        item.c_birthdate.toDate &&
        item.c_birthdate.toDate().getDate().toString() === selectedDayFilter);
    const matchStatusFilter =
      !selectedStatusFilter ||
      item.status.toLowerCase().includes(selectedStatusFilter.toLowerCase());

    return (
      matchSearchQuery &&
      matchYearFilter &&
      matchMonthFilter &&
      matchDayFilter &&
      matchStatusFilter
    );
  });

  const finalData = filteredData.length > 0 ? filteredData : data;

  const handleSubmit = async () => {
    try {
      if (selectedItem) {
        // If there is a selected item, update its remarks
        const collectionName =
          selectedItem.collectionType === "Request Copy of Marriage Certificate"
            ? "marriageCert"
            : "marriage_reg";
        const appointmentRef = doc(firestore, collectionName, selectedItem.id);
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
        const collectionName = "marriageCert"; // Set the default collection name
        if (textInput.trim() !== "") {
          // Only add a new document if the remarks are not empty
          const remarksCollectionRef = collection(firestore, collectionName);
          const newRemarksDocRef = await addDoc(remarksCollectionRef, {
            remarks: textInput,
          });

          console.log("Remarks added with ID: ", newRemarksDocRef.id);
        }
      }

      setTextInput("");
    } catch (error) {
      console.error("Error updating/adding remarks: ", error);
    }
  };

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

  // Function to draw a dotted line
  const drawDottedLine = (pdf, startX, startY, endX, endY, gapSize) => {
    const totalLength = Math.sqrt(
      Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
    );
    const dashCount = Math.floor(totalLength / gapSize);

    const deltaX = (endX - startX) / dashCount;
    const deltaY = (endY - startY) / dashCount;

    let currentX = startX;
    let currentY = startY;

    for (let i = 0; i < dashCount; i++) {
      if (i % 2 === 0) {
        pdf.line(currentX, currentY, currentX + deltaX, currentY + deltaY);
      }
      currentX += deltaX;
      currentY += deltaY;
    }
  };

  // Function to convert a date's month into words format
  const formatMonthToWords = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return "Invalid Date";
    }

    // Define array for months
    const monthsInWords = [
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

    // Get month component from the date
    const month = date.getMonth();

    // Construct the month in words format
    const formattedMonth = monthsInWords[month];

    return formattedMonth;
  };

  const generateMarriageCertificateForm = (
    h_fname,
    h_mname,
    h_lname,
    h_age,
    h_citizenship,
    h_civilstat,
    h_dateBirth,
    h_fatherName,
    h_motherName,
    h_personName,
    h_placeBirth,
    h_relationship,
    h_religion,
    h_residence,
    h_sex,
    hf_citizenship,
    hm_citizenship,
    hp_residence,
    w_fname,
    w_mname,
    w_lname,
    w_age,
    w_citizenship,
    w_civilstat,
    w_dateBirth,
    w_dateMarriage,
    w_fatherName,
    w_motherName,
    w_personName,
    w_placeBirth,
    w_placeMarriage,
    w_relationship,
    w_religion,
    w_residence,
    w_sex,
    wf_citizenship,
    wm_citizenship,
    wp_residence,
    orderNumber
  ) => {
    const pdfWidth = 8.5 * 25.4; // Convert inches to mm (1 inch = 25.4 mm)
    const pdfHeight = 15 * 25.4;

    const pdfDoc = new jsPDF({
      unit: "mm",
      format: [pdfWidth, pdfHeight], // Set the custom page size
    });

    // Include the Arial font
    pdfDoc.addFont("Arial", "normal");

    // Set the page border with specified width, color, and margin
    const formBorderWidth = 0.5;
    const borderColor = "#FF0000";
    const margin = 15.5;

    pdfDoc.setDrawColor(borderColor);
    pdfDoc.setLineWidth(formBorderWidth);

    pdfDoc.rect(
      margin,
      margin,
      pdfDoc.internal.pageSize.width - 2 * margin,
      pdfDoc.internal.pageSize.height - 2 * margin
    );

    pdfDoc.setFontSize(7);
    pdfDoc.setFont("Arial");
    pdfDoc.text("Municipal Form No. 97", 17, 19);
    pdfDoc.text(
      "(To be accomplished in quadruplicate using black ink)",
      146,
      19
    );
    pdfDoc.text("(Revised August 2016)", 17, 22);

    pdfDoc.setFontSize(9);
    centerText(pdfDoc, "Republic of the Philippines", 21);
    centerText(pdfDoc, "OFFICE OF THE CIVIL REGISTRAR GENERAL", 25);

    pdfDoc.setFontSize(17);
    pdfDoc.setFont("bold");
    centerText(pdfDoc, "CERTIFICATE OF MARRIAGE", 31);
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

    // Assuming selectedItem contains the date information fetched from Firebase
    const createdAt =
      selectedItem.createdAt && selectedItem.createdAt.toDate
        ? selectedItem.createdAt.toDate()
        : new Date(); // Default to current date if no valid date is available

    // Get the full year from the created date
    const years = createdAt.getFullYear(); // Get the full year (4 digits)
    const month = createdAt.getMonth() + 1; // Month starts from 0, so add 1 to get the correct month
    const days = createdAt.getDate();

    // Construct the registry number using the year, month, and day
    const registryNumber = `${years.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}-${days.toString().padStart(2, "0")}`;

    // Draw vertical border line before the "Registry No." part (thinner and shorter)
    const thinnerLineWidth = 0.1; // Adjust the thickness of the vertical line
    const shorterLineHeight = 15; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(130, 32, 130, 32 + shorterLineHeight);

    pdfDoc.text("Registry No.: ", 133, 38);

    pdfDoc.setFontSize(15);
    pdfDoc.setFont("bold");
    pdfDoc.setTextColor("blue");
    pdfDoc.text(registryNumber, 140, 44);
    pdfDoc.setTextColor("#000000");

    // Draw a vertical line
    const verticalLineX = 50;
    const verticalLineHeight = 153; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLineX, 47, verticalLineX, 47 + verticalLineHeight);

    // Add text "1. Name of Contracting Parties"
    pdfDoc.setFont("normal");
    pdfDoc.setFontSize(9);
    pdfDoc.text("1. Name of", 17, 57);
    pdfDoc.text("    Contracting", 17, 61);
    pdfDoc.text("    Parties", 17, 65);

    pdfDoc.setFontSize(11);
    pdfDoc.setFont("bold");
    pdfDoc.text("HUSBAND", 77, 51);
    pdfDoc.setFont("normal");

    // Draw a vertical line before "Name of Contracting Parties" text
    const verticalLine = 123;
    const verticalHeight = 153; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(formBorderWidth);
    pdfDoc.line(verticalLine, 47, verticalLine, 47 + verticalHeight);

    // Draw thin border line below the certificate text
    const horizontalHeight = 0.02; // Thin border size
    pdfDoc.setLineWidth(horizontalHeight);
    pdfDoc.rect(50, 52, 150, horizontalHeight);

    pdfDoc.setFontSize(11);
    pdfDoc.setFont("bold");
    pdfDoc.text("WIFE", 153, 51);
    pdfDoc.setFont("normal");

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");

    // First
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text(`(First)`, 51, 57);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_fname ? h_fname.toUpperCase() : ""}`, 65, 57);
    // Draw a line after the word
    pdfDoc.line(58, 58, 121, 58);

    // First
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text(`(First)`, 124, 57);
    pdfDoc.setFontSize(10);
    pdfDoc.setTextColor("#000000");
    pdfDoc.text(`${w_fname ? w_fname.toUpperCase() : ""}`, 139, 57);
    // Draw a line after the word
    pdfDoc.line(131, 58, 193, 58);

    // Middle
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Middle)", 51, 62);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_mname ? w_mname.toUpperCase() : ""}`, 65, 62);
    // Draw a line after the word
    pdfDoc.line(62, 63, 121, 63);

    // Middle
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Middle)", 124, 62);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${w_mname ? w_mname.toUpperCase() : ""}`, 139, 62);
    // Draw a line after the word
    pdfDoc.line(135, 63, 193, 63);

    // Last
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Last)", 51, 67);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_lname ? h_lname.toUpperCase() : ""}`, 65, 67);
    // Draw a line after the word
    pdfDoc.line(58, 68, 121, 68);

    // Last
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Last)", 124, 67);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${w_lname ? w_lname.toUpperCase() : ""}`, 139, 67);
    // Draw a line after the word
    pdfDoc.line(131, 68, 193, 68);

    // Reset text color to black (optional, if you want to set it back to default)
    pdfDoc.setTextColor("#000000");

    const lineWidthss = pdfDoc.internal.pageSize.width - 2 * margin;
    const lineHeightss = 0.1; // Thin border size
    drawThinBorderLine(pdfDoc, 70, lineWidthss, lineHeightss, margin);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("2a. Date of Birth", 17, 74);
    pdfDoc.text("2b. Age", 17, 78);
    drawThinBorderLine(pdfDoc, 80, lineWidthss, lineHeightss, margin);

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Day)", 55, 73);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Month)", 73, 73);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Year)", 91, 73);

    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);

    // Assuming selectedItem contains the date information fetched from Firebase
    const dateOfBirth =
      selectedItem.h_dateBirth && selectedItem.h_dateBirth.toDate
        ? selectedItem.h_dateBirth.toDate()
        : new Date(); // Default to current date if no valid date is available

    // Get numerical day, month in words, and year from the date
    const day = dateOfBirth.getDate();
    const monthInWords = new Intl.DateTimeFormat("en", {
      month: "long",
    }).format(dateOfBirth);
    const year = dateOfBirth.getFullYear();

    // Construct the formatted date
    const formattedDateOfBirth = `${day} ${monthInWords} ${year}`;

    pdfDoc.text(formattedDateOfBirth, 70, 78);

    // Draw a vertical line before "Name of Contracting Parties" text
    const verticalLines = 108;
    const verticalHeights = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLines, 70, verticalLines, 70 + verticalHeights);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Age)", 112, 73);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_age.toString()}`, 113, 78);

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Day)", 128, 73);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Month)", 146, 73);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Year)", 164, 73);

    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);

    // Assuming selectedItem contains the date information fetched from Firebase
    const wdateOfBirth =
      selectedItem.w_dateBirth && selectedItem.w_dateBirth.toDate
        ? selectedItem.w_dateBirth.toDate()
        : new Date(); // Default to current date if no valid date is available

    // Get numerical day, month in words, and year from the date
    const wday = wdateOfBirth.getDate();
    const wmonthInWords = new Intl.DateTimeFormat("en", {
      month: "long",
    }).format(wdateOfBirth);
    const wyear = wdateOfBirth.getFullYear();

    // Construct the formatted date
    const wformattedDateOfBirth = `${wday} ${wmonthInWords} ${wyear}`;

    pdfDoc.text(wformattedDateOfBirth, 140, 78);

    // Draw a vertical line
    const verticalLiness = 181;
    const verticalHeightss = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLiness, 70, verticalLiness, 70 + verticalHeightss);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Age)", 184, 73);
    pdfDoc.setFontSize(10);
    pdfDoc.setTextColor("#000000");
    pdfDoc.text(`${w_age.toString()}`, 186, 78);

    //3rd Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("3. Place of Birth", 17, 86);
    drawThinBorderLine(pdfDoc, 90, lineWidthss, lineHeightss, margin);

    //Husband
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(City/Municipality)", 53, 83);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Province)", 85, 83);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Country)", 108, 83);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(9);
    pdfDoc.text(`${h_placeBirth ? h_placeBirth.toUpperCase() : ""}`, 51, 88);
    pdfDoc.text(`${w_placeBirth ? w_placeBirth.toUpperCase() : ""}`, 126, 88);

    //Wife
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(City/Municipality)", 126, 83);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Province)", 158, 83);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Country)", 182, 83);

    // Set text color to black
    pdfDoc.setTextColor("#00000");

    //4th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("4a. Sex", 17, 94);
    pdfDoc.text("4b. Citizenship", 17, 98);
    drawThinBorderLine(pdfDoc, 100, lineWidthss, lineHeightss, margin);

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");

    //Husband
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Sex)", 53, 93);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_sex ? h_sex.toUpperCase() : ""}`, 55, 98);

    // Draw a vertical line
    const verticalLinesss = 75;
    const verticalHeightsss = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(verticalLinesss, 90, verticalLinesss, 90 + verticalHeightsss);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Citizenship)", 77, 93);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_citizenship ? h_citizenship.toUpperCase() : ""}`, 79, 98);

    //Wife
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Sex)", 126, 93);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${w_sex ? w_sex.toUpperCase() : ""}`, 129, 98);

    // Draw a vertical line
    const vertical = 150;
    const verticalH = 10; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(vertical, 90, vertical, 90 + verticalH);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Citizenship)", 152, 93);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${w_citizenship ? w_citizenship.toUpperCase() : ""}`, 154, 98);

    //5th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("5. Residence", 17, 106);
    drawThinBorderLine(pdfDoc, 100, lineWidthss, lineHeightss, margin);

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");
    //Husband
    pdfDoc.setFontSize(7);
    pdfDoc.setFont("normal");
    pdfDoc.text(
      "(House No., St., Barangay, City/Municipality, Province, Country)",
      53,
      103
    );
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(7);
    pdfDoc.text(`${h_residence ? h_residence.toUpperCase() : ""}`, 51, 108);

    //Wife
    pdfDoc.setFontSize(7);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text(
      "(House No., St., Barangay, City/Municipality, Province, Country)",
      126,
      103
    );
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(7);
    pdfDoc.text(`${w_residence ? w_residence.toUpperCase() : ""}`, 126, 108);

    //6th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("6. Religion/", 17, 114);
    pdfDoc.text("    Religious Sect", 22, 118);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_religion ? h_religion.toUpperCase() : ""}`, 65, 117);
    pdfDoc.text(`${w_religion ? w_religion.toUpperCase() : ""}`, 145, 117);
    drawThinBorderLine(pdfDoc, 110, lineWidthss, lineHeightss, margin);

    //7th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("7. Civil Status", 17, 126);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_civilstat ? h_civilstat.toUpperCase() : ""}`, 68, 126);
    pdfDoc.text(`${w_civilstat ? w_civilstat.toUpperCase() : ""}`, 153, 126);

    drawThinBorderLine(pdfDoc, 120, lineWidthss, lineHeightss, margin);

    //8th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("8. Name of Father", 17, 136);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_fatherName ? h_fatherName.toUpperCase() : ""}`, 60, 138);
    pdfDoc.text(`${w_fatherName ? w_fatherName.toUpperCase() : ""}`, 130, 138);
    drawThinBorderLine(pdfDoc, 130, lineWidthss, lineHeightss, margin);

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");

    //Husband
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(First)", 58, 133);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Middle)", 80, 133);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Last)", 105, 133);

    //Wife
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(First)", 131, 133);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Middle)", 152, 133);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Last)", 176, 133);

    // Set text color to black
    pdfDoc.setTextColor("#00000");

    //9th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("9. Citizenship", 17, 146);
    pdfDoc.setFontSize(10);
    pdfDoc.text(
      `${hf_citizenship ? hf_citizenship.toUpperCase() : ""}`,
      65,
      146
    );
    pdfDoc.text(
      `${wf_citizenship ? wf_citizenship.toUpperCase() : ""}`,
      135,
      146
    );
    drawThinBorderLine(pdfDoc, 140, lineWidthss, lineHeightss, margin);

    //10th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("10. Maiden Name", 17, 154);
    pdfDoc.text("      of Mother", 17, 158);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_motherName ? h_motherName.toUpperCase() : ""}`, 60, 157);
    pdfDoc.text(`${w_motherName ? w_motherName.toUpperCase() : ""}`, 133, 157);
    drawThinBorderLine(pdfDoc, 150, lineWidthss, lineHeightss, margin);

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");

    //Husband
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(First)", 58, 153);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Middle)", 80, 153);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Last)", 105, 153);

    //Wife
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(First)", 131, 153);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Middle)", 152, 153);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Last)", 176, 153);

    // Set text color to black
    pdfDoc.setTextColor("#00000");

    //11th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("11. Citizenships", 17, 166);
    pdfDoc.setFontSize(10);
    pdfDoc.text(
      `${hm_citizenship ? hm_citizenship.toUpperCase() : ""}`,
      68,
      166
    );
    pdfDoc.text(
      `${wm_citizenship ? wm_citizenship.toUpperCase() : ""}`,
      150,
      166
    );
    drawThinBorderLine(pdfDoc, 160, lineWidthss, lineHeightss, margin);

    //12th Part
    pdfDoc.setFontSize(7);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("12. Name of Person/", 17, 173);
    pdfDoc.text("      Wali Who Gave", 17, 176);
    pdfDoc.text("      Consent or Advice", 17, 179);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_personName ? h_personName.toUpperCase() : ""}`, 60, 177);
    pdfDoc.text(`${w_personName ? w_personName.toUpperCase() : ""}`, 132, 177);
    drawThinBorderLine(pdfDoc, 170, lineWidthss, lineHeightss, margin);

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");

    //Husband
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(First)", 58, 173);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Middle)", 80, 173);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Last)", 105, 173);

    //Wife
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(First)", 131, 173);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Middle)", 152, 173);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.text("(Last)", 176, 173);

    // Set text color to black
    pdfDoc.setTextColor("#00000");

    //13th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.text("13. Relationship", 17, 186);
    pdfDoc.setFontSize(10);
    pdfDoc.text(
      `${h_relationship ? h_relationship.toUpperCase() : ""}`,
      68,
      187
    );
    pdfDoc.text(
      `${w_relationship ? w_relationship.toUpperCase() : ""}`,
      145,
      187
    );
    drawThinBorderLine(pdfDoc, 180, lineWidthss, lineHeightss, margin);

    //14th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("14. Residence", 17, 196);
    drawThinBorderLine(pdfDoc, 190, lineWidthss, lineHeightss, margin);

    // Set text color to red
    pdfDoc.setTextColor("#FF0000");
    //Husband
    pdfDoc.setFontSize(7);
    pdfDoc.setFont("normal");
    pdfDoc.text(
      "(House No., St., Barangay, City/Municipality, Province, Country)",
      53,
      193
    );
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(8);
    pdfDoc.text(`${hp_residence ? hp_residence.toUpperCase() : ""}`, 52, 198);

    //Wife
    pdfDoc.setFontSize(7);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text(
      "(House No., St., Barangay, City/Municipality, Province, Country)",
      126,
      193
    );
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(8);
    pdfDoc.text(`${wp_residence ? wp_residence.toUpperCase() : ""}`, 125, 198);

    const lineWidthsss = pdfDoc.internal.pageSize.width - 2 * margin;
    const lineHeightsss = 0.3; // Thin border size
    drawThinBorderLine(pdfDoc, 200, lineWidthsss, lineHeightsss, margin);

    //15th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("15. Place of Marriage: ", 17, 205);
    pdfDoc.text(
      `${w_placeMarriage ? w_placeMarriage.toUpperCase() : ""}`,
      50,
      204
    );
    drawDottedLine(pdfDoc, 47, 205, 198, 205, 0.1);

    pdfDoc.setFontSize(7);
    pdfDoc.setTextColor("#000000");
    pdfDoc.text(
      "(Office of the/ House of/Barangay of/Church of/Mosques of)",
      55,
      208
    );
    pdfDoc.text("(City/Municipality)", 135, 208);
    pdfDoc.text("(Province)", 180, 208);

    //16th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("16. Date of Marriage: ", 17, 215);

    // Assuming selectedItem contains the date information fetched from Firebase
    const datemarriage =
      selectedItem.w_dateMarriage && selectedItem.w_dateMarriage.toDate
        ? selectedItem.w_dateMarriage.toDate()
        : new Date(); // Default to current date if no valid date is available

    // Get numerical day, month in words, and year from the date
    const dm_day = datemarriage.getDate();
    const dm_monthInWords = new Intl.DateTimeFormat("en", {
      month: "long",
    }).format(datemarriage);
    const dm_year = datemarriage.getFullYear();

    // Construct the formatted date
    const formattedDateMarriage = `${dm_day} ${dm_monthInWords} ${dm_year}`;

    pdfDoc.text(formattedDateMarriage, 60, 214);

    drawDottedLine(pdfDoc, 45, 215, 112, 215, 0.1);
    pdfDoc.setFontSize(7);
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Day)", 52, 218);
    pdfDoc.text("(Month)", 76, 218);
    pdfDoc.text("(Year)", 98, 218);

    pdfDoc.setFontSize(9);
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("17. Time of Marriage: ", 124, 215);
    const tmarriage =
      selectedItem.timeMarriage && selectedItem.timeMarriage.toDate
        ? selectedItem.timeMarriage.toDate()
        : new Date(); // Default to current date if no valid date is available

    // Get the time from the date
    const timeMarriage = tmarriage.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    pdfDoc.text(timeMarriage, 168, 214);

    drawDottedLine(pdfDoc, 153, 215, 188, 215, 0.1);
    pdfDoc.text("am/pm", 189, 215);

    pdfDoc.setFontSize(9);
    pdfDoc.text("18. CERTIFICATION OF THE CONTRACTING PARTIES: ", 17, 223);
    pdfDoc.setFontSize(8);
    pdfDoc.text("THIS IS TO CERTIFY: That I, ", 27, 228);
    drawDottedLine(pdfDoc, 67, 228, 125, 228, 0.1);
    pdfDoc.text("and I, ", 126, 228);
    drawDottedLine(pdfDoc, 134, 228, 188, 228, 0.1);
    pdfDoc.text("both of", 189, 228);
    pdfDoc.text(
      "legal age, of our own free will and accord, and in the presence of the person solemnizing this marriage and of the witnesses named below, take each other as",
      17,
      233
    );
    pdfDoc.text("husband and wife and certifying further that we: ", 17, 238);

    // After the text "have not entered into a marriage settlement."
    const boxSize = 4; // You can adjust the size of the box as needed
    // Draw a small box
    pdfDoc.setDrawColor("#FF0000"); // Set the border color
    pdfDoc.setLineWidth(0.1); // Set the border width
    pdfDoc.rect(73, 235, boxSize, boxSize, "D");
    pdfDoc.text("have entered, a copy of which is hereto attached/  ", 78, 238);

    // Draw a small box
    pdfDoc.setDrawColor("#FF0000"); // Set the border color
    pdfDoc.setLineWidth(0.1); // Set the border width
    pdfDoc.rect(135, 235, boxSize, boxSize, "D");
    pdfDoc.text("have not entered into a marriage settlement.", 141, 238);

    pdfDoc.text(
      "IN WITNESS WHEREOF, we have signed/marked with our fingerprint this certificate in quadruplicate this ",
      27,
      243
    );
    drawDottedLine(pdfDoc, 150, 243, 162, 243, 0.1);
    pdfDoc.text("day of ", 163, 243);
    drawDottedLine(pdfDoc, 172, 243, 186, 243, 0.1);
    pdfDoc.text(",  ", 187, 243);
    drawDottedLine(pdfDoc, 188, 243, 198, 243, 0.1);

    drawDottedLine(pdfDoc, 17, 249, 98, 249, 0.1);
    pdfDoc.text("(Signature of Husband)", 45, 252);

    drawDottedLine(pdfDoc, 118, 249, 198, 249, 0.1);
    pdfDoc.text("(Signature of Wife)", 146, 252);

    //19th Part
    pdfDoc.setFontSize(9);
    pdfDoc.text("19. CERTIFICATION OF THE SOLEMNIZING OFFICER: ", 17, 257);
    pdfDoc.setFontSize(8);
    pdfDoc.text(
      "THIS IS TO CERTIFY: THAT BEFORE ME, on the date and place above-written, personally appeared the above-mentioned parties, with their mutual ",
      27,
      261
    );
    pdfDoc.text(
      "consent, lawfully joined together in marriage which was solemnized by me in the presence of the witnesses named below, all of legal age.",
      17,
      265
    );
    pdfDoc.text("I CERTIFY FURTHER THAT:", 27, 270);

    // Draw a small box
    pdfDoc.setDrawColor("#FF0000"); // Set the border color
    pdfDoc.setLineWidth(0.1); // Set the border width
    pdfDoc.rect(17, 273, boxSize, boxSize, "D");
    pdfDoc.text("a. Marriage License No. ", 22, 275);
    drawDottedLine(pdfDoc, 50, 275, 113, 275, 0.1);
    pdfDoc.text("issued on ", 114, 275);
    drawDottedLine(pdfDoc, 125, 275, 160, 275, 0.1);
    pdfDoc.text(", at", 160, 275);
    drawDottedLine(pdfDoc, 164, 275, 198, 275, 0.1);
    pdfDoc.text("in favor of said parties, was exhibited to me", 22, 278);

    // Draw a small box
    pdfDoc.setDrawColor("#FF0000"); // Set the border color
    pdfDoc.setLineWidth(0.1); // Set the border width
    pdfDoc.rect(17, 280, boxSize, boxSize, "D");
    pdfDoc.text(
      "b. No Marriage License was necessary, the  marriage being solemnized under Art. ",
      22,
      283
    );
    drawDottedLine(pdfDoc, 115, 283, 123, 283, 0.1);
    pdfDoc.text("of Executive Order No. 209.", 124, 283);

    // Draw a small box
    pdfDoc.setDrawColor("#FF0000"); // Set the border color
    pdfDoc.setLineWidth(0.1); // Set the border width
    pdfDoc.rect(17, 287, boxSize, boxSize, "D");
    pdfDoc.text(
      "c. The marriage was solemnized in accordance with the prrovisions of Presidential Decree No. 1083.",
      22,
      290
    );

    pdfDoc.setFontSize(7);
    drawDottedLine(pdfDoc, 17, 297, 88, 297, 0.1);
    pdfDoc.text(
      "(Signature Over Printed Name of Solemnizing Officer)",
      30,
      300
    );

    pdfDoc.setFontSize(7);
    drawDottedLine(pdfDoc, 94, 297, 128, 297, 0.1);
    pdfDoc.text("(Position/Designation)", 100, 300);

    pdfDoc.setFontSize(7);
    drawDottedLine(pdfDoc, 133, 297, 198, 297, 0.1);
    pdfDoc.text(
      "(Religion/Religious Sect, Registry No. and Expiration",
      140,
      300
    );
    pdfDoc.text("Date, if Applicable)", 156, 303);

    //20th Part
    pdfDoc.setFontSize(9);
    pdfDoc.text("20. WITNESS (Print Name and Sign): ", 17, 305);
    pdfDoc.text("Additional at the back", 20, 308);

    drawDottedLine(pdfDoc, 17, 313, 53, 313, 0.1);
    drawDottedLine(pdfDoc, 56, 313, 92, 313, 0.1);
    drawDottedLine(pdfDoc, 96, 313, 132, 313, 0.1);
    drawDottedLine(pdfDoc, 135, 313, 198, 313, 0.1);
    drawThinBorderLine(pdfDoc, 314, lineWidthss, lineHeightss, margin);

    pdfDoc.setFontSize(9);
    pdfDoc.text("21. RECEIVED BY ", 17, 317);
    pdfDoc.text("Signature", 17, 323);
    pdfDoc.line(30, 323, 105, 323);
    pdfDoc.text("Name in Print", 17, 328);
    pdfDoc.line(35, 328, 105, 328);
    pdfDoc.text("Title or Position", 17, 333);
    pdfDoc.line(40, 333, 105, 333);
    pdfDoc.text("Date", 17, 338);
    pdfDoc.line(24, 338, 105, 338);

    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(107, 314, 107, 339);

    pdfDoc.text(
      "22. REGISTERED AT THE OFFICE OF THE CIVIL REGISTRAR ",
      108,
      317
    );
    pdfDoc.text("Signature", 108, 323);
    pdfDoc.line(122, 323, 197, 323);
    pdfDoc.text("Name in Print", 108, 328);
    pdfDoc.line(127, 328, 197, 328);
    pdfDoc.text("Title or Position", 108, 333);
    pdfDoc.line(130, 333, 197, 333);
    pdfDoc.text("Date", 108, 338);
    pdfDoc.line(116, 338, 197, 338);
    drawThinBorderLine(pdfDoc, 339, lineWidthsss, lineHeightsss, margin);

    pdfDoc.setFont("bold");
    pdfDoc.text(
      "REMARKS/ANNOTATIONS (For LCRO/OCRG/Shari'a Curcuit Registrar Use Only)",
      17,
      342.5
    );
    drawThinBorderLine(pdfDoc, 352, lineWidthss, lineHeightss, margin);

    pdfDoc.setFont("bold");
    pdfDoc.setFontSize(8);
    pdfDoc.text(
      "TO BE FILLED-UP AT THE OFFICE OF THE CIVIL REGISTRAR",
      17,
      354.5
    );

    pdfDoc.setFont("bold");
    pdfDoc.setFontSize(8);
    pdfDoc.text("4bH", 28, 358);
    drawDottedBox(pdfDoc, 28, 359, 5);
    drawDottedBox(pdfDoc, 33, 359, 5);

    pdfDoc.text("4bW", 41, 358);
    drawDottedBox(pdfDoc, 41, 359, 5);
    drawDottedBox(pdfDoc, 46, 359, 5);

    pdfDoc.text("5H", 54, 358);
    drawDottedBox(pdfDoc, 54, 359, 5);
    drawDottedBox(pdfDoc, 59, 359, 5);
    drawDottedBox(pdfDoc, 64, 359, 5);
    drawDottedBox(pdfDoc, 69, 359, 5);
    drawDottedBox(pdfDoc, 74, 359, 5);
    drawDottedBox(pdfDoc, 79, 359, 5);
    drawDottedBox(pdfDoc, 84, 359, 5);
    drawDottedBox(pdfDoc, 89, 359, 5);

    pdfDoc.text("5W", 97, 358);
    drawDottedBox(pdfDoc, 97, 359, 5);
    drawDottedBox(pdfDoc, 102, 359, 5);
    drawDottedBox(pdfDoc, 107, 359, 5);
    drawDottedBox(pdfDoc, 112, 359, 5);
    drawDottedBox(pdfDoc, 117, 359, 5);
    drawDottedBox(pdfDoc, 122, 359, 5);
    drawDottedBox(pdfDoc, 127, 359, 5);
    drawDottedBox(pdfDoc, 132, 359, 5);

    pdfDoc.text("6H", 140, 358);
    drawDottedBox(pdfDoc, 140, 359, 5);
    drawDottedBox(pdfDoc, 145, 359, 5);

    pdfDoc.text("6W", 153, 358);
    drawDottedBox(pdfDoc, 153, 359, 5);
    drawDottedBox(pdfDoc, 158, 359, 5);

    pdfDoc.text("7H", 166, 358);
    drawDottedBox(pdfDoc, 166, 359, 5);

    pdfDoc.text("7W", 174, 358);
    drawDottedBox(pdfDoc, 174, 359, 5);

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
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("20b. WITNESSES (Print Name and Sign):", 17, 19);
    drawDottedLine(pdfDoc, 17, 30, 65, 30, 0.1);
    drawDottedLine(pdfDoc, 68, 30, 115, 30, 0.1);
    drawDottedLine(pdfDoc, 118, 30, 198, 30, 0.1);

    drawDottedLine(pdfDoc, 17, 40, 65, 40, 0.1);
    drawDottedLine(pdfDoc, 68, 40, 115, 40, 0.1);
    drawDottedLine(pdfDoc, 118, 40, 198, 40, 0.1);

    drawThinBorderLine(pdfDoc, 43, lineWidthss, lineHeightss, margin);

    pdfDoc.setFont("Bold");
    pdfDoc.setFontSize(10);
    pdfDoc.text("AFFIDAVIT OF SOLEMNIZING OFFICER", 75, 48);

    pdfDoc.setFontSize(8);
    pdfDoc.text("I,", 30, 57);
    pdfDoc.line(33, 58, 77, 58);
    pdfDoc.text(", of legal age, Solemnizing Officer of", 78, 57);
    pdfDoc.line(121, 58, 169, 58);
    pdfDoc.text("with address at", 171, 57);
    pdfDoc.line(17, 63, 73, 63);
    pdfDoc.text(
      ", after having sworn to in accordance with law, do hereby depose and say:",
      74,
      63
    );
    pdfDoc.text("1. That I have solemnized the marriage between", 17, 67);
    pdfDoc.line(72, 68, 118, 68);
    pdfDoc.text("and", 119, 68);
    pdfDoc.line(124, 68, 170, 68);
    pdfDoc.text("2.", 17, 71);
    drawDottedBox(pdfDoc, 21, 69, 4);
    pdfDoc.text(
      "a. That  I  have  ascertained  the  qualification  of  the  contracting  parties  and  have  found  no  leagl  impediment  for  them  to",
      27,
      71
    );
    pdfDoc.text("marry as required by Article 34 of the family Code;", 29, 74);
    drawDottedBox(pdfDoc, 21, 75, 4);
    pdfDoc.text(
      "b. That this marriage was performed in articulo mortis or at the point of death;",
      27,
      79
    );
    drawDottedBox(pdfDoc, 21, 84, 4);
    pdfDoc.text("c. That the contracting party/ies", 27, 83);
    pdfDoc.line(64, 84, 103, 84);
    pdfDoc.text("and", 104, 83);
    pdfDoc.line(109, 84, 148, 84);
    pdfDoc.text(", being at the point of", 149, 83);
    pdfDoc.text(
      "death and physically unable to sign the foregoing certificate of marriage by signature or mark, one of the witnesses to the marriage;",
      29,
      87
    );
    pdfDoc.text(
      "sign for him or her by writing the dying party's name and beneath it, the witness' own signature preceded by the preposition 'By';",
      29,
      90
    );
    drawDottedBox(pdfDoc, 21, 92, 4);
    pdfDoc.text(
      "d. That the residence of either party is so located that there is no means of transportation to enable concerned party/parties to appear",
      27,
      95
    );
    pdfDoc.text("personally before the civil registrar.", 30, 98);
    drawDottedBox(pdfDoc, 21, 99, 4);
    pdfDoc.text(
      "e. That the marriage was among Muslims or among members of the Ethnic Cultural Communities and that the marriage was solemnized",
      27,
      102
    );
    pdfDoc.text("in accordance with their customs and practices", 30, 105);
    pdfDoc.text(
      "3. That I took the necessary steps to ascertain the ages and relationship of the contracting parties and that neither of them are under any legal",
      17,
      109
    );
    pdfDoc.text("impediment to marry each other;", 20, 112);
    pdfDoc.text(
      "4. That I am executing this affidavit to attest to the truthfulness of the foregoing statements for all legal intents and purposes",
      17,
      116
    );

    pdfDoc.text(
      "  In   Truth   whereof,   I   have  affixed   my  signature  below  this",
      30,
      123
    );
    pdfDoc.line(107, 124, 120, 124);
    pdfDoc.text("day of", 121, 123);
    pdfDoc.line(128, 124, 167, 124);
    pdfDoc.line(169, 124, 182, 124);
    pdfDoc.text("at", 183, 123);
    pdfDoc.line(17, 129, 82, 129);
    pdfDoc.text(",  Philippines.", 82, 128);

    pdfDoc.line(130, 135, 198, 135);
    pdfDoc.text("(Signature Over Printed Name of Affidavit)", 133, 138);

    pdfDoc.setFont("bold");
    pdfDoc.text("SUBSCRIBED AND SWORN", 24, 143);

    pdfDoc.text("to before me this", 61, 143);
    pdfDoc.line(84, 143, 99, 143);
    pdfDoc.text("day of", 104, 143);
    pdfDoc.line(114, 143, 179, 143);
    pdfDoc.line(180, 143, 192, 143);
    pdfDoc.text("at", 195, 154);
    pdfDoc.line(17, 151, 77, 151);
    pdfDoc.text(",   Philippines,", 78, 150);
    pdfDoc.text(
      "affiant  who  exhibited  to  me  his/her  CTC/valid  ID",
      100,
      150
    );
    pdfDoc.line(163, 151, 198, 151);
    pdfDoc.text("issued on", 17, 157);
    pdfDoc.line(29, 158, 74, 158);
    pdfDoc.line(76, 158, 98, 158);
    pdfDoc.text("at", 99, 157);
    pdfDoc.line(103, 158, 168, 158);

    pdfDoc.setFontSize(9);
    pdfDoc.line(34, 167, 97, 167);
    pdfDoc.text("Signature of the Administering Officer", 40, 170);

    pdfDoc.setFontSize(9);
    pdfDoc.line(119, 167, 190, 167);
    pdfDoc.text("Position/ Title/ Designation", 144, 170);

    pdfDoc.setFontSize(9);
    pdfDoc.line(34, 177, 97, 177);
    pdfDoc.text("Name in Print", 55, 180);

    pdfDoc.setFontSize(9);
    pdfDoc.line(119, 177, 190, 177);
    pdfDoc.text("Address", 150, 180);

    drawThinBorderLine(pdfDoc, 185, lineWidthss, lineHeightss, margin);

    pdfDoc.setFont("Bold");
    pdfDoc.setFontSize(10);
    pdfDoc.text("AFFIDAVIT FOR DELAYED REGISTRATION OF MARRIAGE", 57, 190);

    pdfDoc.setFontSize(8);
    pdfDoc.text("I,", 25, 198);
    pdfDoc.line(28, 198, 110, 198);
    pdfDoc.text(
      ", of legal age, single/married/divorced/widow/widower, with residence and",
      111,
      198
    );
    pdfDoc.text("postal address", 17, 203);
    pdfDoc.line(34, 203, 196, 203);
    pdfDoc.line(17, 208, 66, 208);
    pdfDoc.text(
      ", after having duly sworn in accordance with law do hereby depose and say:",
      67,
      208
    );
    pdfDoc.text(
      "1.   That I am the applicant for the delayed registration of",
      17,
      213
    );
    drawDottedBox(pdfDoc, 21, 215, 3);
    pdfDoc.text("my marriage with", 27, 217);
    pdfDoc.line(48, 218, 86, 218);
    pdfDoc.text("in", 87, 217);
    pdfDoc.line(90, 218, 125, 218);
    pdfDoc.text("on", 126, 217);
    pdfDoc.line(130, 218, 170, 218);
    drawDottedBox(pdfDoc, 21, 220, 3);
    pdfDoc.text("the marriage between ", 27, 222);
    pdfDoc.line(51, 223, 96, 223);
    pdfDoc.text("and", 97, 222);
    pdfDoc.line(102, 223, 150, 223);
    pdfDoc.text("in", 151, 222);
    pdfDoc.line(21, 227, 53, 227);
    pdfDoc.text("on", 54, 227);
    pdfDoc.line(58, 227, 89, 227);
    pdfDoc.text("2.   That said marriage was solemnized by", 17, 233);
    pdfDoc.line(64, 233, 138, 233);
    pdfDoc.text("(Solemnizing Officer's name) under", 140, 233);
    pdfDoc.text("a.", 37, 239);
    drawDottedBox(pdfDoc, 40, 238, 3);
    pdfDoc.text("religious ceremony", 45, 239);
    pdfDoc.text("b.", 71, 239);
    drawDottedBox(pdfDoc, 74, 238, 3);
    pdfDoc.text("civil ceremony", 78, 239);
    pdfDoc.text("c.", 100, 239);
    drawDottedBox(pdfDoc, 103, 238, 3);
    pdfDoc.text("Muslim rites", 107, 239);
    pdfDoc.text("d.", 127, 239);
    drawDottedBox(pdfDoc, 130, 238, 3);
    pdfDoc.text("tribal rites", 134, 239);
    pdfDoc.text("3.   That the marriage was solemnized:", 17, 245);
    drawDottedBox(pdfDoc, 27, 248, 3);
    pdfDoc.text("a. with marriage license no.", 32, 250);
    pdfDoc.line(63, 251, 92, 251);
    pdfDoc.text("issued on", 93, 250);
    pdfDoc.line(104, 251, 134, 251);
    pdfDoc.text("at", 135, 250);
    pdfDoc.line(137, 251, 180, 251);
    drawDottedBox(pdfDoc, 27, 253, 3);
    pdfDoc.text("b. under Article ", 32, 255);
    pdfDoc.line(50, 256, 65, 256);
    pdfDoc.text("(marriage of exceptional character);", 66, 255);
    pdfDoc.text(
      "4.   (If the applicant is either the wife or husband) That I am a citizen of",
      17,
      260
    );
    pdfDoc.line(98, 261, 150, 261);
    pdfDoc.text("and my spouse is a citizen of", 151, 260);
    pdfDoc.line(22, 265, 70, 265);
    pdfDoc.text(
      "   (If the applicant is either the wife or husband) That the wife is a citizen of",
      19,
      270
    );
    pdfDoc.line(105, 271, 150, 271);
    pdfDoc.text("and my spouse is a citizen of", 151, 270);
    pdfDoc.text("is a citizen of", 19, 275);
    pdfDoc.line(34, 276, 89, 276);
    pdfDoc.text(
      "5.   That the reason for the delay in registering our/their marriage is",
      17,
      280
    );
    pdfDoc.line(94, 281, 145, 281);
    pdfDoc.text(
      "6.   That I am executing this affidavit to attest the truthfulness of the foregoing statements for all legal intents and purposes.",
      17,
      285
    );
    pdfDoc.text(
      "  In   Truth   whereof,   I   have  affixed   my  signature  below  this",
      30,
      292
    );
    pdfDoc.line(107, 293, 120, 293);
    pdfDoc.text("day of", 121, 292);
    pdfDoc.line(128, 293, 167, 293);
    pdfDoc.line(169, 293, 182, 293);
    pdfDoc.text("at", 183, 292);
    pdfDoc.line(17, 298, 82, 298);
    pdfDoc.text(",  Philippines.", 82, 298);

    pdfDoc.line(130, 307, 198, 307);
    pdfDoc.text("(Signature Over Printed Name of Affidavit)", 137, 310);

    pdfDoc.setFont("bold");
    pdfDoc.text("SUBSCRIBED AND SWORN", 24, 317);

    pdfDoc.text("to before me this", 69, 317);
    pdfDoc.line(94, 318, 102, 318);
    pdfDoc.text("day of", 104, 317);
    pdfDoc.line(114, 318, 179, 318);
    pdfDoc.line(180, 318, 192, 318);
    pdfDoc.text("at", 195, 317);
    pdfDoc.line(17, 323, 77, 323);
    pdfDoc.text(",   Philippines,", 78, 322);
    pdfDoc.text(
      "affiant  who  exhibited  to  me  his/her  CTC/valid  ID",
      96,
      322
    );
    pdfDoc.line(17, 328, 74, 328);
    pdfDoc.text("issued on", 75, 327);
    pdfDoc.line(90, 328, 125, 328);
    pdfDoc.line(126, 328, 137, 328);
    pdfDoc.text("at", 139, 327);
    pdfDoc.line(143, 328, 198, 328);

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
    pdfDoc.save("Certificate of Marriage.pdf");
  };

  const generateCustomizedForm = () => {
    if (selectedItem) {
      const {
        h_fname,
        h_mname,
        h_lname,
        h_age,
        h_citizenship,
        h_civilstat,
        h_dateBirth,
        h_fatherName,
        h_motherName,
        h_personName,
        h_placeBirth,
        h_relationship,
        h_religion,
        h_residence,
        h_sex,
        hf_citizenship,
        hm_citizenship,
        hp_residence,
        w_fname,
        w_mname,
        w_lname,
        w_age,
        w_citizenship,
        w_civilstat,
        w_dateBirth,
        w_dateMarriage,
        w_fatherName,
        w_motherName,
        w_personName,
        w_placeBirth,
        w_placeMarriage,
        w_relationship,
        w_religion,
        w_residence,
        w_sex,
        wf_citizenship,
        wm_citizenship,
        wp_residence,
        orderNumber,
      } = selectedItem;
      generateMarriageCertificateForm(
        h_fname,
        h_mname,
        h_lname,
        h_age,
        h_citizenship,
        h_civilstat,
        h_dateBirth,
        h_fatherName,
        h_motherName,
        h_personName,
        h_placeBirth,
        h_relationship,
        h_religion,
        h_residence,
        h_sex,
        hf_citizenship,
        hm_citizenship,
        hp_residence,
        w_fname,
        w_mname,
        w_lname,
        w_age,
        w_citizenship,
        w_civilstat,
        w_dateBirth,
        w_dateMarriage,
        w_fatherName,
        w_motherName,
        w_personName,
        w_placeBirth,
        w_placeMarriage,
        w_relationship,
        w_religion,
        w_residence,
        w_sex,
        wf_citizenship,
        wm_citizenship,
        wp_residence,
        orderNumber
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
          <h1>Registration of Marriage Certificate</h1>
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
              style={{ border: "1px solid black" }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid black" }}>
                  <th style={{ borderBottom: "1px solid black" }}>
                    Name of the Applicant
                  </th>
                  <th style={{ borderBottom: "1px solid black" }}>
                    Service Type
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
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  // Display filtered data
                  filteredData.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "8px", border: "1px solid black" }}>
                        {`${item.userName || "N/A"} ${
                          item.userLastName || ""
                        }`.trim() || "N/A"}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid black" }}>
                        {item.collectionType}
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
                          onClick={() => {
                            openDetailsModal(item);
                            // Additional logic to handle form rendering based on collectionType
                            if (item.collectionType === "marriageCert") {
                              // Render CopyMarriageCertificateForm
                              setSelectedForm(
                                <CopyMarriageCertificateForm
                                  selectedItem={item}
                                />
                              );
                            } else if (item.collectionType === "marriage_reg") {
                              // Render MarriageRegistrationForm
                              setSelectedForm(
                                <MarriageRegistrationForm selectedItem={item} />
                              );
                            }
                          }}
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

                  {selectedForm && selectedForm}

                  {selectedItem.collectionType === "marriageCert" && (
                    <CopyMarriageCertificateForm selectedItem={selectedItem} />
                  )}

                  {selectedItem.collectionType === "marriage_reg" && (
                    <MarriageRegistrationForm selectedItem={selectedItem} />
                  )}

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
