import React from 'react';
import "./birthReg.css";

// Define the formatDate function
function formatDate(date) {
  // Implement your date formatting logic here
  // For example, you can use JavaScript's Date methods to format the date
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return formattedDate;
}

const DeathCertificateForm = ({
  selectedItem,
  handleStatusChange,
  textInput,
  handleTextChange,
}) => {
  return (
    <div className="copy-marriage-certificate-form">
         <h2 className='centered'> Request for Death Registration</h2>

         <p>This registration form is requested by{" "}{selectedItem.userName}.</p>

         <div className="form-group">
        <label>Complete Name of the Deceased Person</label>
        <div className="placeholder">{selectedItem.name}</div>
      </div>

      <div className="form-group">
        <label>Date of Death</label>
        <div className="placeholder">
                          {selectedItem.date &&
                            selectedItem.date.toDate
                            ? formatDate(selectedItem.date.toDate())
                            : "Invalid Date"}
                        </div>
      </div>

      <div className="form-group">
        <label>Place of Death</label>
        <div className="placeholder">{selectedItem.place}</div>
      </div>

      <div className="form-group">
        <label>Complete Name of the Requesting Party</label>
        <div className="placeholder">{selectedItem.rname}</div>
      </div>

      <div className="form-group">
        <label>Complete Address of Requesting Party</label>
        <div className="placeholder">{selectedItem.address}</div>
      </div>

      <div className="form-group">
        <label>Number of Copies Needed</label>
        <div className="placeholder">{selectedItem.copies}</div>
      </div>

      <div className="form-group">
        <label>Purpose of the Certification</label>
        <div className="placeholder">{selectedItem.purpose}</div>
      </div>

                            
      
    </div>
  );
};

export default DeathCertificateForm;
