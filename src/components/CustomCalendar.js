// src/components/CustomCalendar.js
import React, { useState, useEffect } from 'react';
import '../styles/components/CustomCalendar.css';
import { useTranslation } from '../contexts/LanguageContext';

const CustomCalendar = ({ trainingDates, trainingType, selectedDate, onDateSelect, minDate = new Date() }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useTranslation();
  const [prevCalendarDays, setPrevCalendarDays] = useState([]);
  const [animationDirection, setAnimationDirection] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const getTranslatedWeekday = (day) => {
    const translations = {
      'MON': t?.calendar?.mon || 'PO',
      'TUE': t?.calendar?.tue || 'UT',
      'WED': t?.calendar?.wed || 'ST',
      'THU': t?.calendar?.thu || 'ŠT',
      'FRI': t?.calendar?.fri || 'PI',
      'SAT': t?.calendar?.sat || 'SO',
      'SUN': t?.calendar?.sun || 'NE'
    };
    return translations[day] || day;
  };

  // Generate calendar days
  useEffect(() => {
    generateCalendar();
  }, [currentDate, trainingDates, trainingType, selectedDate]);

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    let firstDayIndex = firstDay.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const days = [];

    // Previous month days
    for (let i = firstDayIndex; i > 0; i--) {
      const day = prevLastDay.getDate() - i + 1;
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const formattedDate = date.toLocaleDateString('en-CA');
      const isAvailable = trainingType && trainingDates[trainingType]?.[formattedDate];

      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isAvailable,
        isSelected: false,
        isDisabled: true,
        isWeekend
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
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
        isDisabled,
        isWeekend
      });
    }

    // Next month days
    const totalCells = 42;
    const nextDaysCount = totalCells - days.length;

    for (let i = 1; i <= nextDaysCount; i++) {
      const date = new Date(year, month + 1, i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const formattedDate = date.toLocaleDateString('en-CA');
      const isAvailable = trainingType && trainingDates[trainingType]?.[formattedDate];

      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isAvailable,
        isSelected: false,
        isDisabled: true,
        isWeekend
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

  const goToNextMonth = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPrevCalendarDays(calendarDays);
    setAnimationDirection('down');
    setTimeout(() => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
      setAnimationDirection('');
      setPrevCalendarDays([]);
      setIsAnimating(false);
    }, 450);
  };

  const goToPreviousMonth = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPrevCalendarDays(calendarDays);
    setAnimationDirection('up');
    setTimeout(() => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
      setAnimationDirection('');
      setPrevCalendarDays([]);
      setIsAnimating(false);
    }, 450);
  };

  const getDayClassNames = (day) => {
    const classNames = ['calendar-day'];

    if (!day.isCurrentMonth) classNames.push('calendar-day-other-month');
    if (day.isToday) classNames.push('calendar-day-today');

    if (day.isAvailable && day.isCurrentMonth) {
      classNames.push('calendar-day-available');
    } else {
      if (day.isSelected) classNames.push('calendar-day-selected');
      if (day.isDisabled) classNames.push('calendar-day-disabled');
      if (day.isWeekend) classNames.push('calendar-day-weekend');
    }

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
          <div key={day} className="week-day">
            {getTranslatedWeekday(day)}
          </div>
        ))}
      </div>

      <div className="calendar-container">
        {/* Only show one calendar at a time to prevent cutting off */}
        {prevCalendarDays.length > 0 ? (
          <div className={`calendar-content ${animationDirection === 'down' ? 'slide-out-down' : 'slide-out-up'}`}>
            <div className="calendar-days">
              {prevCalendarDays.map((day, idx) => (
                <div key={idx} className={getDayClassNames(day)}>
                  {day.date.getDate()}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`calendar-content ${animationDirection === 'down' ? 'slide-in-down' : animationDirection === 'up' ? 'slide-in-up' : ''}`}>
            <div className="calendar-days">
              {calendarDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={getDayClassNames(day)}
                  onClick={() => handleDateClick(day)}
                >
                  {day.date.getDate()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="calendar-navigation">
        <div className="current-month">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>

        <div className="nav-buttons-wrapper">
          <button className="nav-button up-button" onClick={goToPreviousMonth} disabled={isAnimating}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(90deg)' }}>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="nav-button down-button" onClick={goToNextMonth} disabled={isAnimating}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(90deg)' }}>
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomCalendar;