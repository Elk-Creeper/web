import React, { useState } from 'react';
import Calendar from 'react-calendar';
import './calendar.css';

function MyCalendar() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState([]);

    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    const handleAddEvent = () => {
        const eventText = prompt('Enter event text:');
        if (eventText) {
            const newEvent = {
                date: selectedDate,
                text: eventText,
            };
            setEvents([...events, newEvent]);
        }
    };

    return (
        <div className='calendar'>
        <h2>My Calendar</h2>
            <Calendar
                onChange={handleDateChange}
                value={selectedDate}
            />
            <button onClick={handleAddEvent}>Add Event</button>

            <h3>Events:</h3>
            <ul>
                {events.map((event, index) => (
                    <li key={index}>
                        {event.date.toDateString()} - {event.text}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default MyCalendar;
