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

const CopyMarriageCertificateForm = ({
  selectedItem,
  handleStatusChange,
  textInput,
  handleTextChange,
}) => {
  return (
    <div className="copy-marriage-certificate-form">
         <h2 className='centered'> Request for Marriage Registration</h2>
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

          {/* Add more husband's information fields here */}
        </div>
      </div>

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

          {/* Add more wife's information fields here */}
        </div>
      </div>

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

          {/* Add more other information fields here */}
        </div>
      </div>
  
    </div>
  );
};

export default CopyMarriageCertificateForm;
