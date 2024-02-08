import React from "react";

const SocialMediaLink = ({ icon, link }) => {
  const iconStyle = {
    marginRight: "10px",
    fontSize: "50px",
    color: "#fff",
  };

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <i className={icon} style={iconStyle}></i>
    </a>
  );
};

export default SocialMediaLink;
