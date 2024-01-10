import React from "react";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer style={footerStyle}>
      <div style={footer}>
        <div style={logoContainerStyle}>
          <img src={logo} alt="Logo" style={logoStyle} />
          <p style={municipalityStyle}>Municipality of Del Gallego</p>
          <p style={provinceStyle}>Province of Camarines Sur</p>
        </div>

        <div style={content}>
          <h6 style={contact}>CONTACT INFORMATION</h6>
          <ul style={contactListStyle} className="contact-grid">
            <li>
              <span style={departmentStyle}>
                Provincial Health Office <span style={{ paddingLeft: "182px" }}>:{" "}</span>
                <span style={{ paddingLeft: "25px" }}> 09088606111 </span>
              </span>
            </li>
            <li>
              <span style={departmentStyle}>
                Bicol Region General Hospital <br /> and Geriatric
                Medical Center <span style={{ paddingLeft: "139px" }}>:{" "}</span>
                <span style={{ paddingLeft: "25px" }}> 09517652444 </span>  <br /> (BRGHGMC)
              </span>
            </li>
            <li>
              <span style={departmentStyle}>
                Bicol Medical Center (BMC Hospital)  <span style={{ paddingLeft: "5px" }}>:{" "}</span>
                <span style={{ paddingLeft: "10px" }}>
                  09610376590 </span> <span style={{ paddingLeft: "410px" }}> 09971291858
                </span>
              </span>
            </li>
            <li>
              <span style={departmentStyle}>
                PNP MPS Del Gallego <span style={{ paddingLeft: "192px" }}>:{" "}</span>
                <span style={{ paddingLeft: "23px" }}> 09985985972 </span>
              </span>
            </li>
            <li>
              <span style={departmentStyle}>
                BFP <span style={{ paddingLeft: "338px" }}>:{" "}</span>
                <span style={{ paddingLeft: "22px" }}> 09274969337 </span>
                </span>
            </li>
            <li>
              <span style={departmentStyle}>
                LGU Municipal Health Office <span style={{ paddingLeft: "145px" }}>:{" "}</span>
                <span style={{ paddingLeft: "23px" }}> 09175759735 </span>
              </span>
            </li>
            <li>
              <span style={departmentStyle}>MDRRMO <span style={{ paddingLeft: "290px" }}>:{" "}</span>
                <span style={{ paddingLeft: "21px" }}> 09163489138 </span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

const footerStyle = {
  backgroundColor: "#1e7566",
  color: "#fff",
  textAlign: "center",
  border: "1px solid #1e7566",
  width: "100%",
};

const footer = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  alignItems: "center",
  justifyContent: "center",
  margin: "20px",
  padding:"10",
};

const logoContainerStyle = {
  marginBottom: "10px",
};

const logoStyle = {
  width: "100px", // Adjust the width as needed
};

const contactListStyle = {
  listStyleType: "none",
  padding: 0,
};

const departmentStyle = {
  fontWeight: "normal",
  display: "block", // Make the department span a block element
  fontSize: "18px",
  marginTop: "15px",
};

const contactStyle = {
  fontWeight: "normal",
  color: "#fff",
  fontSize: "18px",
};

const municipalityStyle = {
  fontWeight: "bold",
  fontSize: "19px",
  textTransform: "uppercase",
  letterSpacing: "1.5px",
};

const provinceStyle = {};

const contact = {
  fontSize: "20px",
  marginTop: "15px",
  textAlign: "center",
};

const content = {
  textAlign: "justify",
  fontSize: "20px",
};

export default Footer;
