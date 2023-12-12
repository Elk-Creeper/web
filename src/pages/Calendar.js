import React, { useState } from 'react';
import './calendar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Calendar = () => {
    const currentDate = new Date();
    const [currentDateState, setCurrentDateState] = useState(currentDate);
    const [selectedDate, setSelectedDate] = useState(null);
    const [reminder, setReminder] = useState('');
    const [task, setTask] = useState('');
    const [entries, setEntries] = useState([]);

    const currentDay = currentDateState.getDate();
    const currentMonth = currentDateState.toLocaleString('default', { month: 'long' });
    const currentYear = currentDateState.getFullYear();
    const currentMonthNumber = currentDateState.getMonth();

    const daysInMonth = new Date(currentDateState.getFullYear(), currentDateState.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDateState.getFullYear(), currentDateState.getMonth(), 1);
    const startingDay = firstDayOfMonth.getDay();

    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handleDateClick = (day) => {
        setSelectedDate(day);
    };

    const handleReminderChange = (event) => {
        setReminder(event.target.value);
    };

    const handleTaskChange = (event) => {
        setTask(event.target.value);
    };

    const handleSetEntry = () => {
        if (selectedDate) {
            const newEntry = {
                date: new Date(currentYear, currentMonthNumber, selectedDate),
                reminder: reminder,
                task: task,
            };
            setEntries([...entries, newEntry]);
            setReminder('');
            setTask('');
        }
    };

    const handleDeleteEntry = (index) => {
        const updatedEntries = entries.filter((_, i) => i !== index);
        setEntries(updatedEntries);
    };

    for (let i = 0; i < startingDay; i++) {
        days.push(<div key={-i} className="empty"></div>);
    }


    const goToPreviousMonth = () => {
        const previousMonthDate = new Date(currentDateState);
        previousMonthDate.setMonth(currentDateState.getMonth() - 1);
        setCurrentDateState(previousMonthDate);
    };

    const goToNextMonth = () => {
        const nextMonthDate = new Date(currentDateState);
        nextMonthDate.setMonth(currentDateState.getMonth() + 1);
        setCurrentDateState(nextMonthDate);
    };

    // Inside the second loop that generates the days in the month
    // Inside the second loop that generates the days in the month
    for (let i = 1; i <= daysInMonth; i++) {
        const currentDateInLoop = new Date(currentYear, currentMonthNumber, i);
        const isCurrentMonth = currentDateInLoop.getMonth() === currentMonthNumber;
        const isSelectedMonth = currentDateInLoop.getMonth() === currentDateState.getMonth();

        days.push(
            <div
                key={i}
                onClick={() => handleDateClick(i)}
                className={`day ${isCurrentMonth && isSelectedMonth && i === currentDay ? 'current' : ''}`}
            >
                {i}
            </div>
        );
    }

    return (
        <div className="calendar">
            <div className="head">
                <div className="calendar-header">
                    <button onClick={goToPreviousMonth}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <button onClick={goToNextMonth}>
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            </div>
            <div className="month-name">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Fredoka&display=swap');
                </style>
                {currentMonth} {currentYear}
            </div>
            <div className="day-names">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Fredoka&display=swap');
                </style>
                {dayNames.map((day, index) => (
                    <div key={index} className="day-name">
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Fredoka&display=swap');
                        </style>
                        {day}
                    </div>
                ))}
            </div>
            <div className="calendar-grid">{days}</div>
            {selectedDate && (
                <div className="entry-input">
                    <input
                        type="text"
                        placeholder="Set a reminder"
                        value={reminder}
                        onChange={handleReminderChange}
                    />
                    <input type="text" placeholder="Add a task" value={task} onChange={handleTaskChange} />
                    <div className="save">
                        <button onClick={handleSetEntry}>Save</button>
                    </div>
                </div>
            )}
            <div className="entries">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Fredoka&display=swap');
                </style>
                <h3>Reminder:</h3>
                <ul>
                    {entries.map((entry, index) => (
                        <li key={index}>
                            {entry.date.toDateString()}: {entry.reminder} - {entry.task}
                            <div className="delete">
                                <button onClick={() => handleDeleteEntry(index)}>Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
export default Calendar;