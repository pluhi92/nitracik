import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/sk';
import 'dayjs/locale/en';
import api from '../api/api';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Tag, Calendar, ChevronRight, AlertCircle } from 'lucide-react';

const slugify = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const ActivityDetail = () => {
  const { type } = useParams();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentType, setCurrentType] = useState(null);
  const [dates, setDates] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [typesResponse, datesResponse] = await Promise.all([
          api.get('/api/training-types'),
          api.get('/api/training-dates')
        ]);

        const allTypes = Array.isArray(typesResponse.data) ? typesResponse.data : [];
        const allDates = Array.isArray(datesResponse.data) ? datesResponse.data : [];

        const idFromParam = Number(type);
        const selectedType = allTypes.find((item) => {
          if (Number.isFinite(idFromParam) && idFromParam > 0 && item.id === idFromParam) {
            return true;
          }
          return slugify(item.name) === type;
        });

        if (!selectedType) {
          setError(t?.activities?.notFound || 'Activity was not found.');
          return;
        }

        setCurrentType(selectedType);
        setDates(
          allDates
            .filter((item) => item.training_type_id === selectedType.id)
            .sort((a, b) => new Date(a.training_date) - new Date(b.training_date))
        );
      } catch (fetchError) {
        console.error('Error fetching activity detail:', fetchError);
        setError(t?.activities?.fetchError || 'Failed to load activity detail.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, t]);

  const priceLabel = useMemo(() => {
    const prices = Array.isArray(currentType?.prices) ? currentType.prices : [];
    const numericPrices = prices
      .map((item) => Number(item?.price))
      .filter((value) => Number.isFinite(value));

    if (numericPrices.length === 0) {
      return t?.activities?.priceOnRequest || 'Price on request';
    }
    if (numericPrices.length === 1) {
      return `${numericPrices[0]} EUR`;
    }
    return `${t?.activities?.from || 'From'} ${Math.min(...numericPrices)} EUR`;
  }, [currentType, t]);

  const formatDate = (value) => {
    const locale = language === 'en' ? 'en' : 'sk';
    const date = dayjs(value).locale(locale);
    const dayName = date.format('dddd').toUpperCase();
    return locale === 'en'
      ? `${date.format('D MMM YYYY, HH:mm')} | ${dayName}`
      : `${date.format('D. M. YYYY, HH:mm')} | ${dayName}`;
  };

  const handleReserve = (session) => {
    navigate('/booking', {
      state: {
        incomingId: session.id,
        incomingTypeId: session.training_type_id,
        incomingType: session.training_type,
        incomingDate: dayjs(session.training_date).format('YYYY-MM-DD'),
        incomingTime: dayjs(session.training_date).format('HH:mm'),
        incomingAgeGroup: currentType?.audience_type === 'adults' ? 'adult' : 'child',
        incomingLocked: true
      }
    });
  };

  if (loading) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="text-neutral-500 font-medium text-lg">Načítavam detail aktivity...</p>
      </section>
    );
  }

  if (error || !currentType) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white border border-neutral-200 rounded-[2rem] p-8 shadow-sm max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-foreground font-bold mb-6">{error || t?.activities?.notFound || 'Activity was not found.'}</p>
          <Link
            to="/aktivity"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-600 transition-all"
          >
            {t?.activities?.backToActivities || 'Back to activities'}
          </Link>
        </motion.div>
      </section>
    );
  }

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="min-h-screen py-12 md:py-16"
    >
      <div className="container-custom max-w-4xl mx-auto">
        <Link
          to="/aktivity"
          className="inline-flex items-center text-sm font-bold text-neutral-600 hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> {t?.activities?.backToActivities || 'Back to activities'}
        </Link>

        <article className="bg-white border border-neutral-200 rounded-[2rem] shadow-sm overflow-hidden">
          {/* Header */}
          <header className="p-8 sm:p-10 border-b border-neutral-100">
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
              style={{
                color: currentType.color_hex || 'inherit',
                WebkitTextStroke: '1px rgba(0,0,0,0.36)',
                textShadow: '0 0 1.2px rgba(0,0,0,0.12)'
              }}
            >
              {currentType.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-neutral-600 text-sm font-medium mb-6">
              <span className="inline-flex items-center bg-neutral-100 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4 mr-1.5 text-neutral-500" />
                {currentType.duration_minutes || 60} min
              </span>
              <span className="inline-flex items-center bg-neutral-100 px-3 py-1 rounded-full">
                <Tag className="w-4 h-4 mr-1.5 text-neutral-500" />
                {priceLabel}
              </span>
            </div>

            {currentType.description && (
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed text-justify">
                {currentType.description}
              </p>
            )}
          </header>

          {/* Available Dates Section */}
          <div className="p-8 sm:p-10 bg-neutral-50/50">
            <div className="max-w-xl mx-auto">
              <h2 className="text-2xl font-extrabold text-foreground mb-6 text-center">
                {t?.activities?.availableDates || 'Dostupné termíny'}
              </h2>

              {dates.length === 0 && (
                <div className="text-center py-8 bg-white border border-neutral-200 rounded-2xl p-6">
                  <Calendar className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                  <p className="text-neutral-600 font-medium">{t?.activities?.noDates || 'Momentálne nie je dostupný žiadny termín.'}</p>
                </div>
              )}

              {dates.length > 0 && (
                <div className="space-y-4">
                  {dates.map((session) => (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      whileHover={{ scale: 1.01 }}
                      key={session.id}
                      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-primary/50"
                      style={{
                        borderLeftWidth: '5px',
                        borderLeftColor: currentType.color_hex || 'hsl(38 72% 58%)'
                      }}
                    >
                      <div className="text-center sm:text-left">
                        <p className="font-extrabold text-foreground text-base sm:text-lg">
                          {formatDate(session.training_date)}
                        </p>
                        {session.theme && (
                          <div className="mt-1.5">
                            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block sm:inline mr-2">
                              {t?.activities?.theme || 'Téma'}:
                            </span>
                            <span className="text-sm font-semibold text-neutral-700">
                              {session.theme}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReserve(session)}
                        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-600 transition-all shrink-0"
                      >
                        {t?.activities?.reserve || 'Rezervovať'} <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </motion.section>
  );
};

export default ActivityDetail;