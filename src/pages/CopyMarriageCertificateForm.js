// CopyMarriageCertificateForm.jsx

import React from 'react';
import "./birthReg.css";

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

const CopyMarriageCertificateForm = ({
  selectedItem,
  handleStatusChange,
  textInput,
  handleTextChange,
}) => {
  return (
    <div className="copy-marriage-certificate-form">
      <h2 className='centered'> Request for Marriage Certification</h2>
      {/* Add your specific form fields for "Request Copy of Marriage Certificate" here */}
      <div className="form-group">
        <label>Complete Name of the Husband</label>
        <div className="placeholder">{selectedItem.hname}</div>
      </div>

      <div className="form-group">
        <label>Complete Name of the Wife</label>
        <div className="placeholder">{selectedItem.wname}</div>
      </div>

      <div className="form-group">
        <label>Date of Marriage</label>
        <div className="placeholder">
                          {selectedItem.date &&
                            selectedItem.date.toDate
                            ? formatDate(selectedItem.date.toDate())
                            : "Invalid Date"}
                        </div>
      </div>

      <div className="form-group">
        <label>Place of Marriage</label>
        <div className="placeholder">{selectedItem.marriage}</div>
      </div>

      <div className="form-group">
        <label>Complete Name of the Requesting Party</label>
        <div className="placeholder">{selectedItem.rname}</div>
      </div>

      <div className="form-group">
        <label>Complete Address of the Requesting Party</label>
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

      {/* Add more fields as needed */}
    </div>
  );
};

export default CopyMarriageCertificateForm;
