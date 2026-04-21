import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/sk';
import 'dayjs/locale/en';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';

const slugify = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string') {
    return `rgba(244, 63, 94, ${alpha})`;
  }

  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return `rgba(244, 63, 94, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
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
        ? `${dayName} ${date.format('D MMM YYYY, HH:mm')}`
        : `${dayName} ${date.format('D. M. YYYY, HH:mm')}`;
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
        <p className="text-gray-600 text-lg">{t?.activities?.loading || 'Loading activities...'}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
          >
            {t?.activities?.retry || 'Retry'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-emerald-50 py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-amber-200 bg-white/90 backdrop-blur p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {t?.activities?.title || 'Aktivity'}
            </h1>
            <button
              type="button"
              onClick={() => fetchData(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-700 transition"
            >
              <span>{refreshing ? '...' : '↻'}</span>
              <span>{t?.activities?.refresh || 'Refresh'}</span>
            </button>
          </div>

          <div className="mt-5 flex justify-center">
            <div className="inline-flex w-full sm:w-auto rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setAudience('children')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  audience === 'children'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t?.activities?.children || 'Pre deti'}
              </button>
              <button
                type="button"
                onClick={() => setAudience('adults')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  audience === 'adults'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t?.activities?.adults || 'Pre dospelych'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {types.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600">
              {t?.activities?.noActivities || 'No activities available for this audience right now.'}
            </div>
          )}

          {types.map((type) => {
            const typeDates = datesByTypeId.get(type.id) || [];
            const expanded = Boolean(expandedTypeIds[type.id]);

            return (
              <article
                key={type.id}
                className="rounded-2xl border bg-white shadow-sm overflow-hidden"
                style={{ borderColor: type.color_hex || '#f1f5f9' }}
              >
                <div className="flex items-start justify-between gap-4 p-4 sm:p-5 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        to={`/aktivity/${slugify(type.name)}`}
                        className="inline-flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight hover:opacity-80 transition"
                        style={{ color: type.color_hex || '#111827' }}
                      >
                        {type.name}
                      </Link>
                      <p className="mt-1 text-sm text-gray-600">
                        {t?.activities?.duration || 'Duration'}: {type.duration_minutes || 60} min
                        <span className="mx-2">|</span>
                        {t?.activities?.price || 'Price'}: {getPriceLabel(type)}
                      </p>
                      {type.description && (
                        <p className="mt-2 text-sm sm:text-base text-gray-700">{type.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleExpanded(type.id)}
                    className="shrink-0 rounded-full border border-gray-200 px-3 py-2 text-2xl leading-none text-gray-400 hover:border-gray-300 hover:text-gray-600 transition"
                    aria-expanded={expanded}
                    aria-label={expanded ? 'Collapse activity dates' : 'Expand activity dates'}
                  >
                    {expanded ? '−' : '+'}
                  </button>
                </div>

                <div className={`${expanded ? 'block' : 'hidden'} border-t border-gray-100 bg-gray-50/60 p-4 sm:p-5`}>
                  {typeDates.length === 0 && (
                    <p className="text-gray-600">
                      {t?.activities?.noDates || 'Momentalne nie je dostupny ziadny termin.'}
                    </p>
                  )}

                  {typeDates.length > 0 && (
                    <div className="max-w-2xl">
                      <h3 className="font-semibold text-gray-800 mb-3">
                        {t?.activities?.availableDates || 'Dostupne terminy'}
                      </h3>
                      <div className="space-y-3">
                        {typeDates.map((session) => (
                          <div
                            key={session.id}
                            className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
                            style={{
                              borderLeftWidth: '4px',
                              borderLeftColor: type.color_hex || '#f43f5e'
                            }}
                          >
                            <p className="font-semibold text-gray-900">{formatDate(session.training_date)}</p>
                            {session.theme && (
                              <div
                                className="mt-3 rounded-lg border px-3 py-2"
                                style={{
                                  borderColor: type.color_hex || '#fda4af',
                                  backgroundColor: hexToRgba(type.color_hex, 0.08)
                                }}
                              >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                                  {t?.activities?.theme || 'Tema'}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">{session.theme}</p>
                              </div>
                            )}
                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                              <button
                                type="button"
                                onClick={() => handleReserve(session, type)}
                                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
                              >
                                {t?.activities?.reserve || 'Rezervovat'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ActivityList;
