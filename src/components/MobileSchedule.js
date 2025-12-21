import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/sk'; // Import slovenskej lokalizácie
import { motion } from 'framer-motion';

// Nastavenie slovenčiny pre dayjs
dayjs.locale('sk');

const MobileSchedule = ({ trainingSessions, getTrainingsForDay }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewDate, setViewDate] = useState(dayjs());
  const [agendaSessions, setAgendaSessions] = useState([]);

  // Opravené: Štvrtok s veľkým Š a slovenské názvy
  const slovakDays = [
    { short: 'Po', full: 'Pondelok' },
    { short: 'Ut', full: 'Utorok' },
    { short: 'St', full: 'Streda' },
    { short: 'Št', full: 'Štvrtok' },
    { short: 'Pi', full: 'Piatok' },
    { short: 'So', full: 'Sobota' },
    { short: 'Ne', full: 'Nedeľa' }
  ];

  const hasTraining = (date) => {
    if (!trainingSessions) return false;
    return trainingSessions.some(session => 
      dayjs(session.training_date).isSame(date, 'day') && !session.cancelled
    );
  };

  // OPRAVA DÁTUMOV: Získanie dní tak, aby Pondelok sedel s kalendárom
  const getCurrentWeekDays = () => {
    const days = [];
    // startOf('week') pri slovenskej lokalizácii vráti pondelok automaticky
    const startOfWeek = viewDate.startOf('week'); 
    
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, 'day'));
    }
    return days;
  };

  // OPRAVA FORMÁTU: "Utorok | 23. 12. 2025"
  const formatDate = (date) => {
    const dayName = date.format('dddd');
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    return `${capitalizedDay} | ${date.format('D. M. YYYY')}`;
  };

  const formatMonthYear = (date) => {
    const formatted = date.format('MMMM YYYY');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getWeekInterval = () => {
    const start = viewDate.startOf('week');
    const end = start.add(6, 'day');
    return `${start.format('D. M.')} - ${end.format('D. M.')}`;
  };

  useEffect(() => {
    if (trainingSessions && selectedDate) {
      const sessions = getTrainingsForDay(selectedDate.toDate());
      setAgendaSessions(sessions);
    }
  }, [selectedDate, trainingSessions, getTrainingsForDay]);

  const changeWeek = (direction) => {
    setViewDate(prev => prev.add(direction, 'week'));
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'mini': return { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800' };
      case 'midi': return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800' };
      case 'maxi': return { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800' };
      default: return { bg: 'bg-gray-100', border: 'border-gray-500', text: 'text-gray-800' };
    }
  };

  const weekDays = getCurrentWeekDays();

  return (
    <div className="min-h-screen bg-gray-50 pb-4 px-4">
      <div className="mb-4 pt-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Tréningový rozvrh</h1>
        <div className="text-sm text-gray-500">{dayjs().format('HH:mm')}</div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-white rounded-xl shadow-sm p-3">
        <button onClick={() => changeWeek(-1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">{formatMonthYear(viewDate)}</div>
          <div className="text-sm text-gray-500 font-medium">{getWeekInterval()}</div>
        </div>

        <button onClick={() => changeWeek(1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-6">
        {weekDays.map((date, index) => {
          const isSelected = date.isSame(selectedDate, 'day');
          const isToday = date.isSame(dayjs(), 'day');
          const containsTraining = hasTraining(date);
          
          return (
            <button
              key={index}
              onClick={() => setSelectedDate(date)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 border-2
                ${isSelected 
                  ? 'bg-secondary-800 border-secondary-800 text-white shadow-md' 
                  : isToday 
                    ? 'bg-secondary-500 border-secondary-500 text-white' 
                    : containsTraining
                      ? 'bg-white border-secondary-800 text-gray-800'
                      : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-100'}`}
            >
              <span className={`text-xs font-medium ${isSelected || isToday ? 'text-white' : containsTraining ? 'text-gray-800' : 'text-gray-400'}`}>
                {slovakDays[index].short}
              </span>
              <span className="text-lg font-bold mt-1">{date.date()}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <h3 className="font-bold text-gray-800 text-lg mb-2">
          {formatDate(selectedDate)}
        </h3>
      </div>

      <div className="space-y-3">
        {agendaSessions.length > 0 ? (
          agendaSessions.map((session, index) => {
            const colors = getTypeColor(session.training_type);
            const startTime = dayjs(session.startTime || session.training_date);
            const endTime = session.endTime ? dayjs(session.endTime) : startTime.add(1, 'hour');
            const durationHours = endTime.diff(startTime, 'hours', true);

            return (
              <motion.div
                key={session.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
              >
                <div className="flex p-4">
                  <div className="w-16 pt-1">
                    <div className={`text-lg font-bold ${colors.text}`}>{startTime.format('HH:mm')}</div>
                    <div className="text-xs text-gray-500 mt-1">{endTime.format('HH:mm')}</div>
                  </div>

                  <div className="flex-1 ml-4 border-l pl-4 border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{session.training_type} tréning</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600 font-medium">
                            {startTime.format('HH:mm')} - {endTime.format('HH:mm')}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${colors.bg} ${colors.text}`}>
                            {Math.round(durationHours * 10) / 10}h
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{session.location || 'Hala'}</span>
                        <span className="text-[10px] px-2 py-1 rounded-md bg-green-50 text-green-700 font-bold uppercase border border-green-100">Aktívny</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200"
          >
            <div className="text-5xl mb-4">🗓️</div>
            <p className="font-bold text-gray-600 mb-1">Žiadne tréningy</p>
            <p className="text-sm text-gray-400">Na tento deň nie je nič naplánované.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MobileSchedule;