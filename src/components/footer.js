
import React from "react";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer style={footerStyle}>
      <div style={logoContainerStyle}>
        <img src={logo} alt="Logo" style={logoStyle} />
      </div>
      <p style={municipalityStyle}>Municipality of Del Gallego Hotlines </p>
      <div>
        <h4>Contact Information:</h4>
        <ul style={contactListStyle} className="contact-grid">
          <li> 
            <span style={departmentStyle}>Provincial Health Office</span>
            <span style={contactStyle}>09088606111</span>
          </li>
          <li>
            <span style={departmentStyle}>
              Bicol Region General Hospital and Geriatric Medical Center
              (BRGHGMC)
            </span>
            <span style={contactStyle}>09517652444</span>
          </li>
          <li>
            <span style={departmentStyle}>
              Bicol Medical Center (BMC Hospital)
            </span>
            <span style={contactStyle}>09610376590, 09971291858</span>
          </li>
          <li>
            <span style={departmentStyle}>PNP MPS Del Gallego</span>
            <span style={contactStyle}>09985985972</span>
          </li>
          <li>
            <span style={departmentStyle}>BFP</span>
            <span style={contactStyle}>09274969337</span>
          </li>
          <li>
            <span style={departmentStyle}>LGU Municipal Health Office</span>
            <span style={contactStyle}>09175759735</span>
          </li>
          <li>
            <span style={departmentStyle}>MDRRMO</span>
            <span style={contactStyle}>09163489138</span>
          </li>
        </ul>
      </div>
    </footer>
  );
};

const footerStyle = {
  backgroundColor: "#1e7566",
  color: "#fff",
  textAlign: "center",
  padding: "1rem",
  borderTopLeftRadius: "10px",
  borderTopRightRadius: "10px",
  border: "1px solid #1e7566",
  width: "6100px",
  width: "7000px",
  marginTop: "20px",
  marginLeft:"0px",
 
};

const logoContainerStyle = {
  marginBottom: "10px",
};

const logoStyle = {
  width: "80px", // Adjust the width as needed
};

const contactListStyle = {
  listStyleType: "none",
  padding: 0,
};

const departmentStyle = {
  fontWeight: "bold",
  display: "block", // Make the department span a block element
  marginBottom: "5px", // Add some space below the department name
};

const contactStyle = {
  fontWeight: "normal",
  color: "#fff",
  fontSize: "14px",
};

const municipalityStyle = {
  fontWeight: "bold",
};

export default Footer;
