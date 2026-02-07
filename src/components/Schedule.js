import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef(null);

  const fetchTrainingSessions = useCallback(async () => {
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
  }, [t?.schedule?.fetchError]);

  useEffect(() => {
    fetchTrainingSessions();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [fetchTrainingSessions]);

  const goToPreviousWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
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

  const formatDayName = (d) => d.toLocaleDateString('sk-SK', { weekday: 'short' });
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
      .map(session => {
        const startT = new Date(session.training_date);
        const duration = session.duration_minutes || 60;
        const endT = new Date(startT.getTime() + duration * 60 * 1000);

        return {
          ...session,
          startTime: startT,
          endTime: endT,
        };
      });
  };

  const handleBookingRedirect = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn && selectedSession) {
      navigate('/booking', {
        state: {
          incomingId: selectedSession.id,
          incomingTypeId: selectedSession.training_type_id,
          incomingType: selectedSession.training_type,
          incomingDate: dayjs(selectedSession.training_date).format('YYYY-MM-DD'),
          incomingTime: dayjs(selectedSession.training_date).format('HH:mm')
        }
      });
    } else {
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
        {/* MOBILE VIEW - ZOBRAZUJE SA LEN NA MOBILE */}
        <div className="lg:hidden flex-grow">
          <MobileSchedule
            trainingSessions={trainingSessions}
            getTrainingsForDay={getTrainingsForDay}
          />
        </div>

        {/* DESKTOP VIEW - ZOBRAZUJE SA LEN NA DESKTOPE */}
        <div className="hidden lg:block">
          {/* HEADER SECTION */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                {t?.schedule?.title || 'Tréningový rozvrh'}
              </h1>

              {/* Dynamická legenda v Schedule.js čerpajúca dáta z DB */}
              <div className="hidden md:flex flex-wrap justify-center gap-x-12 gap-y-4 mt-8 mb-6">
                {[...new Map(trainingSessions
                  .filter(s => s.active === true)
                  .map(s => [s.training_type, s])
                ).values()]
                  .sort((a, b) => a.training_type.localeCompare(b.training_type))
                  .map(session => (
                    <div key={session.training_type} className="flex items-center gap-3.5 px-3 py-1">
                      <span
                        className="w-5 h-5 rounded-full shadow-md border border-black"
                        style={{ backgroundColor: session.color_hex }}
                      ></span>
                      <span className="font-black text-gray-800 uppercase text-[15px] tracking-[0.15em]">
                        {session.training_type}
                      </span>
                    </div>
                  ))}
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
          </div>

          {/* DESKTOP CONTENT */}
          <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden flex-grow-0">
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

                        return trainings.map(t => {
                          const duration = t.duration_minutes || 60;
                          const dynamicHeight = `${duration - 2}px`;

                          return (
                            <div
                              key={t.id}
                              onClick={() => handleSessionClick(t)}
                              className={`absolute w-[92%] left-[4%] z-10 p-1.5 rounded-md text-xs pointer-events-auto cursor-pointer hover:scale-[1.02] transition-all shadow-md border-l-[5px] overflow-hidden flex flex-col justify-start 
                              ${selectedSession?.id === t.id ? 'ring-2 ring-blue-600 scale-[1.02]' : ''}`}
                              style={{
                                top: (() => {
                                  const [h, m] = slot.split(':').map(Number);
                                  return `${(h * 60) + (m === 30 ? 30 : 0)}px`;
                                })(),
                                height: dynamicHeight,
                                backgroundColor: `${t.color_hex}25`,
                                borderColor: t.color_hex,
                              }}
                            >
                              <div
                                className="font-extrabold text-[11px] uppercase tracking-wide opacity-90"
                                style={{ color: t.color_hex }}
                              >
                                {t.training_type}
                              </div>
                              <div className="font-bold text-sm mt-auto text-gray-900">
                                {dayjs(t.training_date).format('HH:mm')}
                                {` - ${dayjs(t.training_date).add(duration, 'minute').format('HH:mm')}`}
                              </div>
                            </div>
                          );
                        });
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
                  {selectedSession.training_type}
                </h4>

                {selectedSession.description && (
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed italic border-l-2 border-secondary-200 pl-3">
                    {selectedSession.description}
                  </p>
                )}

                <div className="flex flex-col mt-2">
                  <p className="text-gray-600 font-bold text-sm">
                    {dayjs(selectedSession.training_date).format('dddd | D. M. YYYY | HH:mm')}
                    <span className="ml-2 text-secondary-500 opacity-70">
                      ({selectedSession.duration_minutes || 60} min)
                    </span>
                  </p>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Štefánikova+trieda+148"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-600 text-xs font-semibold hover:underline mt-1 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Štefánikova trieda 148, 949 01 Nitra
                  </a>
                </div>
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
                  className="bg-secondary-800 text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.15em] hover:bg-black transition-all shadow-lg"
                >
                  Prihlásiť sa
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Schedule;