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
  onSnapshot
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage"; // Import Firebase Storage related functions
import "./birthReg.css";
import logo from "../assets/logo.png";
import notification from "../assets/icons/Notification.png";
import { FaSearch } from "react-icons/fa";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import useAuth from "../components/useAuth";
import Footer from "../components/footer";
import jsPDF from "jspdf";
import DeathRegistrationForm from "./DeathRegistrationForm";
import DeathCertificateForm from "./DeathCertificateForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faTimes, faUser, faHistory, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation, useHistory } from "react-router-dom";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);

function drawDottedBox(pdfDoc, x, y, size) {
  pdfDoc.setDrawColor("#4507C1"); // Set the border color
  pdfDoc.setLineWidth(0.1); // Set the border width
  pdfDoc.setLineDash([1, 1], 0); // Set the line dash pattern for a dotted line
  pdfDoc.rect(x, y, size, size, "D");
  pdfDoc.setLineDash(); // Reset the line dash pattern to default (solid line)
}

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableVisible, setTableVisible] = useState(true);
  const [textInput, setTextInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const history = useHistory();
  const [approvedButtonDisabled, setApprovedButtonDisabled] = useState(false);
  const [rejectedButtonDisabled, setRejectedButtonDisabled] = useState(false);
  const [onProcessButtonDisabled, setOnProcessButtonDisabled] = useState(false);
  const [completedButtonDisabled, setCompletedButtonDisabled] = useState(false);


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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("");
  const [selectedDayFilter, setSelectedDayFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [initialLoad, setInitialLoad] = useState(true); //automatic pending
  const unsubscribeFunctions = [];
  const [selectedItemForForm, setSelectedItemForForm] = useState(null);
  const [showMarriageCertificateForm, setShowMarriageCertificateForm] =
    useState(false);
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  const collectionTypeMap = {
    deathCert: "Request Copy of Death Certificate",
    death_reg: "Death Registration",
  };

  const fetchData = async () => {
    try {
      const collections = ["deathCert", "death_reg"];
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
    if (item.collectionType === "Death Registration") {
      // Render
      setSelectedForm(<DeathRegistrationForm selectedItem={item} />);
    } else if (item.collectionType === "Death Certificate") {
      // Render
      setSelectedForm(<DeathCertificateForm selectedItem={item} />);
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
        selectedItem.collectionType === "Death Registration"
          ? "death_reg"
          : "deathCert";
  
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
            selectedItem.collectionType === "Death Registration"
              ? "Death Registration"
              : "Death Certificate",
          userName: selectedItemData.userName,
          address: selectedItemData.userBarangay,
          employee: user ? user.email : "Unknown", // Assuming you store user's email in user.email
        });
  
        // Update the local state to reflect the new status
        setSelectedItem((prevItem) => ({ ...prevItem, status: newStatus }));
  
        // Update button states based on the new status
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
        } else {
          // Reset button states to their original state
          setApprovedButtonDisabled(false);
          setRejectedButtonDisabled(false);
          setOnProcessButtonDisabled(false);
          setCompletedButtonDisabled(false);
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
        const collectionName =
          selectedItem.collectionType === "Request Copy of Death Certificate"
            ? "death_reg"
            : "deathCert";
        const appointmentRef = doc(firestore, collectionName, selectedItem.id);

        await updateDoc(appointmentRef, {
          remarks: textInput,
        });

        setSelectedItem((prevItem) => ({
          ...prevItem,
          remarks: textInput,
        }));

        console.log("Remarks updated for ID: ", selectedItem.id);
      } else {
        // If there is no selected item, add a new document with the remarks
        const collectionName = "deathCert"; // or "death_reg" depending on your requirement
        const remarksCollectionRef = collection(firestore, collectionName);
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

const generateDeathRegistrationForm = (
  name,
  sex,
  dateDeath,
  dateBirth,
  age,
  place,
  civilstat,
  religion,
  citizenship,
  residence,
  occupation,
  fatherName,
  motherName,
  causeOfDeath,
  maternalCondi,
  autopsy,
  attendant,
  corpseDis,
  addOfCemetery,
  mannerDeath,
  externalCause,
) => {
  const pdfWidth = 8.5 * 25.4;
  const pdfHeight = 15 * 25.4;


  const pdfDoc = new jsPDF({
    unit: "mm",
    format: [pdfWidth, pdfHeight], // Set the custom page size
  });

  // Include the Arial font
  pdfDoc.addFont("Arial", "normal");

  // Set the page border with specified width, color, and margin
  const formBorderWidth = 0.5;
  const borderColor = "#4507C1";
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
  pdfDoc.text("Municipal Form No. 103", 17, 19);
  pdfDoc.text("(To be accomplished in quadruplicate using black ink)", 146, 19);
  pdfDoc.text("(Revised August 2016)", 17, 22);

  pdfDoc.setFontSize(9);
  centerText(pdfDoc, "Republic of the Philippines", 21);
  centerText(pdfDoc, "OFFICE OF THE CIVIL REGISTRAR GENERAL", 25);

  pdfDoc.setFontSize(17);
  pdfDoc.setFont("bold");
  centerText(pdfDoc, "CERTIFICATE OF DEATH", 31);
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
  pdfDoc.line(45, startY + lineHeightText, line2X - 5, startY + lineHeightText);

  pdfDoc.text("City/Municipality", column1X, startY + lineHeightText);
  pdfDoc.text("DEL GALLEGO", 60, 44);

  // Draw thin border line below
  const lineWidths = pdfDoc.internal.pageSize.width - 2 * margin;
  const lineHeights = 0.3; // Thin border size
  pdfDoc.setLineWidth(lineHeights);
  pdfDoc.rect(margin, 37 + 10, lineWidths, lineHeights);

  // Assuming selectedItem contains the date information fetched from Firebase
  const createdAt = selectedItem.createdAt && selectedItem.createdAt.toDate
  ? selectedItem.createdAt.toDate()
  : new Date(); // Default to current date if no valid date is available

  // Get the full year from the created date
  const years = createdAt.getFullYear(); // Get the full year (4 digits)
  const month = createdAt.getMonth() + 1; // Month starts from 0, so add 1 to get the correct month
  const days = createdAt.getDate();

  // Construct the registry number using the year, month, and day
  const registryNumber = `${years.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${days.toString().padStart(2, '0')}`;

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

  pdfDoc.setLineWidth(thinnerLineWidth);
  pdfDoc.line(150, 47, 150, 64);

  //1st Part
  pdfDoc.setFont("normal");
  pdfDoc.setFontSize(9);
  pdfDoc.text("1. Name", 17, 52);
  pdfDoc.setFontSize(11);
  pdfDoc.text(`${name ? name.toUpperCase() : ""}`, 58, 59);

  pdfDoc.setFont("bold");
  pdfDoc.setFontSize(9);
  pdfDoc.text("2. SEX", 152, 52);
  pdfDoc.setFont("normal");
  pdfDoc.setFontSize(11);
  pdfDoc.text(`${sex ? sex.toUpperCase() : ""}`, 158, 59);

  // First
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.text(`(Male/Female)`, 162, 52);
  pdfDoc.setTextColor("#000000");
  pdfDoc.setFontSize(10);

  // First
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.text(`(First)`, 50, 52);
  pdfDoc.setTextColor("#000000");
  pdfDoc.setFontSize(10);

  // Middle
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.text("(Middle)", 85, 52);

  // Last
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.text("(Last)", 120, 52);

  const lineWidthss = pdfDoc.internal.pageSize.width - 2 * margin;
  const lineHeightss = 0.1; // Thin border size
  drawThinBorderLine(pdfDoc, 64, lineWidthss, lineHeightss, margin);

  pdfDoc.setFontSize(9);
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#000000");
  pdfDoc.text("3. DATE OF DEATH", 17, 68);
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(8);
  pdfDoc.text(`(Day, Month, Year)`, 46, 68);

  // Assuming selectedItem contains the date information fetched from Firebase
  const dateOfDeath = selectedItem.dateDeath && selectedItem.dateDeath.toDate
  ? selectedItem.dateDeath.toDate()
  : new Date(); // Default to current date if no valid date is available

  // Get numerical day, month in words, and year from the date
  const day = dateOfDeath.getDate();
  const monthInWords = new Intl.DateTimeFormat('en', { month: 'long' }).format(dateOfDeath);
  const year = dateOfDeath.getFullYear();

  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#000000");
  pdfDoc.setFontSize(11);
  const formatteddateOfDeath = `${day} ${monthInWords} ${year}`;

  pdfDoc.text(formatteddateOfDeath, 30, 75);

  pdfDoc.setLineWidth(thinnerLineWidth);
  pdfDoc.line(69, 64, 69, 79);

  pdfDoc.setFont("normal");
  pdfDoc.setFontSize(9);
  pdfDoc.setTextColor("#000000");
  pdfDoc.text("4. DATE OF BIRTH", 71, 68);
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.text("(Day)", 98, 68);

  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.text("(Month)", 106, 68);

  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.text("(Year)", 117, 68);

   // Assuming selectedItem contains the date information fetched from Firebase
   const dateOfBirth = selectedItem.dateBirth && selectedItem.dateBirth.toDate
   ? selectedItem.dateBirth.toDate()
   : new Date(); // Default to current date if no valid date is available
 
   // Get numerical day, month in words, and year from the date
   const dayss = dateOfBirth.getDate();
   const monthInWord = new Intl.DateTimeFormat('en', { month: 'long' }).format(dateOfBirth);
   const yearss = dateOfBirth.getFullYear();
 
   pdfDoc.setFont("normal");
   pdfDoc.setTextColor("#000000");
   pdfDoc.setFontSize(11);
   const formatteddateOfBirth = `${dayss} ${monthInWord} ${yearss}`;
 
   pdfDoc.text(formatteddateOfBirth, 80, 75);

  pdfDoc.line(126, 64, 126, 79);

  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#000000");
  pdfDoc.setFontSize(8);
  pdfDoc.text("5. AGE AT THE TIME OF DEATH", 127, 68);
  pdfDoc.setFontSize(10);
  pdfDoc.text(`${age ? age.toUpperCase() : ""}`, 138, 78);

  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(6);
  pdfDoc.setFont("normal");
  pdfDoc.text("(Fill-in below accdg to age category)", 169, 68);
  pdfDoc.line(126, 69, 200, 69);
  pdfDoc.setFontSize(6);
  pdfDoc.setFont("normal");
  pdfDoc.text("a. IF 1 YEAR OR ABOVE", 128, 71);
  pdfDoc.line(126, 72, 200, 72);
  pdfDoc.setFontSize(5);
  pdfDoc.text("[2] Completed years", 132, 74);
  pdfDoc.line(154, 69, 154, 79);
  pdfDoc.setFontSize(6);
  pdfDoc.text("b. IF UNDER 1 YEAR", 155, 71);
  pdfDoc.setFontSize(5);
  pdfDoc.text("[1] Months", 155, 74);
  pdfDoc.line(166, 72, 166, 79);
  pdfDoc.text("[0] Days", 168, 74);
  pdfDoc.line(176, 69, 176, 79);
  pdfDoc.setFontSize(6);
  pdfDoc.text("c. IF UNDER 24 HOURS", 177, 71);
  pdfDoc.setFontSize(5);
  pdfDoc.text("Hours", 179, 74);
  pdfDoc.line(186, 72, 186, 79);
  pdfDoc.text("Min/Sec", 190, 74);
  drawThinBorderLine(pdfDoc, 79, lineWidthss, lineHeightss, margin);

  //3rd Part
  pdfDoc.setFontSize(9);
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#000000");
  pdfDoc.text("6. PLACE OF DEATH", 17, 82);
  pdfDoc.setFontSize(10);
  pdfDoc.text(`${place ? place.toUpperCase() : ""}`, 40, 89);

  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(7);
  pdfDoc.text(
    `(Name of Hospital/Clinic/Institutional/House No., St., Barangay, City/Municipality, Province)`,
    47,
    82
  );
  drawThinBorderLine(pdfDoc, 91, lineWidthss, lineHeightss, margin);
  pdfDoc.line(154, 79, 154, 91);
  pdfDoc.setFontSize(9);
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#000000");
  pdfDoc.text("7. CIVIL STATUS", 156, 82);
  pdfDoc.setFontSize(10);
  pdfDoc.text(`${civilstat ? civilstat.toUpperCase() : ""}`, 170, 89);
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(7);
  pdfDoc.text(`(Single/Married/`, 182, 82);
  pdfDoc.text(`Widow/Widower/Annulled/Divorced)`, 160, 84);

  pdfDoc.setFontSize(9);
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#000000");
  pdfDoc.text("8. RELIGION/RELIGIOUS SECT", 17, 94);
  pdfDoc.setFontSize(10);
  pdfDoc.text(`${religion ? religion.toUpperCase() : ""}`, 30, 99);
  pdfDoc.line(69, 91, 69, 104);
  drawThinBorderLine(pdfDoc, 104, lineWidthss, lineHeightss, margin);
  pdfDoc.setFontSize(9);
  pdfDoc.text("9. CITIZENSHIP", 71, 94);
  pdfDoc.setFontSize(10);
  pdfDoc.text(`${citizenship ? citizenship.toUpperCase() : ""}`, 85, 99);
  pdfDoc.line(116, 91, 116, 104);

  pdfDoc.setFontSize(9);
  pdfDoc.text("10. RESIDENCE", 117, 94);
  pdfDoc.setFontSize(7);
  pdfDoc.text(`${residence ? residence.toUpperCase() : ""}`, 118, 99);
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(6);
  pdfDoc.text(
    `(House No., St., Barangay, City/Municipality, Province,Country)`,
    140,
    94
  );

  pdfDoc.setFontSize(9);
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#000000");
  pdfDoc.text("11. OCCUPATION", 17, 107);
  pdfDoc.setFontSize(10);
  pdfDoc.text(`${occupation ? occupation.toUpperCase() : ""}`, 30, 112);
  pdfDoc.line(60, 104, 60, 116);
  pdfDoc.setFontSize(9);
  pdfDoc.text("12. NAME OF FATHER", 61, 107);
  pdfDoc.setFontSize(10);
  pdfDoc.text(`${fatherName ? fatherName.toUpperCase() : ""}`, 65, 112);
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(7);
  pdfDoc.text(`(First, Middle, Last)`, 95, 107);
  pdfDoc.line(130, 104, 130, 116);
  pdfDoc.setFontSize(9);
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#000000");
  pdfDoc.text("13. NAME OF MOTHER", 131, 107);
  pdfDoc.setFontSize(10);
  pdfDoc.text(`${motherName ? motherName.toUpperCase() : ""}`, 135, 112);
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(7);
  pdfDoc.text(`(First, Middle, Last)`, 165, 107);
  drawThinBorderLine(pdfDoc, 116, lineWidthss, 0.3, margin);

  pdfDoc.setFontSize(11);
  pdfDoc.setFont("bold");
  pdfDoc.setTextColor("#000000");
  centerText(pdfDoc, "MEDICAL CERTIFICATE", 120);
  pdfDoc.setFont("normal");
  centerText(
    pdfDoc,
    "(For ages 0 to 7 days, accomplish items 14-19a at the back)",
    124
  );
  drawThinBorderLine(pdfDoc, 125, lineWidthss, lineHeightss, margin);

  pdfDoc.setFontSize(9);
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#000000");
  pdfDoc.text(
    "19b. CAUSE OF DEATH (If the deceased is aged 8 days and over)",
    17,
    130
  );
    pdfDoc.text(`${causeOfDeath ? causeOfDeath.toUpperCase() : ""}`, 57, 134);


  pdfDoc.text("Interval Between Onset and Death", 145, 130);
  pdfDoc.text("I.  Immediate cause      : a.", 20, 135);
  pdfDoc.line(55, 135, 135, 135);
  pdfDoc.line(140, 135, 198, 135);
  pdfDoc.text("Antecedent cause     : b.", 23, 140);
  pdfDoc.line(55, 140, 135, 140);
  pdfDoc.line(140, 140, 198, 140);
  pdfDoc.text("Underlying cause     : c.", 23, 145);
  pdfDoc.line(55, 145, 135, 145);
  pdfDoc.line(140, 145, 198, 145);
  pdfDoc.text(
    "II. Other significant conditions contributing to death:",
    20,
    150
  );
  pdfDoc.line(90, 150, 198, 150);
  drawThinBorderLine(pdfDoc, 151, lineWidthss, lineHeightss, margin);

  pdfDoc.text(
    "19c. MATERNAL CONDITION (If the deceased is female aged 15-49 years old)",
    17,
    155
  );
  pdfDoc.line(22, 162, 29, 162);
  pdfDoc.text("a. pregnant,", 32, 162);
  pdfDoc.text("not in labour", 35, 165);
  pdfDoc.line(54, 162, 61, 162);
  pdfDoc.text("b. pregnant, in", 64, 162);
  pdfDoc.text("labour", 67, 165);
  pdfDoc.line(85, 162, 93, 162);
  pdfDoc.text("c. less than 42 days,", 96, 162);
  pdfDoc.text("after delivery", 99, 165);
  pdfDoc.line(125, 162, 132, 162);
  pdfDoc.text("d. 42 days to 1 year", 135, 162);
  pdfDoc.text("after delivery", 138, 165);
  pdfDoc.line(165, 162, 172, 162);
  pdfDoc.text("e. None of the", 175, 162);
  pdfDoc.text("choices", 178, 165);
  drawThinBorderLine(pdfDoc, 166, lineWidthss, lineHeightss, margin);

  pdfDoc.text("19d. DEATH BY EXTERNAL CAUSES", 17, 170);
  pdfDoc.text("a. Manner of death", 20, 174);
  pdfDoc.text(`${mannerDeath ? mannerDeath.toUpperCase() : ""}`, 125, 172);
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(7);
  pdfDoc.text(
    `(Homicide, Suicide, Accident, Legal intervention, etc.)`,
    46,
    174
  );
  pdfDoc.setTextColor("#000000");
  pdfDoc.line(105, 174, 168, 174);
  pdfDoc.setFontSize(9);
  pdfDoc.text("b. Place of Occurance of External Cause", 20, 178);
  pdfDoc.text(`${externalCause ? externalCause.toUpperCase() : ""}`, 130, 177);
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(7);
  pdfDoc.text(`(e.g. home, farm, factory, street, sea, etc.)`, 73, 178);
  pdfDoc.line(115, 178, 168, 178);
  pdfDoc.setTextColor("#000000");
  pdfDoc.line(170, 166, 170, 180);
  pdfDoc.text("20. AUTOPSY", 171, 170);
  pdfDoc.setFontSize(10);
  pdfDoc.text(`${autopsy ? autopsy.toUpperCase() : ""}`, 175, 179);
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(7);
  pdfDoc.text(`(Yes/No)`, 173, 173);
  pdfDoc.setTextColor("#000000");
  drawThinBorderLine(pdfDoc, 180, lineWidthss, lineHeightss, margin);

  pdfDoc.setFontSize(9);
  pdfDoc.text("21a. ATTENDANT", 17, 183);
  pdfDoc.line(20, 193, 25, 193);
  pdfDoc.text("1 Private", 26, 190);
  pdfDoc.text("Physician", 27, 193);
  pdfDoc.line(45, 193, 51, 193);
  pdfDoc.text("2 Public", 52, 187);
  pdfDoc.text("Health", 53, 190);
  pdfDoc.text("Officer", 53, 193);
  pdfDoc.line(66, 193, 73, 193);
  pdfDoc.text("3 Hospital", 74, 190);
  pdfDoc.text("Authority", 75, 193);
  pdfDoc.line(94, 193, 99, 193);
  pdfDoc.text("4 None", 100, 193);
  pdfDoc.line(128, 193, 143, 193);
  pdfDoc.text("5 Others", 115, 190);
  pdfDoc.text("Specify", 116, 193);
  pdfDoc.line(145, 180, 145, 194);
  pdfDoc.text("21b. If attended, state duration", 146, 183);
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(7);
  pdfDoc.text(`(mm/dd/yy)`, 186, 183);
  pdfDoc.setFontSize(9);
  pdfDoc.setTextColor("#000000");
  pdfDoc.text(`(From)`, 146, 193);
  pdfDoc.line(154, 193, 171, 193);
  pdfDoc.text(`(To)`, 172, 193);
  pdfDoc.line(178, 193, 198, 193);
  drawThinBorderLine(pdfDoc, 194, lineWidthss, lineHeightss, margin);

  pdfDoc.setFontSize(9);
  pdfDoc.text("22. CERTIFICATION OF DEATH", 17, 198);
  pdfDoc.text(
    "I hereby certify that the foregoing particulars are correct as near as same can be ascertained and I further certify that I",
    25,
    202
  );
  // Draw a small box
  pdfDoc.setDrawColor("#4507C1"); // Set the border color
  pdfDoc.setLineWidth(0.1); // Set the border width
  pdfDoc.rect(175, 198, 5, 5, "D");
  pdfDoc.text("have attended/", 181, 202);
  pdfDoc.setDrawColor("#4507C1"); // Set the border color
  pdfDoc.setLineWidth(0.1); // Set the border width
  pdfDoc.rect(17, 202, 5, 5, "D");
  pdfDoc.text(
    "have not attended the deceased and that death occured at",
    23,
    206
  );
  pdfDoc.line(97, 206, 113, 206);
  pdfDoc.text("am/pm on the date of death specified above.", 115, 206);

  pdfDoc.text("Signature", 17, 214);
  pdfDoc.line(30, 214, 105, 214);
  pdfDoc.text("Name in Print", 17, 219);
  pdfDoc.line(35, 219, 105, 219);
  pdfDoc.text("Title or Position", 17, 224);
  pdfDoc.line(40, 224, 105, 224);
  pdfDoc.text("Address", 17, 229);
  pdfDoc.line(29, 229, 105, 229);
  pdfDoc.line(17, 234, 55, 234);
  pdfDoc.text("Date", 56, 234);
  pdfDoc.line(62, 234, 105, 234);

  pdfDoc.line(110, 212, 110, 234);
  pdfDoc.line(110, 212, 200, 212); // Draws a horizontal line from (110, 212) to (220, 212)

  pdfDoc.text("REVIEWED BY:", 112, 215);
  pdfDoc.line(115, 222, 189, 222);
  pdfDoc.text("Signature Over Printed Name of Health Officer", 121, 225);
  pdfDoc.line(123, 230, 186, 230);
  pdfDoc.text("Date", 152, 233);

  drawThinBorderLine(pdfDoc, 235, lineWidthss, lineHeightss, margin);

  pdfDoc.text("23. CORPSE DISPOSAL", 17, 238);
  pdfDoc.setFontSize(10);
  pdfDoc.text(`${corpseDis ? corpseDis.toUpperCase() : ""}`, 30, 246);

  pdfDoc.line(65, 235, 65, 248);
  pdfDoc.setTextColor("#4507C1");
  pdfDoc.setFontSize(7);
  pdfDoc.text(`(Burial, Cremation, if others, specify)`, 25, 241);
  pdfDoc.setTextColor("#00000");
  pdfDoc.setFontSize(9);
  pdfDoc.text("24a. BURIAL/CREMATION PERMIT", 66, 238);
  pdfDoc.line(140, 235, 140, 248);
  pdfDoc.text("24b. BURIAL/CREMATION PERMIT", 141, 238);
  drawThinBorderLine(pdfDoc, 248, lineWidthss, lineHeightss, margin);

  pdfDoc.text("25. NAME AND ADDRESS OF CEMETERY OR CREMATORY", 17, 251);
  pdfDoc.setFontSize(10);
  pdfDoc.text(`${addOfCemetery ? addOfCemetery.toUpperCase() : ""}`, 30, 258);
  drawThinBorderLine(pdfDoc, 260, lineWidthss, lineHeightss, margin);

  pdfDoc.setFontSize(9);
  pdfDoc.text("26. CERTIFICATION OF INFORMANT", 17, 263);
  pdfDoc.text(
    `(I hereby certify that all information supplied are true and correct)`,
    28,
    266
  );
  pdfDoc.text(`(to my own knowledge and belief.)`, 28, 269);
  pdfDoc.text("Signature", 17, 275);
  pdfDoc.line(30, 275, 105, 275);
  pdfDoc.text("Name in Print", 17, 281);
  pdfDoc.line(35, 281, 105, 281);
  pdfDoc.text("Title or Position", 17, 287);
  pdfDoc.line(40, 287, 105, 287);
  pdfDoc.text("Address", 17, 293);
  pdfDoc.line(29, 293, 105, 293);
  pdfDoc.text("Date", 17, 299);
  pdfDoc.line(62, 299, 105, 299);

  pdfDoc.text("27. PREPARED BY", 108, 263);
  pdfDoc.text("Signature", 108, 275);
  pdfDoc.line(122, 275, 197, 275);
  pdfDoc.text("Name in Print", 108, 281);
  pdfDoc.line(127, 281, 197, 281);
  pdfDoc.text("Title or Position", 108, 287);
  pdfDoc.line(130, 287, 197, 287);
  pdfDoc.text("Date", 108, 293);
  pdfDoc.line(116, 293, 197, 293);
  drawThinBorderLine(pdfDoc, 300, lineWidthss, lineHeightss, margin);

  pdfDoc.setFontSize(9);
  pdfDoc.text("21. RECEIVED BY ", 17, 303);
  pdfDoc.text("Signature", 17, 309);
  pdfDoc.line(30, 309, 105, 309);
  pdfDoc.text("Name in Print", 17, 314);
  pdfDoc.line(35, 314, 105, 314);
  pdfDoc.text("Title or Position", 17, 319);
  pdfDoc.line(40, 319, 105, 319);
  pdfDoc.text("Date", 17, 324);
  pdfDoc.line(24, 324, 105, 324);

  pdfDoc.setLineWidth(thinnerLineWidth);
  pdfDoc.line(107, 260, 107, 300);

  pdfDoc.setLineWidth(thinnerLineWidth);
  pdfDoc.line(107, 300, 107, 325);

  pdfDoc.text("22. REGISTERED AT THE OFFICE OF THE CIVIL REGISTRAR ", 108, 303);
  pdfDoc.text("Signature", 108, 309);
  pdfDoc.line(122, 309, 197, 309);
  pdfDoc.text("Name in Print", 108, 314);
  pdfDoc.line(127, 314, 197, 314);
  pdfDoc.text("Title or Position", 108, 319);
  pdfDoc.line(130, 319, 197, 319);
  pdfDoc.text("Date", 108, 324);
  pdfDoc.line(116, 324, 197, 324);
  drawThinBorderLine(pdfDoc, 325, lineWidthss, lineHeightss, margin);

  pdfDoc.setFont("bold");
  pdfDoc.text("REMARKS/ANNOTATIONS (For LCRO/OCRG Use Only)", 17, 328);
  drawThinBorderLine(pdfDoc, 351, lineWidthss, lineHeightss, margin);

  pdfDoc.setFont("bold");
  pdfDoc.setFontSize(8);
  pdfDoc.text(
    "TO BE FILLED-UP AT THE OFFICE OF THE CIVIL REGISTRAR",
    17,
    354.5
  );

  pdfDoc.setFont("bold");
  pdfDoc.setFontSize(8);
  pdfDoc.text("5", 33, 358);
  drawDottedBox(pdfDoc, 33, 359, 5);
  drawDottedBox(pdfDoc, 38, 359, 5);
  drawDottedBox(pdfDoc, 43, 359, 5);

  pdfDoc.text("8", 51, 358);
  drawDottedBox(pdfDoc, 51, 359, 5);
  drawDottedBox(pdfDoc, 56, 359, 5);

  pdfDoc.text("9", 64, 358);
  drawDottedBox(pdfDoc, 64, 359, 5);
  drawDottedBox(pdfDoc, 69, 359, 5);

  pdfDoc.text("10", 77, 358);
  drawDottedBox(pdfDoc, 77, 359, 5);
  drawDottedBox(pdfDoc, 82, 359, 5);
  drawDottedBox(pdfDoc, 87, 359, 5);
  drawDottedBox(pdfDoc, 92, 359, 5);
  drawDottedBox(pdfDoc, 97, 359, 5);
  drawDottedBox(pdfDoc, 102, 359, 5);
  drawDottedBox(pdfDoc, 107, 359, 5);
  drawDottedBox(pdfDoc, 112, 359, 5);

  pdfDoc.text("11", 120, 358);
  drawDottedBox(pdfDoc, 120, 359, 5);
  drawDottedBox(pdfDoc, 125, 359, 5);
  drawDottedBox(pdfDoc, 130, 359, 5);

  pdfDoc.text("19A(a)/19b", 138, 358);
  drawDottedBox(pdfDoc, 138, 359, 5);
  drawDottedBox(pdfDoc, 143, 359, 5);
  drawDottedBox(pdfDoc, 148, 359, 5);
  drawDottedBox(pdfDoc, 153, 359, 5);

  pdfDoc.text("19a(c)", 161, 358);
  drawDottedBox(pdfDoc, 161, 359, 5);
  drawDottedBox(pdfDoc, 166, 359, 5);
  drawDottedBox(pdfDoc, 171, 359, 5);
  drawDottedBox(pdfDoc, 176, 359, 5);

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
  pdfDoc.setFontSize(10);
  pdfDoc.setFont("bold");
  pdfDoc.setFont("normal");
  pdfDoc.setTextColor("#000000");
  pdfDoc.text("FOR CHILDREN AGED 0 TO 7 DAYS", 78, 20);
  drawThinBorderLine(pdfDoc, 21, lineWidthss, lineHeightss, margin);

  pdfDoc.setFontSize(9);
  pdfDoc.text("14. AGE OF MOTHER", 17, 25);

  pdfDoc.setLineWidth(thinnerLineWidth);
  pdfDoc.line(54, 21, 54, 32);

  pdfDoc.text("15. METHOD OF DELIVERY (Normal spontaneous", 57, 25);
  pdfDoc.text("vertex, if others, specify)", 57, 27);

  pdfDoc.setLineWidth(thinnerLineWidth);
  pdfDoc.line(137, 21, 137, 32);

  pdfDoc.text("16. LENGTH OF PREGNANCY", 146, 25);
  drawThinBorderLine(pdfDoc, 32, lineWidthss, lineHeightss, margin);

  pdfDoc.setLineWidth(thinnerLineWidth);
  pdfDoc.line(105, 32, 105, 43);

  pdfDoc.text("17. TYPE OF BIRTH", 17, 35);
  pdfDoc.text("(Single, Twin, Triplet, etc)", 21, 38);
  pdfDoc.text("18. IF MULTIPLE BIRTH, CHILD WAS", 106, 35);
  pdfDoc.text("(First, Second, Third, etc)", 112, 37);
  drawThinBorderLine(pdfDoc, 43, lineWidthss, lineHeightss, margin);

  pdfDoc.setFontSize(10);
  pdfDoc.setFont("bold");
  pdfDoc.text("MEDICAL CERTIFICATE", 88, 47);
  drawThinBorderLine(pdfDoc, 49, lineWidthss, lineHeightss, margin);

  pdfDoc.text("19a. CAUSES OF DEATH", 17, 53);

  pdfDoc.setFontSize(9);
  pdfDoc.text("a. Main disease/condition of infant", 25, 58);
  pdfDoc.line(70, 59, 198, 59);
  pdfDoc.text("b. Other disease/conditions of infant", 25, 63);
  pdfDoc.line(70, 64, 198, 64);
  pdfDoc.text("c. Main maternal disease/condition affecting infant", 25, 68);
  pdfDoc.line(90, 69, 198, 69);
  pdfDoc.text("d. Other maternal disease/condition affecting infant", 25, 73);
  pdfDoc.line(90, 74, 198, 74);
  pdfDoc.text("e. Other relevant circumstances", 25, 78);
  pdfDoc.line(66, 79, 198, 79);
  pdfDoc.text("CONTINUE TO FILL UP ITEM 20", 88, 84);
  drawThinBorderLine(pdfDoc, 85, lineWidthss, lineHeightss, margin);
  drawThinBorderLine(pdfDoc, 87, lineWidthss, lineHeightss, margin);

  pdfDoc.setFontSize(10);
  pdfDoc.setFont("bold");
  pdfDoc.text("POSTMORTEM CERTIFICATE OF DEATH", 79, 91);

  pdfDoc.setFontSize(9);
  pdfDoc.text(
    "I  HEREBY  CERTIFY  that  I  have  performed  an  autopsy  upon  the  body  of  the deceased  and  that  the  cause  of  death was",
    30,
    96
  );
  pdfDoc.line(16, 100, 198, 100);
  pdfDoc.line(16, 105, 198, 105);

  pdfDoc.text("Signature", 17, 114);
  pdfDoc.line(28, 115, 100, 115);
  pdfDoc.text("Name in Print", 17, 119);
  pdfDoc.line(33, 120, 100, 120);

  pdfDoc.text("Title/Designation", 103, 114);
  pdfDoc.line(124, 115, 198, 115);
  pdfDoc.text("Address", 103, 119);
  pdfDoc.line(113, 120, 198, 120);

  pdfDoc.text("Date", 17, 124);
  pdfDoc.line(23, 125, 100, 125);
  pdfDoc.line(103, 125, 198, 125);

  drawThinBorderLine(pdfDoc, 127, lineWidthss, lineHeightss, margin);

  pdfDoc.setFontSize(10);
  pdfDoc.setFont("bold");
  pdfDoc.text("CERTIFICATION OF EMBALMER", 85, 132);

  pdfDoc.setFontSize(9);
  pdfDoc.text("I  HEREBY  CERTIFY  that  I  have embalmed", 30, 137);
  pdfDoc.line(86, 138, 183, 138);
  pdfDoc.text("following", 185, 137);
  pdfDoc.text(
    "all the regulations prescribed by the Department of Health.",
    17,
    141
  );

  pdfDoc.text("Signature", 17, 150);
  pdfDoc.line(28, 151, 100, 151);
  pdfDoc.text("Name in Print", 17, 155);
  pdfDoc.line(33, 156, 100, 156);
  pdfDoc.text("Address", 17, 160);
  pdfDoc.line(28, 161, 100, 161);

  pdfDoc.text("Title/Designation", 103, 150);
  pdfDoc.line(124, 151, 198, 151);
  pdfDoc.text("License No.", 103, 155);
  pdfDoc.line(116, 156, 198, 156);
  pdfDoc.text("Issued on", 103, 160);
  pdfDoc.line(115, 161, 198, 161);

  pdfDoc.line(17, 166, 100, 166);
  pdfDoc.text("Expiry Date", 103, 165);
  pdfDoc.line(118, 166, 198, 166);

  drawThinBorderLine(pdfDoc, 169, lineWidthss, lineHeightss, margin);
  drawThinBorderLine(pdfDoc, 171, lineWidthss, lineHeightss, margin);

  pdfDoc.setFont("Bold");
  pdfDoc.setFontSize(10);
  pdfDoc.text("AFFIDAVIT FOR DELAYED REGISTRATION OF DEATH", 61, 175);

  pdfDoc.setFontSize(9);
  pdfDoc.text("I,", 25, 187);
  pdfDoc.line(28, 188, 110, 188);
  pdfDoc.text(
    ", of legal age, single/married/divorced/widow/widower, ",
    111,
    187
  );
  pdfDoc.text("with residence and postal address", 17, 193);
  pdfDoc.line(55, 194, 196, 194);
  pdfDoc.line(17, 198, 66, 198);
  pdfDoc.text(
    ", after having duly sworn in accordance with law do hereby depose and say:",
    67,
    197
  );

  pdfDoc.text("1. That", 25, 206);
  pdfDoc.line(35, 207, 98, 207);
  pdfDoc.text("died on ", 100, 206);
  pdfDoc.line(110, 207, 175, 207);
  pdfDoc.text("in", 177, 206);
  pdfDoc.line(35, 212, 145, 212);
  pdfDoc.text("and was buried/cremated in", 146, 212);
  pdfDoc.line(35, 217, 132, 217);
  pdfDoc.text("on", 134, 217);
  pdfDoc.line(138, 217, 197, 217);
  pdfDoc.text("2. That the deceased at the time of his/her death:", 25, 224);
  pdfDoc.setDrawColor(0, 0, 255);
  drawDottedBox(pdfDoc, 35, 226, 4);
  pdfDoc.text(" was attended by ", 40, 228);
  pdfDoc.line(61, 229, 132, 229);
  drawDottedBox(pdfDoc, 35, 232, 4);

  pdfDoc.text(" was not attended. ", 40, 235);
  pdfDoc.text("3. That the cause of death of the deceased was", 25, 241);
  pdfDoc.line(85, 242, 198, 242);
  pdfDoc.text(
    "4. That the reason for the delay in registering this death was due to ",
    25,
    247
  );
  pdfDoc.line(110, 248, 198, 248);
  pdfDoc.line(30, 254, 198, 254);
  pdfDoc.text(
    "5. That I am executing this affidavit to attest to the truthfulness of the foregoing statements for all legal intents and purposes. ",
    25,
    260
  );

  pdfDoc.text(
    "  In   Truth   whereof,   I   have  affixed   my  signature  below  this",
    30,
    270
  );
  pdfDoc.line(114, 271, 123, 271);
  pdfDoc.text("day of", 125, 270);
  pdfDoc.line(138, 271, 167, 271);
  pdfDoc.line(169, 271, 182, 271);
  pdfDoc.text("at", 183, 270);
  pdfDoc.line(17, 278, 82, 278);
  pdfDoc.text(",  Philippines.", 82, 277);

  pdfDoc.line(130, 290, 198, 290);
  pdfDoc.text("(Signature Over Printed Name of Affidavit)", 137, 293);

  pdfDoc.setFont("bold");
  pdfDoc.text("SUBSCRIBED AND SWORN", 24, 314);

  pdfDoc.text("to before me this", 69, 314);
  pdfDoc.line(94, 314, 102, 314);
  pdfDoc.text("day of", 106, 314);
  pdfDoc.line(116, 314, 179, 314);
  pdfDoc.line(180, 314, 192, 314);
  pdfDoc.text("at", 195, 314);
  pdfDoc.line(17, 320, 77, 320);
  pdfDoc.text(",   Philippines,", 78, 319);
  pdfDoc.text(
    "affiant  who  exhibited  to  me  his/her  CTC/valid  ID",
    96,
    319
  );
  pdfDoc.line(17, 325, 74, 325);
  pdfDoc.text("issued on", 75, 324);
  pdfDoc.line(90, 324, 125, 324);
  pdfDoc.line(126, 324, 137, 324);
  pdfDoc.text("at", 139, 324);
  pdfDoc.line(143, 324, 198, 324);

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
  pdfDoc.save("Certificate of Death.pdf");
};

  const generateCustomizedForm = () => {
    if (selectedItem) {
      const {
        name,
        sex,
        dateDeath,
        dateBirth,
        age,
        place,
        civilstat,
        religion,
        citizenship,
        residence,
        occupation,
        fatherName,
        motherName,
        causeOfDeath,
        maternalCondi,
        autopsy,
        attendant,
        corpseDis,
        addOfCemetery,
        mannerDeath,
        externalCause,
      } = selectedItem;
      generateDeathRegistrationForm(
        name,
        sex,
        dateDeath,
        dateBirth,
        age,
        place,
        civilstat,
        religion,
        citizenship,
        residence,
        occupation,
        fatherName,
        motherName,
        causeOfDeath,
        maternalCondi,
        autopsy,
        attendant,
        corpseDis,
        addOfCemetery,
        mannerDeath,
        externalCause,
      );
    }
  };
 
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
                            if (item.collectionType === "deathCert") {
                              // Render
                              setSelectedForm(
                                <DeathCertificateForm selectedItem={item} />
                              );
                            } else if (item.collectionType === "death_reg") {
                              // Render
                              setSelectedForm(
                                <DeathRegistrationForm selectedItem={item} />
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
                    <DeathCertificateForm
                      selectedItem={selectedItem}
                      // Pass other necessary props
                    />
                  )}

                  {selectedItem.collectionType === "marriage_reg" && (
                    <DeathRegistrationForm
                      selectedItem={selectedItem}
                      // Pass other necessary props
                    />
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
