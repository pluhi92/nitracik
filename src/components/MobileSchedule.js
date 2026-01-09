import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/sk';
import { motion, AnimatePresence } from 'framer-motion';

// Nastavenie slovenčiny pre dayjs
dayjs.locale('sk');

const MobileSchedule = ({ trainingSessions, getTrainingsForDay }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewDate, setViewDate] = useState(dayjs());
  const [agendaSessions, setAgendaSessions] = useState([]);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

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

  const getCurrentWeekDays = () => {
    const days = [];
    const startOfWeek = viewDate.startOf('week');
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, 'day'));
    }
    return days;
  };

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

  const handleBookingRedirect = (session) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn && session) {
      navigate('/booking', {
        state: {
          incomingId: session.id, // PRIDANÉ: Posielame ID tréningu
          incomingType: session.training_type,
          incomingDate: dayjs(session.training_date).format('YYYY-MM-DD'),
          incomingTime: dayjs(session.training_date).format('HH:mm')
        }
      });
    } else {
      // Ak nie je prihlásený, presmerujeme na login a uložíme si cieľ
      navigate('/login', { state: { from: '/booking' } });
    }
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
        <button onClick={() => changeWeek(-1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">{formatMonthYear(viewDate)}</div>
          <div className="text-sm text-gray-500 font-medium">{getWeekInterval()}</div>
        </div>
        <button onClick={() => changeWeek(1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
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
              onClick={() => { setSelectedDate(date); setExpandedSessionId(null); }}
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 border-2
                ${isSelected
                  ? 'bg-secondary-800 border-secondary-800 text-white shadow-md'
                  : isToday
                    ? 'bg-secondary-50 border-secondary-500 text-white'
                    : containsTraining
                      ? 'bg-white border-secondary-400 text-gray-800'
                      : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-100'}`}
            >
              <span className={`text-xs font-medium ${isSelected || isToday ? 'text-white' : containsTraining ? 'text-secondary-600' : 'text-gray-400'}`}>
                {slovakDays[index].short}
              </span>
              <span className="text-lg font-bold mt-1">{date.date()}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <h3 className="font-bold text-gray-800 text-lg mb-2">{formatDate(selectedDate)}</h3>
      </div>

      <div className="space-y-4">
        {agendaSessions.length > 0 ? (
          agendaSessions.map((session, index) => {
            const isExpanded = expandedSessionId === session.id;
            const colors = getTypeColor(session.training_type);
            const startTime = dayjs(session.training_date);
            const endTime = session.endTime ? dayjs(session.endTime) : startTime.add(1, 'hour');
            const durationHours = endTime.diff(startTime, 'hours', true);

            return (
              <div key={session.id || index} className="space-y-2">
                <motion.div
                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-all cursor-pointer ${isExpanded ? 'border-secondary-500 ring-1 ring-secondary-500' : 'border-gray-200'}`}
                >
                  <div className="flex p-4">
                    {/* ČASOVÝ BLOK - SEM PRIDÁME DYNAMICKÚ DĹŽKU */}
                    <div className="w-20 pt-1 border-r border-gray-50 pr-2">
                      <div className={`text-lg font-bold ${colors.text}`}>
                        {startTime.format('HH:mm')}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        do {endTime.format('HH:mm')}
                      </div>
                      {/* Informácia o počte minút */}
                      <div className="text-[10px] text-secondary-500 font-bold mt-1 uppercase tracking-tighter">
                        {session.duration_minutes || 60} min
                      </div>
                    </div>

                    <div className="flex-1 ml-4 border-l pl-4 border-gray-100">
                      <h4 className="font-bold text-gray-800 text-lg">{session.training_type}</h4>
                      <div className="flex items-center justify-between mt-3">
                        {/* ZMENA: Adresa namiesto 'Hala' */}
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                          Štefánikova trieda 148
                        </span>
                        <span className="text-[10px] px-2 py-1 rounded-md bg-green-50 text-green-700 font-bold uppercase border border-green-100">Aktívny</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-secondary-50 rounded-xl p-4 border border-secondary-200 shadow-inner mx-1"
                    >
                      <p className="text-sm text-gray-700 mb-3 font-medium">Tu sa môžete prihlásiť na túto hodinu:</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBookingRedirect(session); }}
                        className="w-full bg-secondary-800 text-white py-3 rounded-lg font-bold shadow-md hover:bg-secondary-900 transition-colors uppercase text-sm tracking-wide"
                      >
                        Prihlásiť sa na hodinu
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="text-5xl mb-4">🗓️</div>
            <p className="font-bold text-gray-600 mb-1">Žiadne tréningy</p>
            <p className="text-sm text-gray-400">Na tento deň nie je nič naplánované.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSchedule;