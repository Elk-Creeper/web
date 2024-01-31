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

const DeathRegistrationForm = ({
  selectedItem,
  handleStatusChange,
  textInput,
  handleTextChange,
}) => {
  return (
    <div className="copy-marriage-certificate-form">
         <h2 className='centered'> Request for Death Registration</h2>

         <p>This registration form is requested by{" "}{selectedItem.userName}.</p>

         {/* Person's Information */}
         <div className="section">
                    <h3>Child's Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Name</label>
                        <div className="placeholder">{selectedItem.name}</div>
                      </div>

                      <div className="form-group">
                        <label>Sex</label>
                        <div className="placeholder">{selectedItem.sex}</div>
                      </div>

                      <div className="form-group">
                        <label>Date of Death</label>
                        <div className="placeholder">
                          {selectedItem.dateDeath &&
                          selectedItem.dateDeath.toDate
                            ? selectedItem.dateDeath.toDate().toLocaleString()
                            : "Invalid Date"}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Date of Birth</label>
                        <div className="placeholder">
                          {selectedItem.dateBirth &&
                          selectedItem.dateBirth.toDate
                            ? selectedItem.dateBirth.toDate().toLocaleString()
                            : "Invalid Date"}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Age at the Time of Death</label>
                        <div className="placeholder">{selectedItem.age}</div>
                      </div>

                      <div className="form-group">
                        <label>Place of Death</label>
                        <div className="placeholder">{selectedItem.place}</div>
                      </div>

                      <div className="form-group">
                        <label>Civil Status</label>
                        <div className="placeholder">
                          {selectedItem.civilstat}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Religion/Religious Sect</label>
                        <div className="placeholder">
                          {selectedItem.religion}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Citizenship</label>
                        <div className="placeholder">
                          {selectedItem.citizenship}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Residence</label>
                        <div className="placeholder">
                          {selectedItem.residence}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Occupation</label>
                        <div className="placeholder">
                          {selectedItem.occupation}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Name of Father</label>
                        <div className="placeholder">
                          {selectedItem.fatherName}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Maiden Name of Mother</label>
                        <div className="placeholder">
                          {selectedItem.motherName}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Certificate */}
                  <div className="section">
                    <h3>Medical Certificate</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Does the deceased aged 0 - 7 </label>
                        <div className="placeholder">
                          {selectedItem.forChild}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Causes of Death</label>
                        <div className="placeholder">
                          {selectedItem.causeOfDeath}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Maternal Condition</label>
                        <div className="placeholder">
                          {selectedItem.maternalCondi}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Death by External Causes</label>
                        <div className="placeholder">
                          {selectedItem.externalCause}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Autopsy</label>
                        <div className="placeholder">
                          {selectedItem.autopsy}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Attendant</label>
                        <div className="placeholder">
                          {selectedItem.attendant}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Corpse Disposal</label>
                        <div className="placeholder">
                          {selectedItem.corpseDis}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Name and Address of Cemetery or Crematory</label>
                        <div className="placeholder">
                          {selectedItem.addOfCemetery}
                        </div>
                      </div>
                      {/* Add more mother fields here */}
                    </div>
                  </div>
      
    </div>
  );
};

export default DeathRegistrationForm;
