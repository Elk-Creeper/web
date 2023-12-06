import React, { useState, useEffect } from 'react';
import './news.css';
import Sidebar from "../components/sidebar";
import { FaSearch, FaPlus, FaEdit, FaTrashAlt, FaThumbsUp, FaThumbsDown, } from 'react-icons/fa';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, setDoc, doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import logo from '../assets/logo.png';
import notification from '../assets/icons/Notification.png';

const firebaseConfig = {
  apiKey: "AIzaSyAsIqHHA8727cGeTjr0dUQQmttqJ2nW_IE",
  authDomain: "muniserve-4dc11.firebaseapp.com",
  projectId: "muniserve-4dc11",
  storageBucket: "muniserve-4dc11.appspot.com",
  messagingSenderId: "874813480248",
  appId: "1:874813480248:web:edd1ff1f128b5bb4a2b5cd",
  measurementId: "G-LS66HXR3GT" // Your Firebase configuration
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentTime = serverTimestamp();

    if (editIndex !== null) {
      const newsId = submittedNews[editIndex].id;
      const newsRef = doc(firestore, 'news', newsId);
      await updateDoc(newsRef, { title, content, updatedAt: currentTime });
      setEditIndex(null);
    } else {
      const newsRef = collection(firestore, 'news');
      await addDoc(newsRef, { title, content, likes: 0, createdAt: currentTime });
    }

    setTitle('');
    setContent('');
    setIsFormVisible(false);
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

  const handleDelete = async (index) => {
    const newsId = submittedNews[index].id;
    const newsRef = doc(firestore, 'news', newsId);
    await deleteDoc(newsRef);
  };

  const handleLike = async (index) => {
    const newsId = submittedNews[index].id;
    const newsRef = doc(firestore, 'news', newsId);

    if (submittedNews[index].likedByCurrentUser) {
      // Unlike if already liked
      await updateDoc(newsRef, {
        likes: submittedNews[index].likes - 1,
        likedByCurrentUser: false,
      });
    } else {
      // Like if not liked
      await updateDoc(newsRef, {
        likes: submittedNews[index].likes + 1,
        likedByCurrentUser: true,
      });
    }
  };

  const MAX_CONTENT_LENGTH = 1000;

  const handleReadMore = (index) => {
    setExpandedContentIndex(index === expandedContentIndex ? null : index);
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
    setIsFormVisible(false);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <Sidebar />
      </div>

      <div className='container'>
        <div className="header">
          <div className='icons'>
            <h2>News</h2>
            <img src={notification} alt="Notification.png" className='notif-icon' />
            <img src={logo} alt="logo" className='account-img' />
            <div className='account-name'><h1>Admin</h1></div>
          </div>
        </div>

        <div className="search-containers">
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
              <option value="2031">2031</option>
              <option value="2030">2030</option>
              <option value="2029">2029</option>
              <option value="2028">2028</option>
              <option value="2027">2027</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
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
            <form onSubmit={handleSubmit} className="create">
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
              <button type="submit" className='submits'>{editIndex !== null ? 'Update' : 'Post'}</button>
            </form>
          </div>
        )}

        {!isFormVisible && (
        <div className="submitted-news-container">
          {filteredData.length > 0 ? (
            filteredData.map((news, index) => (
              <div key={index} className="news-item">
                <div className="title">
                  <img src={logo} alt="logo" className='logo' />
                  <h5>{news.title}</h5>
                  <h3>{news.createdAt?.seconds ? new Date(news.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown Date'}</h3>
                </div>
                <p>
                  {expandedContentIndex === index || news.content.length <= MAX_CONTENT_LENGTH
                    ? news.content
                    : `${news.content.slice(0, MAX_CONTENT_LENGTH)}... `}
                  {news.content.length > MAX_CONTENT_LENGTH && (
                    <a href="#" onClick={() => handleReadMore(index)}>
                      {expandedContentIndex === index ? 'Read Less' : 'Read More'}
                    </a>
                  )}
                </p>
                <div>
                  <button onClick={() => handleEdit(index)} className='icon-button' title='Edit News'>
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(index)} className='icon-button' title='Delete News'> 
                    <FaTrashAlt />
                  </button>
                  <button onClick={() => handleLike(index)} className='icon-button' title='Like or Unlike'>
                    {news.likes > 0 ? <FaThumbsDown /> : <FaThumbsUp />} ({news.likes || 0})
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
  );
};

export default NewsForm;