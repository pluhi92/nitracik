// src/components/CustomCalendar.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import logo from '../assets/logo_bez.PNG';

const CustomCalendar = ({
  trainingDates,
  trainingType,
  selectedDate,
  onDateSelect,
  minDate = new Date(),
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [prevCalendarDays, setPrevCalendarDays] = useState([]);
  const [animationDirection, setAnimationDirection] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useTranslation();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const getTranslatedWeekday = (day) => {
    return t?.calendar?.[day.toLowerCase()] || day.slice(0, 2).toUpperCase();
  };

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

    // Predchádzajúci mesiac
    for (let i = firstDayIndex; i > 0; i--) {
      const day = prevLastDay.getDate() - i + 1;
      const date = new Date(year, month - 1, day);
      days.push(createDayObject(date, false));
    }

    // Aktuálny mesiac
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push(createDayObject(date, true));
    }

    // Nasledujúci mesiac – doplníme, aby bol grid vždy 42 dní (6 riadkov)
    const totalCells = 42;
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push(createDayObject(date, false));
    }

    setCalendarDays(days);
  };

  const createDayObject = (date, isCurrentMonth) => {
  const formattedDate = date.toLocaleDateString('en-CA');
  const isAvailable = trainingType && trainingDates[trainingType]?.[formattedDate];
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Opravená logika: dátum je disabled len ak je STRICTLY pred minDate (nie rovnaký deň)
  const isPastDate = date < minDate && !isSameDay(date, minDate);
  const disabled = isPastDate || !isAvailable;

  return {
    date,
    isCurrentMonth,
    isToday: isSameDay(date, new Date()),
    isAvailable,
    isSelected: selectedDate && isSameDay(date, new Date(selectedDate)),
    isDisabled: disabled,
    isWeekend,
    dayOfWeek,
  };
};

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const handleDateClick = (day) => {
    if (!day.isDisabled && day.isAvailable) {
      onDateSelect(day.date.toLocaleDateString('en-CA'));
    }
  };

  const switchMonth = (direction) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPrevCalendarDays(calendarDays);
    setAnimationDirection(direction);
    setTimeout(() => {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'down' ? 1 : -1), 1),
      );
      setAnimationDirection('');
      setPrevCalendarDays([]);
      setIsAnimating(false);
    }, 350);
  };

 const getDayClasses = (day, idx) => {
  let base = 'flex items-center justify-center text-sm font-medium aspect-square transition-all';

  // Kliknutý deň má vlastnú farbu
  if (day.isSelected) return `${base} bg-secondary-600 text-white font-bold shadow`;

  // Dnešok - čierny border + farebné pozadie podľa dostupnosti
  if (day.isToday) {
    if (day.isAvailable) {
      return `${base} bg-[#FFA000] border-2 !border-black text-white font-bold hover:bg-[#FF8F00] cursor-pointer`;
    }
    return `${base} bg-primary-50 border-2 !border-black text-primary-700 font-semibold`;
  }

  // Dostupný tréning – hover efekt tmavší
  if (day.isAvailable) return `${base} bg-secondary-500 text-white font-bold hover:bg-secondary-600 cursor-pointer`;

  // Víkendy – stále read-only, s vyšším kontrastom border
  if (day.isWeekend) return `${base} bg-gray-300 text-neutral-700 cursor-not-allowed opacity-50`;

  // Minulé alebo nedostupné dni
  if (day.isDisabled) return `${base} bg-muted text-muted cursor-not-allowed opacity-40`;

  // Dni mimo aktuálneho mesiaca
  if (!day.isCurrentMonth) return `${base} bg-muted opacity-40 cursor-not-allowed`;

  // Pracovné dni
  return `${base} bg-white text-neutral-800`;
};

  return (
    <div className="bg-card rounded-xl shadow-lg border-2 border-border overflow-hidden">
      {/* Header */}
      <div className="bg-card p-4 text-center border-b border-border">
        <img src={logo} alt="Nitrācīk" className="mx-auto mb-3 max-w-[120px]" />
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 bg-muted border-b border-border">
        {weekdays.map((day) => (
          <div key={day} className="py-2 text-xs font-bold text-secondary text-center uppercase">
            {getTranslatedWeekday(day)}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="relative overflow-hidden">
        <div
          className={`grid grid-cols-7 grid-rows-6 gap-0 
  divide-x divide-y divide-gray-400 border border-gray-400
  ${animationDirection === 'down'
              ? 'animate-slide-up'
              : animationDirection === 'up'
                ? 'animate-slide-down'
                : ''
            }`}


        >
          {(prevCalendarDays.length > 0 ? prevCalendarDays : calendarDays).map((day, idx) => (
            <button
              key={idx}
              onClick={() => handleDateClick(day)}
              disabled={day.isDisabled && !day.isAvailable}
              className={`${getDayClasses(day, idx)} p-0`}
            >
              {day.date.getDate()}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 bg-muted border-t border-border">
        <span className="font-semibold text-primary">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <div className="flex gap-2">
          <button
            className="p-2 w-10 h-10 border border-border rounded hover:bg-muted"
            onClick={() => switchMonth('up')}
            disabled={isAnimating}
          >
            <svg className="w-5 h-5 rotate-90" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>
          <button
            className="p-2 w-10 h-10 border border-border rounded hover:bg-muted"
            onClick={() => switchMonth('down')}
            disabled={isAnimating}
          >
            <svg className="w-5 h-5 rotate-90" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomCalendar;
