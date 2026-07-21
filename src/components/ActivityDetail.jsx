import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/sk';
import 'dayjs/locale/en';
import api from '../api/api';
import { useTranslation } from '../contexts/LanguageContext';

const slugify = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

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
        <p className="text-gray-600 text-lg">{t?.activities?.loading || 'Loading activities...'}</p>
      </section>
    );
  }

  if (error || !currentType) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{error || t?.activities?.notFound || 'Activity was not found.'}</p>
          <Link
            to="/aktivity"
            className="inline-block mt-4 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            {t?.activities?.backToActivities || 'Back to activities'}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-background py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/aktivity"
          className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 mb-5"
        >
          ← {t?.activities?.backToActivities || 'Back to activities'}
        </Link>

        <article className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: currentType.color_hex || '#f1f5f9' }}>
          <header className="p-4 sm:p-5 border-b border-gray-100">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{
                color: currentType.color_hex || '#111827',
                WebkitTextStroke: '0.35px #111827',
                textShadow: '-0.5px 0 #111827, 0 0.5px #111827, 0.5px 0 #111827, 0 -0.5px #111827'
              }}
            >
              {currentType.name}
            </h1>
            <p className="mt-2 text-gray-600">
              {t?.activities?.duration || 'Duration'}: {currentType.duration_minutes || 60} min
              <span className="mx-2">|</span>
              {t?.activities?.price || 'Price'}: {priceLabel}
            </p>
            {currentType.description && (
              <p className="mt-3 text-gray-700 leading-relaxed text-left sm:text-justify break-words [overflow-wrap:anywhere]">
                {currentType.description}
              </p>
            )}
          </header>

          <div className="p-4 sm:p-5 bg-gray-50/60">
            <div className="w-full max-w-md mx-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                {t?.activities?.availableDates || 'Dostupne terminy'}
              </h2>

              {dates.length === 0 && (
                <p className="text-gray-600">{t?.activities?.noDates || 'Momentalne nie je dostupny ziadny termin.'}</p>
              )}

              {dates.length > 0 && (
                <div className="space-y-3">
                  {dates.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: currentType.color_hex || '#f43f5e'
                      }}
                    >
                      <p className="font-semibold text-gray-900 text-center">{formatDate(session.training_date)}</p>
                      {session.theme && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 text-center sm:text-left">
                            {t?.activities?.theme || 'Tema'}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900 text-center sm:text-left">{session.theme}</p>
                        </div>
                      )}
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => handleReserve(session)}
                          className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
                        >
                          {t?.activities?.reserve || 'Rezervovat'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default ActivityDetail;
