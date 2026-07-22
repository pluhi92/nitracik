import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/sk';
import 'dayjs/locale/en';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Tag, RefreshCcw, ChevronDown, ChevronUp, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';

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

const ActivityList = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [audience, setAudience] = useState('children');
  const [types, setTypes] = useState([]);
  const [dates, setDates] = useState([]);
  const [expandedTypeIds, setExpandedTypeIds] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const formatDate = useCallback(
    (value) => {
      const locale = language === 'en' ? 'en' : 'sk';
      const date = dayjs(value).locale(locale);
      const dayName = date.format('dddd').toUpperCase();
      return locale === 'en'
        ? `${date.format('D MMM YYYY, HH:mm')} | ${dayName}`
        : `${date.format('D. M. YYYY, HH:mm')} | ${dayName}`;
    },
    [language]
  );

  const getPriceLabel = useCallback(
    (type) => {
      const prices = Array.isArray(type?.prices) ? type.prices : [];
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
    },
    [t]
  );

  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');
        const [typesResponse, datesResponse] = await Promise.all([
          api.get(`/api/training-types?audience=${audience}`),
          api.get('/api/training-dates')
        ]);

        const fetchedTypes = Array.isArray(typesResponse.data) ? typesResponse.data : [];
        const fetchedDates = Array.isArray(datesResponse.data) ? datesResponse.data : [];
        setTypes(fetchedTypes);
        setDates(fetchedDates);

        setExpandedTypeIds((prev) => {
          if (Object.keys(prev).length > 0) {
            return prev;
          }

          if (fetchedTypes[0]?.id) {
            return { [fetchedTypes[0].id]: true };
          }

          return {};
        });
      } catch (fetchError) {
        console.error('Error fetching activities:', fetchError);
        setError(t?.activities?.fetchError || 'Failed to load activities.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [audience, t]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setExpandedTypeIds({});
  }, [audience]);

  const datesByTypeId = useMemo(() => {
    const typeIds = new Set(types.map((type) => type.id));
    const map = new Map();

    dates.forEach((dateItem) => {
      if (!typeIds.has(dateItem.training_type_id)) {
        return;
      }

      const list = map.get(dateItem.training_type_id) || [];
      list.push(dateItem);
      list.sort((a, b) => new Date(a.training_date) - new Date(b.training_date));
      map.set(dateItem.training_type_id, list);
    });

    return map;
  }, [types, dates]);

  const handleToggleExpanded = (typeId) => {
    setExpandedTypeIds((prev) => ({
      ...prev,
      [typeId]: !prev[typeId]
    }));
  };

  const handleReserve = (session, type) => {
    navigate('/booking', {
      state: {
        incomingId: session.id,
        incomingTypeId: session.training_type_id,
        incomingType: session.training_type,
        incomingDate: dayjs(session.training_date).format('YYYY-MM-DD'),
        incomingTime: dayjs(session.training_date).format('HH:mm'),
        incomingAgeGroup: audience === 'adults' || type?.audience_type === 'adults' ? 'adult' : 'child',
        incomingLocked: true
      }
    });
  };

  if (loading) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="text-neutral-500 font-medium text-lg">{t?.activities?.loading || 'Načítavam aktivity...'}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white border border-neutral-200 rounded-[2rem] p-8 shadow-sm max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-foreground font-bold mb-6">{error}</p>
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-600 transition-all"
          >
            {t?.activities?.retry || 'Skúsiť znova'}
          </button>
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
      <div className="container-custom max-w-5xl mx-auto">
        {/* Header Banner */}
        <div className="mb-10 rounded-[2rem] border border-neutral-200 bg-white p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

          <div className="text-center relative z-10">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
              {t?.activities?.title || 'Aktivity'}
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              {t?.activities?.subtitle || 'Nájdite pre vás vyhovujúce aktivity a zarezervujte si termín.'}
            </p>
          </div>

          <div className="mt-6 flex justify-center items-center gap-3 relative z-10">
            <button
              type="button"
              onClick={() => fetchData(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 shadow-sm transition-all"
              aria-label={t?.activities?.refresh || 'Obnoviť'}
              title={t?.activities?.refresh || 'Obnoviť'}
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-6 flex justify-center relative z-10">
            <div className="inline-flex rounded-full bg-neutral-100 p-1.5 border border-neutral-200/60">
              <button
                type="button"
                onClick={() => setAudience('children')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  audience === 'children'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-neutral-500 hover:text-foreground'
                }`}
              >
                {t?.activities?.children || 'Pre deti'}
              </button>
              <button
                type="button"
                onClick={() => setAudience('adults')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  audience === 'adults'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-neutral-500 hover:text-foreground'
                }`}
              >
                {t?.activities?.adults || 'Pre dospelých'}
              </button>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-6">
          {types.length === 0 && (
            <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 text-center text-neutral-500 font-medium">
              {t?.activities?.noActivities || 'Momentálne nie sú dostupné žiadne aktivity.'}
            </div>
          )}

          {types.map((type) => {
            const typeDates = datesByTypeId.get(type.id)  || [];
            const expanded = Boolean(expandedTypeIds[type.id]);

            return (
              <motion.article
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-[2rem] border border-neutral-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md"
                style={{ borderLeftWidth: '6px', borderLeftColor: type.color_hex || '#f43f5e' }}
              >
                <div className="flex items-start justify-between gap-4 p-6 sm:p-8">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/aktivity/${slugify(type.name)}`}
                      className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-extrabold tracking-tight hover:opacity-80 transition-colors"
                      style={{
                        color: type.color_hex || 'inherit',
                        WebkitTextStroke: '1px rgba(0,0,0,0.36)',
                        textShadow: '0 0 1.2px rgba(0,0,0,0.12)'
                      }}
                    >
                      {type.name}
                    </Link>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-neutral-500 text-sm font-semibold">
                      <span className="inline-flex items-center bg-neutral-100 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 mr-1.5 text-neutral-400" />
                        {type.duration_minutes || 60} min
                      </span>
                      <span className="inline-flex items-center bg-neutral-100 px-3 py-1 rounded-full">
                        <Tag className="w-4 h-4 mr-1.5 text-neutral-400" />
                        {getPriceLabel(type)}
                      </span>
                    </div>
                    {type.description && (
                      <p className="mt-4 text-neutral-600 text-base leading-relaxed text-justify">
                        {type.description}
                      </p>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleToggleExpanded(type.id)}
                    className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-foreground transition-all"
                    aria-expanded={expanded}
                    aria-label={expanded ? 'Zbaliť termíny' : 'Rozbaliť termíny'}
                  >
                    {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="border-t border-neutral-100 bg-neutral-50/50 p-6 sm:p-8"
                    >
                      {typeDates.length === 0 && (
                        <p className="text-neutral-500 text-center font-medium py-4">
                          {t?.activities?.noDates || 'Momentálne nie je dostupný žiadny termín.'}
                        </p>
                      )}

                      {typeDates.length > 0 && (
                        <div className="w-full max-w-xl mx-auto">
                          <h3 className="font-extrabold text-foreground mb-4 text-center text-lg">
                            {t?.activities?.availableDates || 'Dostupné termíny'}
                          </h3>
                          <div className="space-y-3">
                            {typeDates.map((session) => (
                              <div
                                key={session.id}
                                className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
                                style={{
                                  borderLeftWidth: '4px',
                                  borderLeftColor: type.color_hex || '#f43f5e'
                                }}
                              >
                                <div className="text-center sm:text-left">
                                  <p className="font-extrabold text-foreground text-base">
                                    {formatDate(session.training_date)}
                                  </p>
                                  {session.theme && (
                                    <div className="mt-1">
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
                                  onClick={() => handleReserve(session, type)}
                                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-600 transition-all shrink-0"
                                >
                                  {t?.activities?.reserve || 'Rezervovať'} <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default ActivityList;