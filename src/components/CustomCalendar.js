// src/components/CustomCalendar.js
import React, { useState, useEffect } from 'react';
import '../styles/components/Booking.css';

const CustomCalendar = ({ trainingDates, trainingType, selectedDate, onDateSelect, minDate = new Date() }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days
  useEffect(() => {
    generateCalendar();
  }, [currentDate, trainingDates, trainingType, selectedDate]);

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    // Last day of previous month
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayIndex = firstDay.getDay();
    const lastDayIndex = lastDay.getDay();
    const nextDays = 7 - lastDayIndex - 1;

    const days = [];

    // Previous month days
    for (let i = firstDayIndex; i > 0; i--) {
      const day = prevLastDay.getDate() - i + 1;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isAvailable: false,
        isSelected: false,
        isDisabled: true
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const formattedDate = date.toLocaleDateString('en-CA');
      const isToday = isSameDay(date, new Date());
      const isAvailable = trainingType && trainingDates[trainingType]?.[formattedDate];
      const isSelected = selectedDate && isSameDay(date, new Date(selectedDate));
      const isDisabled = date < minDate || !isAvailable;

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        isAvailable,
        isSelected,
        isDisabled
      });
    }

    // Next month days
    for (let i = 1; i <= nextDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isAvailable: false,
        isSelected: false,
        isDisabled: true
      });
    }

    setCalendarDays(days);
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const handleDateClick = (day) => {
    if (!day.isDisabled && day.isCurrentMonth && day.isAvailable) {
      const formattedDate = day.date.toLocaleDateString('en-CA');
      onDateSelect(formattedDate);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDayClassNames = (day) => {
    const classNames = ['calendar-day'];
    
    if (!day.isCurrentMonth) classNames.push('calendar-day-other-month');
    if (day.isToday) classNames.push('calendar-day-today');
    if (day.isAvailable && day.isCurrentMonth) classNames.push('calendar-day-available');
    if (day.isSelected) classNames.push('calendar-day-selected');
    if (day.isDisabled) classNames.push('calendar-day-disabled');
    
    return classNames.join(' ');
  };

  return (
    <div className="calendar-wrapper">
      <div className="calendar-header">
        <div className="calendar-logo">
          <img src="/plan3_transp.png" alt="Nitrācīk" className="logo-image" />
        </div>
        <div className="calendar-month-year">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
      </div>

      <div className="calendar-week-days">
        {weekdays.map(day => (
          <div key={day} className="week-day">{day}</div>
        ))}
      </div>

      <div className="calendar-days">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={getDayClassNames(day)}
            onClick={() => handleDateClick(day)}
          >
            {day.date.getDate()}
          </div>
        ))}
      </div>

      <div className="calendar-navigation">
        <button className="nav-button prev-button" onClick={goToPreviousMonth}>
          ‹
        </button>
        <div className="current-month">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        <button className="nav-button next-button" onClick={goToNextMonth}>
          ›
        </button>
      </div>
    </div>
  );
};

export default CustomCalendar;