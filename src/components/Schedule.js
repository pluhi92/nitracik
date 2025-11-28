// Schedule.js – FINÁLNA VERZIA
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import InfiniteDays from './InfiniteDays';
import api from '../api/api';

const Schedule = () => {
  const { t } = useTranslation();
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrainingSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/training-dates');

      // Axios automaticky parsuje JSON do response.data
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
  }, [t]);

  // Navigácia týždňov
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

  const getMainMonthYear = () => {
    const middleDay = weekDays[3];
    return middleDay.toLocaleDateString('sk-SK', {
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, c => c.toUpperCase());
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let h = 7; h <= 20; h++) slots.push(`${h.toString().padStart(2, '0')}:00`);
    return slots;
  };

  const getTrainingForTimeSlot = (day, timeSlot) => {
    const [hour] = timeSlot.split(':');
    const start = new Date(day);
    start.setHours(parseInt(hour), 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return trainingSessions.filter(s => {
      const d = new Date(s.training_date);
      return d >= start && d < end && !s.cancelled;
    });
  };

  const getTrainingsForDay = (day) => {
    const start = new Date(day); start.setHours(0, 0, 0, 0);
    const end = new Date(day); end.setHours(23, 59, 59, 999);
    return trainingSessions
      .filter(s => {
        const d = new Date(s.training_date);
        return d >= start && d <= end && !s.cancelled;
      })
      .sort((a, b) => new Date(a.training_date) - new Date(b.training_date));
  };

  const formatDate = (d) => d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' });
  const formatDayName = (d) => d.toLocaleDateString('sk-SK', { weekday: 'short' });
  const formatFullDate = (d) => d.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatTime = (d) => new Date(d).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

  const getTrainingStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'mini': return 'bg-yellow-400 text-gray-900 border-yellow-500';
      case 'midi': return 'bg-green-500 text-white border-green-600';
      case 'maxi': return 'bg-blue-500 text-white border-blue-600';
      default: return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const isToday = (d) => d.toDateString() === new Date().toDateString();

  const weekDays = getWeekDays(currentWeek);
  const timeSlots = getTimeSlots();

  if (loading) return <div className="flex-grow flex items-center justify-center"><div className="text-lg text-gray-600">{t?.schedule?.loading || 'Načítavam...'}</div></div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}<button onClick={fetchTrainingSessions} className="block mx-auto mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">Skúsiť znova</button></div>;

  return (
    <div className="flex-grow bg-inherit py-6 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Hlavný nadpis */}
        <h1 className="text-center text-3xl font-bold text-secondary mb-6">
          {t?.schedule?.title || 'Tréningový rozvrh'}
        </h1>

        {/* Legenda */}
        <div className="flex flex-wrap justify-center gap-6 mb-4 p-4 bg-overlay-90 backdrop-blur-sm rounded-2xl shadow-sm">
          <div className="flex items-center gap-2"><div className="w-6 h-6 bg-yellow-400 rounded border-2 border-yellow-600"></div><span className="font-bold text-base">MINI</span></div>
          <div className="flex items-center gap-2"><div className="w-6 h-6 bg-green-500 rounded border-2 border-green-700"></div><span className="font-bold text-base">MIDI</span></div>
          <div className="flex items-center gap-2"><div className="w-6 h-6 bg-blue-500 rounded border-2 border-blue-700"></div><span className="font-bold text-base">MAXI</span></div>
        </div>

        {/* Šípky + mesiac/rok (mobile + desktop) */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <button
            onClick={goToPreviousWeek}
            className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-gray-200"
            aria-label="Predchádzajúci týždeň"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-secondary">{getMainMonthYear()}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {weekDays[0].toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })} –{' '}
              {weekDays[6].toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <button
            onClick={goToNextWeek}
            className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-gray-200"
            aria-label="Nasledujúci týždeň"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* InfiniteDays – len na mobile */}
        <div className="lg:hidden mb-6">
          <InfiniteDays
            selectedDay={selectedDay}
            onSelect={(d) => setSelectedDay(selectedDay?.toDateString() === d.toDateString() ? null : d)}
            targetWeek={weekDays[3]} // Posielame celý týždeň
          />
        </div>

        {/* MOBILE: Detail vybraného dňa */}
        <div className="lg:hidden">
          {selectedDay ? (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-5 flex justify-between items-center">
                <h2 className="text-xl font-bold">{formatFullDate(selectedDay)}</h2>
                <button onClick={() => setSelectedDay(null)} className="text-3xl font-light">×</button>
              </div>
              <div className="p-5 space-y-4">
                {getTrainingsForDay(selectedDay).length === 0 ? (
                  <p className="text-center py-10 text-gray-500 text-base italic">Žiadne tréningy na tento deň</p>
                ) : (
                  getTrainingsForDay(selectedDay).map(t => (
                    <div key={t.id} className={`p-5 rounded-2xl border-4 text-white font-bold ${getTrainingStyle(t.training_type)}`}>
                      <div className="text-xl">{t.training_type.toUpperCase()}</div>
                      <div className="text-3xl mt-1">{formatTime(t.training_date)}</div>
                      {t.location && <div className="mt-2 opacity-90">{t.location}</div>}
                      {t.description && <div className="mt-2 text-sm opacity-80">{t.description}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Ťuknite na deň v kalendári vyššie ↑</p>
            </div>
          )}
        </div>

        {/* DESKTOP: Pôvodný týždenný grid */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] auto-rows-[60px] text-sm">
            <div className="bg-gray-50 border-r border-b border-gray-200"></div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className={`bg-gray-50 border-r border-b last:border-r-0 p-2 text-center ${isToday(day) ? 'bg-blue-100' : ''}`}>
                <div className="text-xs uppercase text-gray-600 font-medium">{formatDayName(day)}</div>
                <div className={`text-lg font-bold ${isToday(day) ? 'text-blue-700' : 'text-gray-900'}`}>{formatDate(day)}</div>
              </div>
            ))}
            {timeSlots.map(slot => (
              <React.Fragment key={slot}>
                <div className="bg-gray-50 border-r border-b p-2 flex items-center justify-center text-xs font-medium text-gray-600">{slot}</div>
                {weekDays.map(day => {
                  const trainings = getTrainingForTimeSlot(day, slot);
                  return (
                    <div key={day.toISOString()} className={`border-r border-b last:border-r-0 p-1 min-h-[60px] ${isToday(day) ? 'bg-blue-50' : ''}`}>
                      {trainings.map(t => (
                        <div key={t.id} className={`h-full rounded-lg p-2 flex flex-col justify-center items-center text-center text-xs font-bold text-white border-2 ${getTrainingStyle(t.training_type)} hover:scale-105 transition`}>
                          <div>{t.training_type}</div>
                          <div className="text-xs opacity-90">{formatTime(t.training_date)}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Schedule;