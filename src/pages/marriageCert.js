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
import { getStorage, ref, getDownloadURL } from "firebase/storage"; // Import Firebase Storage related functions
import "./birthReg.css";
import jsPDF from "jspdf";
import logo from "../assets/logo.png";
import notification from "../assets/icons/Notification.png";
import { FaSearch } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import useAuth from "../components/useAuth";
import Footer from "../components/footer";
import { format } from 'date-fns'; // Import the format function from date-fns


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
const storage = getStorage(app);

function drawDottedBox(pdfDoc, x, y, size) {
  pdfDoc.setDrawColor("#FF0000"); // Set the border color
  pdfDoc.setLineWidth(0.1); // Set the border width
  pdfDoc.setLineDash([1, 1], 0); // Set the line dash pattern for a dotted line
  pdfDoc.rect(x, y, size, size, "D");
  pdfDoc.setLineDash(); // Reset the line dash pattern to default (solid line)
}

function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

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
  const [textInput, setTextInput] = useState("");
  const [initialLoad, setInitialLoad] = useState(true); //automatic pending
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
        const snapshot = await collection(firestore, collectionName);
        console.log(`Fetching data from ${collectionName}...`);
        const querySnapshot = await getDocs(snapshot);

        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          status: "Pending",
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
            console.error(
              `Missing createdAt field in document with id: ${item.id}`
            );
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
  };

  const closeDetailsModal = () => {
    setSelectedItem(null);
    setTableVisible(true);
  };

  const handleStatusChange = async (id, newStatus, collectionName) => {
    try {
      const appointmentRef = doc(firestore, collectionName, id);
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

  const generateMarriageCertificateForm = (h_fname, h_mname, h_lname, h_age, h_citizenship, h_civilstat, h_dateBirth, h_fatherName, h_motherName,
    h_personName, h_placeBirth, h_relationship, h_religion, h_residence, h_sex, hf_citizenship, hm_citizenship, hp_residence, 
  w_fname, w_mname, w_lname, w_age, w_citizenship, w_civilstat, w_dateBirth, w_dateMarriage, w_fatherName, w_motherName,
 w_personName, w_placeBirth, w_placeMarriage, w_relationship, w_religion, w_residence, w_sex, wf_citizenship, wm_citizenship, wp_residence) => {

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

    // Draw vertical border line before the "Registry No." part (thinner and shorter)
    const thinnerLineWidth = 0.1; // Adjust the thickness of the vertical line
    const shorterLineHeight = 15; // Adjust the length of the vertical line
    pdfDoc.setLineWidth(thinnerLineWidth);
    pdfDoc.line(130, 32, 130, 32 + shorterLineHeight);

    pdfDoc.text("Registry No.", 133, 38);

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
    pdfDoc.rect(50, 52, 144, horizontalHeight);

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
    pdfDoc.text(`${h_fname ? h_fname.toUpperCase() : ''}`, 65, 57);
    // Draw a line after the word
    pdfDoc.line(58, 58, 121, 58);

    // First
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text(`(First)`, 124, 57);
    pdfDoc.setFontSize(10);
    pdfDoc.setTextColor("#000000");
    pdfDoc.text(`${w_fname ? w_fname.toUpperCase() : ''}`, 139, 57);
    // Draw a line after the word
    pdfDoc.line(131, 58, 193, 58);

    // Middle
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Middle)", 51, 62);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_mname ? w_mname.toUpperCase() : ''}`, 65, 62);
    // Draw a line after the word
    pdfDoc.line(62, 63, 121, 63);

    // Middle
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Middle)", 124, 62);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${w_mname ? w_mname.toUpperCase() : ''}`, 139, 62);
    // Draw a line after the word
    pdfDoc.line(135, 63, 193, 63);

    // Last
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Last)", 51, 67);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_lname ? h_lname.toUpperCase() : ''}`, 65, 67);
    // Draw a line after the word
    pdfDoc.line(58, 68, 121, 68);

    // Last
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Last)", 124, 67);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${w_lname ? w_lname.toUpperCase() : ''}`, 139, 67);
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
    const timestamp = 1642041321000;
    const dateOfBirth = new Date(timestamp);
    const formattedDateOfBirth = format(dateOfBirth, 'dd/MM/yy');
    pdfDoc.text(formattedDateOfBirth, 60, 78);

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
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_placeBirth ? h_placeBirth.toUpperCase() : ''}`, 53, 88);
    pdfDoc.text(`${w_placeBirth ? w_placeBirth.toUpperCase() : ''}`, 126, 88);

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
    pdfDoc.text(`${h_sex ? h_sex.toUpperCase() : ''}`, 55, 98);

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
    pdfDoc.text(`${h_citizenship ? h_citizenship.toUpperCase() : ''}`, 79, 98);

    //Wife
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Sex)", 126, 93);
    pdfDoc.setTextColor("#000000");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${w_sex ? w_sex.toUpperCase() : ''}`, 129, 98);

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
    pdfDoc.text(`${w_citizenship ? w_citizenship.toUpperCase() : ''}`, 154, 98);

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
    pdfDoc.setFontSize(8);
    pdfDoc.text(`${h_residence ? h_residence .toUpperCase() : ''}`, 52, 108);

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
    pdfDoc.setFontSize(8);
    pdfDoc.text(`${w_residence ? w_residence .toUpperCase() : ''}`, 126, 108);

    //6th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("6. Religion/", 17, 114);
    pdfDoc.text("    Religious Sect", 22, 118);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_religion ? h_religion .toUpperCase() : ''}`, 65, 117);
    pdfDoc.text(`${w_religion ? w_religion .toUpperCase() : ''}`, 145, 117);
    drawThinBorderLine(pdfDoc, 110, lineWidthss, lineHeightss, margin);

    //7th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("7. Civil Status", 17, 126);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_civilstat ? h_civilstat .toUpperCase() : ''}`, 68, 126);
    pdfDoc.text(`${w_civilstat ? w_civilstat .toUpperCase() : ''}`, 153, 126);

    drawThinBorderLine(pdfDoc, 120, lineWidthss, lineHeightss, margin);

    //8th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("8. Name of Father", 17, 136);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_fatherName ? h_fatherName .toUpperCase() : ''}`, 60, 138);
    pdfDoc.text(`${w_fatherName ? w_fatherName .toUpperCase() : ''}`, 130, 138);
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
    pdfDoc.text(`${hf_citizenship ? hf_citizenship .toUpperCase() : ''}`, 65, 146);
    pdfDoc.text(`${wf_citizenship ? wf_citizenship .toUpperCase() : ''}`, 135, 146);
    drawThinBorderLine(pdfDoc, 140, lineWidthss, lineHeightss, margin);

    //10th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("10. Maiden Name", 17, 154);
    pdfDoc.text("      of Mother", 17, 158);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_motherName ? h_motherName .toUpperCase() : ''}`, 60, 157);
    pdfDoc.text(`${w_motherName ? w_motherName .toUpperCase() : ''}`, 133, 157);
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
    pdfDoc.text(`${hm_citizenship ? hm_citizenship .toUpperCase() : ''}`, 68, 166);
    pdfDoc.text(`${wm_citizenship ? wm_citizenship .toUpperCase() : ''}`, 150, 166);
    drawThinBorderLine(pdfDoc, 160, lineWidthss, lineHeightss, margin);

    //12th Part
    pdfDoc.setFontSize(7);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("12. Name of Person/", 17, 173);
    pdfDoc.text("      Wali Who Gave", 17, 176);
    pdfDoc.text("      Consent or Advice", 17, 179);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`${h_personName ? h_personName .toUpperCase() : ''}`, 60, 177);
    pdfDoc.text(`${w_personName ? w_personName .toUpperCase() : ''}`, 132, 177);
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
    pdfDoc.text(`${h_relationship ? h_relationship .toUpperCase() : ''}`, 68, 187);
    pdfDoc.text(`${w_relationship ? w_relationship .toUpperCase() : ''}`, 145, 187);
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
    pdfDoc.text(`${hp_residence ? hp_residence .toUpperCase() : ''}`, 52, 198);


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
    pdfDoc.text(`${wp_residence ? wp_residence .toUpperCase() : ''}`, 125, 198);

    const lineWidthsss = pdfDoc.internal.pageSize.width - 2 * margin;
    const lineHeightsss = 0.3; // Thin border size
    drawThinBorderLine(pdfDoc, 200, lineWidthsss, lineHeightsss, margin);

    //15th Part
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("normal");
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("15. Place of Marriage: ", 17, 205);
    pdfDoc.text(`${w_placeMarriage ? w_placeMarriage.toUpperCase() : ''}`, 50, 204);
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

    drawDottedLine(pdfDoc, 45, 215, 112, 215, 0.1);
    pdfDoc.setFontSize(7);
    pdfDoc.setTextColor("#FF0000");
    pdfDoc.text("(Day)", 52, 218);
    pdfDoc.text("(Month)", 76, 218);
    pdfDoc.text("(Year)", 98, 218);

    pdfDoc.setFontSize(9);
    pdfDoc.setTextColor("#000000");
    pdfDoc.text("17. Time of Marriage: ", 124, 215);
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

    // Save the PDF or open in a new window
    pdfDoc.save("Certificate of Marriage.pdf");
  };

  const generateCustomizedForm = () => {
    if (selectedItem) {
      const { h_fname, h_mname, h_lname, h_age, h_citizenship, h_civilstat, h_dateBirth, h_fatherName, h_motherName,
      h_personName, h_placeBirth, h_relationship, h_religion, h_residence, h_sex, hf_citizenship, hm_citizenship, hp_residence, 
    w_fname, w_mname, w_lname, w_age, w_citizenship, w_civilstat, w_dateBirth, w_dateMarriage, w_fatherName, w_motherName,
   w_personName, w_placeBirth, w_placeMarriage, w_relationship, w_religion, w_residence, w_sex, wf_citizenship, wm_citizenship, wp_residence} = selectedItem;
      generateMarriageCertificateForm(h_fname, h_mname, h_lname, h_age, h_citizenship, h_civilstat, h_dateBirth, h_fatherName, h_motherName,
        h_personName, h_placeBirth, h_relationship, h_religion, h_residence, h_sex, hf_citizenship, hm_citizenship, hp_residence, 
      w_fname, w_mname, w_lname, w_age, w_citizenship, w_civilstat, w_dateBirth, w_dateMarriage, w_fatherName, w_motherName,
     w_personName, w_placeBirth, w_placeMarriage, w_relationship, w_religion, w_residence, w_sex, wf_citizenship, wm_citizenship, wp_residence);
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
                        {item.userName}
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

                  {/* Husband's Information */}
                  <div className="section">
                    <h3>Husband's Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Husband's First Name</label>
                        <div className="placeholder">
                          {selectedItem.h_fname}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Middle Name</label>
                        <div className="placeholder">
                          {selectedItem.h_fname}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Last Name</label>
                        <div className="placeholder">
                          {selectedItem.h_lname}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Date of Birth</label>
                        <div className="placeholder">
                          {selectedItem.h_dateBirth &&
                          selectedItem.h_dateBirth.toDate
                            ? formatDate(selectedItem.h_dateBirth.toDate())
                            : "Invalid Date"}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Age</label>
                        <div className="placeholder">{selectedItem.h_age}</div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Birth Place</label>
                        <div className="placeholder">
                          {selectedItem.h_placeBirth}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Sex</label>
                        <div className="placeholder">{selectedItem.h_sex}</div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Citizenship</label>
                        <div className="placeholder">
                          {selectedItem.h_citizenship}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Residence</label>
                        <div className="placeholder">
                          {selectedItem.h_residence}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Religion/Religious Sect</label>
                        <div className="placeholder">
                          {selectedItem.h_religion}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Civil Status</label>
                        <div className="placeholder">
                          {selectedItem.h_civilstat}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Name of Father</label>
                        <div className="placeholder">
                          {selectedItem.h_fatherName}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Father Citizenship</label>
                        <div className="placeholder">
                          {selectedItem.hf_citizenship}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Mother's Maiden Name</label>
                        <div className="placeholder">
                          {selectedItem.h_motherName}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Husband's Mother Citizenship</label>
                        <div className="placeholder">
                          {selectedItem.hm_citizenship}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>
                          Name of Person/Wali who gave Consent or Advice
                        </label>
                        <div className="placeholder">
                          {selectedItem.h_personName}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Relationship</label>
                        <div className="placeholder">
                          {selectedItem.h_relationship}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Residence</label>
                        <div className="placeholder">
                          {selectedItem.hp_residence}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Wife's Information */}
                  <div className="section">
                    <h3>Wife's Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Wife's First Name</label>
                        <div className="placeholder">
                          {selectedItem.w_fname}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Middle Name</label>
                        <div className="placeholder">
                          {selectedItem.w_fname}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Last Name</label>
                        <div className="placeholder">
                          {selectedItem.w_lname}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Date of Birth</label>
                        <div className="placeholder">
                          {selectedItem.w_dateBirth &&
                          selectedItem.w_dateBirth.toDate
                            ? formatDate(selectedItem.w_dateBirth.toDate())
                            : "Invalid Date"}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Place of Birth</label>
                        <div className="placeholder">
                          {selectedItem.w_placeBirth}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Sex</label>
                        <div className="placeholder">{selectedItem.w_sex}</div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Citizenship</label>
                        <div className="placeholder">
                          {selectedItem.w_citizenship}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Residence</label>
                        <div className="placeholder">
                          {selectedItem.w_residence}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Religion/Religious sect</label>
                        <div className="placeholder">
                          {selectedItem.w_religion}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Civil Status</label>
                        <div className="placeholder">
                          {selectedItem.w_civilstat}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Name of Father</label>
                        <div className="placeholder">
                          {selectedItem.w_fatherName}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Father Citizenship</label>
                        <div className="placeholder">
                          {selectedItem.wf_citizenship}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Mother Maiden Name</label>
                        <div className="placeholder">
                          {selectedItem.w_motherName}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wife's Mother Citizenship</label>
                        <div className="placeholder">
                          {selectedItem.wm_citizenship}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>
                          Name of Person/Wali who gave Consent or Advice
                        </label>
                        <div className="placeholder">
                          {selectedItem.w_personName}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Relationship</label>
                        <div className="placeholder">
                          {selectedItem.w_relationship}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Residence</label>
                        <div className="placeholder">
                          {selectedItem.wp_residence}
                        </div>
                      </div>
                      {/* Add more mother fields here */}
                    </div>
                  </div>

                  {/* Others Information */}
                  <div className="section">
                    <h3>Other Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Place of Marriage</label>
                        <div className="placeholder">
                          {selectedItem.w_placeMarriage}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Date of Marriage</label>
                        <div className="placeholder">
                          {selectedItem.w_dateMarriage &&
                          selectedItem.w_dateMarriage.toDate
                            ? formatDate(selectedItem.w_dateMarriage.toDate())
                            : "Invalid Date"}
                        </div>
                      </div>

                      {/* Add more father fields here */}
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
                    <FontAwesomeIcon
                      icon={faPaperPlane}
                      style={{ marginLeft: "5px" }}
                    />{" "}
                    Submit
                  </button>

                  <div>
                      <button onClick={generateCustomizedForm} className="open-pdf-button-container">
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
