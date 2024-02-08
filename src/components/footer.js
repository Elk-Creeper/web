import React from "react";
import { FaFacebook, FaEnvelope } from "react-icons/fa";
import { Link } from 'react-router-dom';

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
                PNP MPS Del Gallego <span style={{ paddingLeft: "190px" }}>:{" "}</span>
                <span style={{ paddingLeft: "23px" }}> 09985985972 </span>
              </span>
            </li>
            <li>
              <span style={departmentStyle}>
                BFP <span style={{ paddingLeft: "335px" }}>:{" "}</span>
                <span style={{ paddingLeft: "22px" }}> 09274969337 </span>
              </span>
            </li>
            <li>
              <span style={departmentStyle}>
                LGU Municipal Health Office <span style={{ paddingLeft: "143px" }}>:{" "}</span>
                <span style={{ paddingLeft: "23px" }}> 09175759735 </span>
              </span>
            </li>
            <li>
              <span style={departmentStyle}>MDRRMO <span style={{ paddingLeft: "285px" }}>:{" "}</span>
                <span style={{ paddingLeft: "21px" }}> 09163489138 </span>
              </span>
            </li>
          </ul>
        </div>

        <div>
          <div style={social}>
          <h4 style={{fontWeight: "bold", fontSize: "18px", marginBottom: "20px"}}>SOCIAL MEDIA LINKS</h4>
            <a href="https://web.facebook.com/SulongDelGallego" target="_blank" rel="noopener noreferrer">
              <FaFacebook size={30} style={{ marginRight: '10px', color: '#fff' }} />
            </a>
            <a href="mailto:youremail@example.com">
              <FaEnvelope size={30} style={{ color: '#fff' }} />
            </a>
          </div>

          <div style={quickLinks}>
            <h4 style={{fontWeight: "bold", fontSize: "18px", marginBottom: "-30px"}}>QUICK LINKS</h4>
            <h4><Link to="/terms" style={quickLinkStyle}>Terms and Conditions</Link></h4>
            <Link to="/privacy" style={quickLinkStyle}>Privacy Policy</Link>
          </div>
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
  padding: "10",
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

const social = {
  marginTop: "10px",
  textAlign: "center",
};

const quickLinks = {
  gridColumn: "span 3",
  marginTop: "20px",
};

const quickLinkStyle = {
  color: "#fff",
  textDecoration: "none",
  marginRight: "20px",
  fontSize: "16px",
};

export default Footer;
