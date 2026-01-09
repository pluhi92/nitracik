import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'; // PRIDANÉ: useLayoutEffect
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import MobileSchedule from './MobileSchedule';
import api from '../api/api';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

const Schedule = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); // PRIDANÉ: Chýbajúca deklarácia
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef(null); // PRIDANÉ: Chýbajúci ref

  const fetchTrainingSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/training-dates');
      setTrainingSessions(response.data);
    } catch (err) {
      console.error('Error fetching training sessions:', err);
      setError(t?.schedule?.fetchError || 'Failed to load training schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingSessions();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [t]);

  const goToPreviousWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
    setSelectedDay(null);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
    setSelectedDay(null);
  };

  const getWeekDays = (date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getMainMonthYear = (weekDays) => {
    if (!weekDays || weekDays.length < 4) return '';
    const middleDay = weekDays[3];
    return middleDay.toLocaleDateString('sk-SK', {
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, c => c.toUpperCase());
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const getTrainingsForSlot = (day, timeSlot) => {
    const [hourStr, minuteStr] = timeSlot.split(':');
    const slotHour = parseInt(hourStr);
    const slotMinute = parseInt(minuteStr);

    const startOfSlot = new Date(day);
    startOfSlot.setHours(slotHour, slotMinute, 0, 0);

    const endOfSlot = new Date(startOfSlot);
    endOfSlot.setMinutes(endOfSlot.getMinutes() + 30);

    return trainingSessions.filter(s => {
      const trainingDate = new Date(s.training_date);
      return trainingDate >= startOfSlot && trainingDate < endOfSlot && !s.cancelled;
    });
  };

  const formatDate = (d) => d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' });
  const formatDayName = (d) => d.toLocaleDateString('sk-SK', { weekday: 'short' });
  const formatFullDate = (d) => d.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatTime = (d) => new Date(d).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

  const getTrainingStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'mini': return 'bg-yellow-100 text-yellow-900 border-l-4 border-yellow-500';
      case 'midi': return 'bg-green-100 text-green-900 border-l-4 border-green-500';
      case 'maxi': return 'bg-blue-100 text-blue-900 border-l-4 border-blue-500';
      default: return 'bg-gray-100 text-gray-900 border-l-4 border-gray-500';
    }
  };

  const isToday = (d) => d.toDateString() === new Date().toDateString();
  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

  const getCurrentTimePosition = () => {
    const now = currentTime;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const totalMinutes = 24 * 60;
    return (minutes / totalMinutes) * 100;
  };

  useLayoutEffect(() => {
    if (scrollRef.current && !loading) {
      const now = new Date();
      const totalMinutes = 24 * 60;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const container = scrollRef.current;
      const clientHeight = container.clientHeight;

      const headerOffset = 60;
      const timeOffset = (currentMinutes / totalMinutes) * 1440;

      const targetScroll = timeOffset + headerOffset - (clientHeight / 2);

      container.scrollTop = targetScroll > 0 ? targetScroll : 0;
    }
  }, [loading]);

  // Helper pre mobil - musí byť definovaný pred prvým použitím
  const getTrainingsForDay = (day) => {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    return trainingSessions
      .filter(s => {
        const d = new Date(s.training_date);
        return d >= start && d <= end && !s.cancelled;
      })
      .sort((a, b) => new Date(a.training_date) - new Date(b.training_date))
      .map(session => ({
        ...session,
        startTime: new Date(session.training_date),
        endTime: new Date(new Date(session.training_date).getTime() + 60 * 60 * 1000), // 1 hour default
      }));
  };

  const handleBookingRedirect = () => {
  // PRIDANÉ: Definujeme premennú isLoggedIn načítaním z localStorage
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (isLoggedIn && selectedSession) {
    navigate('/booking', {
      state: {
        incomingId: selectedSession.id,
        incomingType: selectedSession.training_type,
        incomingDate: dayjs(selectedSession.training_date).format('YYYY-MM-DD'),
        incomingTime: dayjs(selectedSession.training_date).format('HH:mm')
      }
    });
  } else {
    // Ak nie je prihlásený, pošleme ho na login a povieme aplikácii, 
    // že po prihlásení sa má vrátiť na booking
    navigate('/login', { state: { from: '/booking' } });
  }
};

  const handleSessionClick = (session) => {
    setSelectedSession(session);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-lg text-gray-600">{t?.schedule?.loading || 'Načítavam...'}</div></div>;
  if (error) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center py-10 text-red-600">{error}<button onClick={fetchTrainingSessions} className="block mx-auto mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">Skúsiť znova</button></div></div>;

  const weekDays = getWeekDays(currentWeek);
  const timeSlots = getTimeSlots();
  const mainMonthYear = getMainMonthYear(weekDays);

  return (
    <section className="min-h-screen bg-background py-8 md:py-12 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 w-full flex-grow flex flex-col">

        {/* HEADER SECTION - len pre desktop */}
        <div className="mb-6 hidden lg:block">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
              {t?.schedule?.title || 'Tréningový rozvrh'}
            </h1>

            <div className="hidden md:flex gap-4 text-sm">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-full border border-yellow-600"></span> <span className="font-medium text-gray-700">MINI</span></span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full border border-green-700"></span> <span className="font-medium text-gray-700">MIDI</span></span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full border border-blue-700"></span> <span className="font-medium text-gray-700">MAXI</span></span>
            </div>
          </div>

          {/* Navigation Controls - len pre desktop */}
          <div className="flex items-center justify-between md:justify-center gap-6 py-2">
            <button onClick={goToPreviousWeek} className="p-3 bg-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition border border-gray-100">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="text-center min-w-[200px]">
              <h2 className="text-2xl font-bold text-gray-800">{mainMonthYear}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {weekDays[0].getDate()}. – {weekDays[6].getDate()}. {weekDays[6].toLocaleDateString('sk-SK', { month: 'long' })}
              </p>
            </div>

            <button onClick={goToNextWeek} className="p-3 bg-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition border border-gray-100">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* MOBILE CONTENT - používa tvoj nový MobileSchedule */}
        <div className="lg:hidden flex-grow">
          <MobileSchedule
            trainingSessions={trainingSessions}
            getTrainingsForDay={getTrainingsForDay}
          />
        </div>

        {/* DESKTOP CONTENT */}
        <div className="hidden lg:block bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden flex-grow-0">
          <div
            ref={scrollRef}
            className="overflow-y-auto relative scroll-smooth"
            style={{ height: '600px' }}
          >
            {/* Sticky Days Header */}
            <div className="sticky top-0 z-30 bg-gray-50 grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-300 shadow-sm">
              <div className="p-3 border-r border-gray-300 bg-gray-50"></div>
              {weekDays.map(day => (
                <div
                  key={day.toISOString()}
                  className={`p-3 text-center border-r border-gray-200 last:border-r-0 
                        ${isToday(day) ? 'bg-blue-50/50' : isWeekend(day) ? 'bg-gray-100' : 'bg-gray-50'}`}
                >
                  <div className={`text-xs uppercase font-bold tracking-wider ${isToday(day) ? 'text-blue-700' : 'text-gray-500'}`}>
                    {formatDayName(day)}
                  </div>
                  <div className={`text-xl font-extrabold leading-none mt-1 ${isToday(day) ? 'text-blue-700' : 'text-gray-800'}`}>
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Grid Body */}
            <div className="relative min-h-[1440px] bg-white">

              {/* Grid Lines & Time Labels */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)]">
                {timeSlots.map((slot, index) => {
                  const isHour = slot.endsWith(':00');
                  const isHalfHour = slot.endsWith(':30');
                  const borderClass = isHalfHour ? 'border-b border-gray-300' : 'border-b border-gray-100';

                  return (
                    <React.Fragment key={slot}>
                      <div className={`border-r border-gray-300 text-right pr-3 py-1 text-xs font-bold text-gray-900 h-[30px] -mt-2.5 bg-gray-50 z-20`}>
                        {isHour ? slot : ''}
                      </div>

                      {weekDays.map(day => (
                        <div
                          key={`${day.toISOString()}-${slot}`}
                          className={`border-r border-gray-100 last:border-r-0 h-[30px] 
                                ${borderClass}
                                ${isToday(day) ? 'bg-blue-50/10' : isWeekend(day) ? 'bg-gray-50' : ''}`}
                        ></div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Events Layer */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none grid grid-cols-[60px_repeat(7,1fr)]">
                <div></div>
                {weekDays.map(day => (
                  <div key={`events-${day.toISOString()}`} className="relative h-full">
                    {timeSlots.map(slot => {
                      const trainings = getTrainingsForSlot(day, slot);
                      if (!trainings.length) return null;
                      return trainings.map(t => (
                        <div
                          key={t.id}
                          onClick={() => handleSessionClick(t)}
                          className={`absolute w-[92%] left-[4%] z-10 p-1.5 rounded-md text-xs pointer-events-auto cursor-pointer hover:scale-[1.02] transition-all shadow-md border-l-[5px] overflow-hidden flex flex-col justify-start 
                            ${getTrainingStyle(t.training_type)} 
                            ${selectedSession?.id === t.id ? 'ring-2 ring-blue-600 scale-[1.02]' : ''}`}
                          style={{
                            top: (() => {
                              const [h, m] = slot.split(':').map(Number);
                              return `${(h * 60) + (m === 30 ? 30 : 0)}px`;
                            })(),
                            height: '58px'
                          }}
                        >
                          <div className="font-extrabold text-[11px] uppercase tracking-wide opacity-80">
                            {t.training_type}
                          </div>
                          <div className="font-bold text-sm mt-auto">
                            {formatTime(t.training_date)}
                          </div>
                        </div>
                      ));
                    })}
                  </div>
                ))}
              </div>

              {/* Current Time Line */}
              <div className="absolute left-[60px] right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center" style={{ top: `${getCurrentTimePosition()}%` }}>
                <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRIDANÉ: DESKTOP ACTION BAR - Zobrazí sa naspodu po vybraní tréningu */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 100, x: '-50%', opacity: 0 }}
            className="fixed bottom-10 left-1/2 z-[100] bg-white shadow-2xl rounded-2xl p-6 border-2 border-secondary-500 flex items-center gap-10 min-w-[600px] hidden lg:flex"
          >
            <div className="flex-1">
              <h4 className="font-black text-secondary-800 text-xl uppercase italic leading-none">
                {selectedSession.training_type} Tréning
              </h4>
              <p className="text-gray-600 font-bold mt-2">
                {dayjs(selectedSession.training_date).format('dddd | D. M. YYYY | HH:mm')}
              </p>
            </div>

            <div className="flex gap-4 items-center">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 text-gray-400 font-bold hover:text-gray-800 transition-colors uppercase text-xs tracking-widest"
              >
                Zavrieť
              </button>
              <button
                onClick={handleBookingRedirect}
                className="bg-secondary-800 text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.15em] hover:bg-black transition-all shadow-lg text-sm"
              >
                Prihlásiť sa na hodinu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Schedule;