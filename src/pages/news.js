import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import './news.css';
import Sidebar from "../components/sidebar";
import { FaSearch, FaPlus, FaEdit, FaTrashAlt, FaThumbsUp, FaThumbsDown, FaImage } from 'react-icons/fa';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, setDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; import logo from '../assets/logo.png';
import notification from '../assets/icons/Notification.png';
import { formatDistanceToNow } from 'date-fns';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import NewsDetails from './newsDetails';
import Footer from '../components/footer';
import useAuth from "../components/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faTimes, faUser, faHistory, faSignOutAlt  } from "@fortawesome/free-solid-svg-icons";

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);

const NewsForm = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submittedNews, setSubmittedNews] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [expandedContentIndex, setExpandedContentIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("");
  const [selectedDayFilter, setSelectedDayFilter] = useState("");
  const [data, setData] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const history = useHistory();

  // Function to toggle dropdown
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout(); // Call the logout function
    history.push('/login'); // Redirect to the login page after logout
    window.scrollTo(0, 0);
  };

  // Function for the account name
  const { user } = useAuth();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchUserEmail = () => {
      if (user) {
        const email = user.email;
        const truncatedEmail = email.length > 11 ? `${email.substring(0, 11)}...` : email;
        setUserEmail(truncatedEmail);
      }
    };

    fetchUserEmail();
  }, [user]);

  useEffect(() => {
    const fetchNews = async () => {
      const newsCollection = collection(firestore, 'news');
      const unsubscribe = onSnapshot(newsCollection, (querySnapshot) => {
        const fetchedNews = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSubmittedNews(fetchedNews);
        setData(fetchedNews); // Update the data state when the news changes
      });

      return () => {
        // Unsubscribe from the snapshot listener when the component unmounts
        unsubscribe();
      };
    };

    fetchNews();
  }, []);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleEdit = (index) => {
    const selectedNews = submittedNews[index];
    setTitle(selectedNews.title);
    setContent(selectedNews.content);

    // Set the editIndex to the current index
    setEditIndex(index);

    // Make the form visible
    setIsFormVisible(true);
  };

  const handleDelete = async (newsId) => {
    const newsRef = doc(firestore, 'news', newsId);
    await deleteDoc(newsRef);
  };

  const MAX_CONTENT_LENGTH = 150;

  const handleReadMore = (index) => {
    // Toggle the expanded content index
    setExpandedContentIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  // Filter data based on the search query
  const filteredData = submittedNews.filter((item) => {
    // Filtering logic
    const isMatchingSearch = (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isMatchingYear = (
      selectedYearFilter === "" ||
      (item.createdAt && item.createdAt.toDate().getFullYear().toString() === selectedYearFilter) ||
      (item.updatedAt && item.updatedAt.toDate().getFullYear().toString() === selectedYearFilter)
    );

    const isMatchingMonth = (
      selectedMonthFilter === "" ||
      (item.createdAt && item.createdAt.toDate().getMonth() + 1 === new Date(Date.parse(selectedMonthFilter + " 1, 2000")).getMonth() + 1) ||
      (item.updatedAt && item.updatedAt.toDate().getMonth() + 1 === new Date(Date.parse(selectedMonthFilter + " 1, 2000")).getMonth() + 1)
    );

    const isMatchingDay = (
      selectedDayFilter === "" ||
      (item.createdAt && item.createdAt.toDate().getDate().toString() === selectedDayFilter) ||
      (item.updatedAt && item.updatedAt.toDate().getDate().toString() === selectedDayFilter)
    );

    return isMatchingSearch && isMatchingYear && isMatchingMonth && isMatchingDay;
  });

  const handleClearFilters = () => {
    // Clear all filters
    setSearchQuery("");
    setSelectedYearFilter("");
    setSelectedMonthFilter("");
    setSelectedDayFilter("");
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

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setPhotoFiles([]); // Clear selected photos when closing the form
    setEditIndex(null);
    setIsFormVisible(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      // Handle image upload if there are selected photos
      let uploadedImageURLs = [];
      if (photoFiles.length > 0) {
        const storageRef = ref(storage, 'images');

        for (const file of photoFiles) {
          const imageRef = ref(storageRef, file.name);
          await uploadBytes(imageRef, file);
          const imageURL = await getDownloadURL(imageRef);
          uploadedImageURLs.push(imageURL);
        }
      }

      const currentTime = serverTimestamp();
      const newsRef = collection(firestore, 'news');

      if (editIndex !== null) {
        // Update existing news
        const newsId = submittedNews[editIndex].id;
        const newsDocRef = doc(firestore, 'news', newsId);
        await updateDoc(newsDocRef, {
          title,
          content,
          updatedAt: currentTime,
          imageUrls: uploadedImageURLs, // Update image URLs
        });
      } else {
        // Add new news
        await addDoc(newsRef, {
          title,
          content,
          likes: 0,
          createdAt: currentTime,
          imageUrls: uploadedImageURLs,
        });
      }

      alert('News submitted successfully!');
      handleClose();
    } catch (error) {
      console.error('Error handling form submission', error);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    setPhotoFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleRemoveImage = (index) => {
    // Remove the selected image at the specified index from both photoFiles and imagePreviews
    const updatedPhotoFiles = [...photoFiles];
    updatedPhotoFiles.splice(index, 1);

    const updatedImagePreviews = [...imagePreviews];
    updatedImagePreviews.splice(index, 1);

    setPhotoFiles(updatedPhotoFiles);
    setImagePreviews(updatedImagePreviews);
  };

  useEffect(() => {
    // Clean up the object URLs when component unmounts or when photoFiles change
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  // Update image previews whenever photoFiles change
  useEffect(() => {
    // Create new previews only for the newly added files
    const newPreviews = Array.from(photoFiles.slice(imagePreviews.length)).map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
  }, [photoFiles]);

  const sortedData = filteredData.sort((a, b) => {
    const dateA = a.createdAt?.seconds || 0;
    const dateB = b.createdAt?.seconds || 0;
    return dateB - dateA;
  });

  const getTimeAgoString = (timestamp) => {
    if (!timestamp) {
      return 'Unknown Time';
    }

    const createdAtDate = new Date(timestamp.seconds * 1000); // Convert seconds to milliseconds
    const now = new Date();

    // Calculate the time difference
    const distanceString = formatDistanceToNow(createdAtDate, { addSuffix: true });

    return distanceString;
  };

  const renderImages = (imageUrls) => {
    if (imageUrls && imageUrls.length > 0) {
      const mainImageUrl = imageUrls[0]; // Display the first image
      const remainingImagesCount = imageUrls.length - 1;

      return (
        <div className="image-container">
          <img src={mainImageUrl} alt="Main News Image" className="news-image" />

          {remainingImagesCount > 0 && (
            <div className="remaining-images">
              <p>{`+${remainingImagesCount} ${remainingImagesCount === 1 ? 'more image' : 'more images'}`}</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Router>
      <div className="app-container" style={{marginBottom: "50px"}}>
        <div className='container'>
        <div className="header">
        <img src={logo} alt="logo" className="SidebarLogo" />
        <div className="SidebarTitle">
          <span className="muni">MUNI</span>
          <span className="serve">SERVE</span>
        </div>

        <nav className="horizontal-nav">
          <ul>
            <li>
              <a href="/home">Home</a>
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
            <li className="dropdown">
              <a>Settings</a>
              <div className="dropdown-content">
                <a href="/faq">FAQ</a>
                <a href="/helps">Help</a>
                <a href="/privacy-policy">Privacy Policy</a>
              </div>
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
            <div className="dropdown-arrow" onClick={toggleDropdown}>
              <FontAwesomeIcon icon={faCaretDown} />
            </div>
          </div>
          {dropdownOpen && (
            <div className="modal-content">
            <ul>
              <li>
                <FontAwesomeIcon icon={faUser} style={{width: "20px", height: "20px", color: "#307A59"}}/> <a href="/account-settings">Profile</a>
              </li>
              <li>
                <FontAwesomeIcon icon={faHistory} style={{width: "20px", height: "20px", color: "#307A59"}}/> <a href="/history">History</a>
              </li>
              <li>
                <FontAwesomeIcon icon={faSignOutAlt} style={{width: "20px", height: "20px", color: "#307A59"}}/> <a onClick={handleLogout}>Logout</a>
              </li>
            </ul>
            <button className="close-buttons" onClick={toggleDropdown}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          )}
        </div>
      </div>

      <div className="containers">
          <h1>News</h1>
        </div>

          <div className="search-container">
            <FaSearch className="search-icon"></FaSearch>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="filter-container">
              <label>Filter:</label>
              <select value={selectedYearFilter} onChange={handleYearFilterChange} className="filter">
                <option value="">Year</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>

              </select>
              <select value={selectedMonthFilter} onChange={handleMonthFilterChange} className="filter">
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
              <select value={selectedDayFilter} onChange={handleDayFilterChange} className="filter">
                <option value="">Day</option>
                <option value="1">1</option>
                <option value="2">2</option>\
                <option value="3">3</option>
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

              {!isFormVisible && editIndex === null && (
                <FaPlus className="plus-icon" title="Add News" onClick={toggleFormVisibility} />
              )}
            </div>
          </div>

          {isFormVisible && (
            <div className="form-container">
              <form onSubmit={handleFormSubmit} className="create">
                <h3>Create News or Announcement</h3>
                <button className="clos-buttons" onClick={() => {
                  handleClose();
                  if (editIndex !== null) {
                    setTitle('');
                    setContent('');
                    setEditIndex(null);
                  }
                }}>
                  <span>&times;</span>
                </button>

                <label htmlFor="title">Title:</label>
                <input type="text" id="title" value={title} onChange={handleTitleChange} />
                <br />

                <label htmlFor="content">Content:</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={handleContentChange}
                  style={{ width: '93%', height: '200px', resize: 'none' }}
                ></textarea>
                <br />

                <label htmlFor="photos">Photos:</label>
                <input
                  type="file"
                  id="photos"
                  multiple
                  accept="image/*"
                  onChange={handleFileInputChange}
                  ref={fileInputRef}
                />

                {imagePreviews.length > 0 && (
                  <div className="image-previews">
                    <p>Selected Images:</p>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview-container">
                        <img src={preview} alt={`Preview ${index}`} className="image-preview" />
                        <span
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="remove-button"
                        >
                          &times;
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button type="submit" className='submits'>{editIndex !== null ? 'Update' : 'Post'}</button>
              </form>
            </div>
          )}

          {!isFormVisible && (
            <div className="submitted-news-container">
              {sortedData.length > 0 ? (
                sortedData.map((news, index) => (
                  <div
                    key={index}
                    className={`news-item ${expandedContentIndex === index ? 'expanded' : 'collapsed'}`}
                  >
                    <div className="title">
                      <img src={logo} alt="logo" className='logo' />
                      <h5>{news.title}</h5>
                      <h3>{getTimeAgoString(news.createdAt)}</h3>
                    </div>

                    <div className='news-grid'>
                      <div className='text-section'>
                        <p className='news-text' >
                          {expandedContentIndex === index || news.content.length <= MAX_CONTENT_LENGTH
                            ? news.content
                            : `${news.content.slice(0, MAX_CONTENT_LENGTH)}....   `}
                          {news.content.length > MAX_CONTENT_LENGTH && (
                            // Use handleReadMore to toggle expanded content
                            <span onClick={() => handleReadMore(index)} className='read'>
                              {expandedContentIndex === index ? '    Read Less' : 'Read More'}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="image-section">
                        {renderImages(news.imageUrls)}
                      </div>
                    </div>

                    <div className="icons-container">
                      <button onClick={() => handleEdit(index)} className='icon-button' title='Edit News'>
                        <FaEdit className='icns' />
                      </button>

                      <button onClick={() => handleDelete(news.id)} className='icon-button' title='Delete News'>
                        <FaTrashAlt className='icns' />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className='note'>No Data Found.</p>
              )}
            </div>
          )} 
        </div>
      </div>
      <Footer />
    </Router >
    
  );
};

export default NewsForm;