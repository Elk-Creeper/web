import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import Footer from "../components/footer";
import notification from "../assets/icons/Notification.png";
import useAuth from "../components/useAuth";
import "./about.css";

const About = () => {
      // Function for the account name
  const { user } = useAuth();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchUserEmail = () => {
      if (user) {
        const email = user.email;
        const truncatedEmail =
          email.length > 11 ? `${email.substring(0, 11)}..` : email;
        setUserEmail(truncatedEmail);
      }
    };

    fetchUserEmail();
  }, [user]);

  return (
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
              <a href="home">Home</a>
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

    <div className="content">
      <h2>About Our Municipality</h2>
      <p>
      Del Gallego, a 4th class municipality located in the province of Camarines Sur, Philippines, holds a significant position within the province due to its various contributions and vital role in the region. It provides essential services and opportunities to its residents, serving as a center for economic activities, administration, and governance. 
      The municipality encompasses a land area of 208.31 square kilometers or 80.43 square miles, constituting approximately 3.78% of the total area of Camarines Sur. Its geographical location, characterized by its proximity to water bodies and natural landscapes, contributes to the municipality’s charm and potential for various industries and activities.
      </p>
      <p>
      Del Gallego is composed of 32 barangays, which are the smallest administrative divisions in the Philippines. These barangays are further organized into puroks, which are smaller units within the barangay, and sitios. This hierarchical structure ensures efficient governance and enables the municipality to address the specific needs and concerns of the community effectively. The local government of Del Gallego works diligently to maintain a responsive and participatory governance system, aiming to provide equitable services and promote the well-being of its residents.
      </p>
      <p>
      According to the 2020 Census, the population of Del Gallego was recorded at 26,403 individuals. This figure represents approximately 1.28% of the total population of Camarines Sur province and approximately 0.43% of the overall population of the Bicol Region. The diverse population of Del Gallego contributes to its vibrant culture, creating a sense of unity and community among its residents. In terms of economic activities, Del Gallego thrives on a variety of sectors. Agriculture plays a significant role in the municipality’s economy, with the fertile land supporting the cultivation of various crops such as rice, coconut, corn, and vegetables. Fishing is also an integral part of the local economy, given the municipality’s proximity to the Ragay Gulf and Bicol River, which provide abundant marine resources. Additionally, Del Gallego benefits from industries such as poultry farming, livestock production, and agro-processing.
      To support its growing population and economic activities, Del Gallego continues to invest and prioritizes the enhancement of service delivery, and well-being of residents within and beyond the municipality.

      </p>
      <h3>Our Mission</h3>
      <p>
      "MuniServe: A Municipality's E-Service Platform for Efficient Public Service Delivery and Citizen Engagement at Del Gallego, Camarines Sur" aims to revolutionize public service delivery and citizen interaction within Del Gallego, Camarines Sur. By leveraging technology and connectivity, the app’s core purpose is to enhance efficiency, transparency, and citizen empowerment in local governance. 
     
      </p> 
      <h3>Contact Us</h3>
      <p>
        If you have any questions or would like to get in touch with us, please
        feel free to contact us at:
      </p>
      <ul>
          <li>Email: <a href="bytetech000@gmail.com">bytetech000@gmail.com</a></li>
          <li>Phone: 09925691965</li>
        </ul>
    </div>
    <Footer/>
    </div>
  );
};

export default About;