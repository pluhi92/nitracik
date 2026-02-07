import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';

const Archive = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const [isAdmin, setIsAdmin] = useState(false);
    const [archivedSessions, setArchivedSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    // State pre hierarchiu
    const [expandedYears, setExpandedYears] = useState({});
    const [expandedMonths, setExpandedMonths] = useState({});
    const [expandedTypes, setExpandedTypes] = useState({});

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const response = await api.get(`/api/users/${userId}`);
                setIsAdmin(response.data.role === 'admin' || localStorage.getItem('userRole') === 'admin');
            } catch (error) {
                console.error('Admin check failed:', error);
            }
        };

        const fetchArchivedSessions = async () => {
            try {
                const endpoint = isAdmin ? '/api/admin/archived-sessions' : `/api/archived-sessions/user/${userId}`;
                const response = await api.get(endpoint);
                setArchivedSessions(response.data);
            } catch (error) {
                console.error('Error fetching archived sessions:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            checkAdmin().then(() => {
                fetchArchivedSessions();
            });
        }
    }, [userId, isAdmin]);

    const formatSlovakDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        const dayOfWeek = date.getDay();
        const daysSK = ['NE', 'PO', 'UT', 'ST', 'ŠT', 'PI', 'SO'];

        return `${day}. ${month}. ${year} - ${hours}:${minutes} (${daysSK[dayOfWeek]})`;
    };

    const getMonthName = (monthNum) => {
        const months = [
            'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
            'Júl', 'August', 'September', 'Október', 'November', 'December'
        ];
        return months[monthNum - 1];
    };

    // Organizácia dát do hierarchie
    const organizeData = () => {
        const organized = {};

        archivedSessions.forEach(session => {
            const date = new Date(session.training_date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            if (!organized[year]) {
                organized[year] = {};
            }

            if (!organized[year][month]) {
                organized[year][month] = isAdmin ? {} : [];
            }

            if (isAdmin) {
                // Admin: organizuj podľa typu
                const type = session.training_type;
                if (!organized[year][month][type]) {
                    organized[year][month][type] = [];
                }
                organized[year][month][type].push(session);
            } else {
                // User: priamo pridaj session
                organized[year][month].push(session);
            }
        });

        return organized;
    };

    const toggleYear = (year) => {
        setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
    };

    const toggleMonth = (year, month) => {
        const key = `${year}-${month}`;
        setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleType = (year, month, type) => {
        const key = `${year}-${month}-${type}`;
        setExpandedTypes(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl mt-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-xl text-gray-600 dark:text-gray-400">
                        Načítavam archív...
                    </div>
                </div>
            </div>
        );
    }

    const organizedData = organizeData();
    const years = Object.keys(organizedData).sort((a, b) => b - a);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl mt-8">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">
                        📦 {t?.archive?.title || 'Archív hodín'}
                    </h2>
                    <button
                        onClick={() => navigate('/profile')}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        ← {t?.archive?.backToProfile || 'Späť na profil'}
                    </button>
                </div>
            </div>

            {/* Content */}
            {archivedSessions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        {t?.archive?.noSessions || 'Žiadne archivované hodiny.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <div className="p-6 space-y-2">
                        {years.map(year => (
                            <div key={year} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
                                {/* ROK */}
                                <button
                                    onClick={() => toggleYear(year)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`transform transition-transform duration-200 ${expandedYears[year] ? 'rotate-90' : ''}`}>
                                            ▶
                                        </span>
                                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                                            {year}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            ({Object.values(organizedData[year]).flat(2).length} {isAdmin ? 'sessions' : 'hodín'})
                                        </span>
                                    </div>
                                </button>

                                {/* MESIACE */}
                                {expandedYears[year] && (
                                    <div className="ml-8 space-y-2 pb-4">
                                        {Object.keys(organizedData[year]).sort((a, b) => b - a).map(month => (
                                            <div key={month}>
                                                <button
                                                    onClick={() => toggleMonth(year, month)}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`transform transition-transform duration-200 ${expandedMonths[`${year}-${month}`] ? 'rotate-90' : ''}`}>
                                                            ▶
                                                        </span>
                                                        <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                            {getMonthName(parseInt(month))}
                                                        </span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            ({isAdmin
                                                                ? Object.values(organizedData[year][month]).flat().length
                                                                : organizedData[year][month].length} {isAdmin ? 'sessions' : 'hodín'})
                                                        </span>
                                                    </div>
                                                </button>

                                                {/* OBSAH MESIACA */}
                                                {expandedMonths[`${year}-${month}`] && (
                                                    <div className="ml-8 space-y-2 pb-2">
                                                        {isAdmin ? (
                                                            // ADMIN VIEW: Typy sessionov
                                                            Object.keys(organizedData[year][month]).sort().map(type => (
                                                                <div key={type}>
                                                                    <button
                                                                        onClick={() => toggleType(year, month, type)}
                                                                        className="w-full flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`transform transition-transform duration-200 ${expandedTypes[`${year}-${month}-${type}`] ? 'rotate-90' : ''}`}>
                                                                                ▶
                                                                            </span>
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                                {type}
                                                                            </span>
                                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                                ({organizedData[year][month][type].length} sessions)
                                                                            </span>
                                                                        </div>
                                                                    </button>

                                                                    {/* ZOZNAM SESSIONOV PRE ADMIN */}
                                                                    {expandedTypes[`${year}-${month}-${type}`] && (
                                                                        <div className="ml-8 space-y-2 pb-2">
                                                                            {organizedData[year][month][type]
                                                                                .sort((a, b) => new Date(b.training_date) - new Date(a.training_date))
                                                                                .map(session => (
                                                                                    <div
                                                                                        key={session.training_id}
                                                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                                                                                    >
                                                                                        <div className="flex-1">
                                                                                            <div className="font-medium text-gray-900 dark:text-white">
                                                                                                {formatSlovakDate(session.training_date)}
                                                                                            </div>
                                                                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                                                {session.participant_count || 0} účastníkov | {session.total_children || 0} detí
                                                                                            </div>
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => navigate(`/admin/checklist/${session.training_id}`)}
                                                                                            className="ml-4 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                                                                                            title="Otvoriť Checklist"
                                                                                        >
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                                                            </svg>
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            // USER VIEW: Priamy zoznam sessionov
                                                            organizedData[year][month]
                                                                .sort((a, b) => new Date(b.training_date) - new Date(a.training_date))
                                                                .map(session => (
                                                                    <div
                                                                        key={session.booking_id}
                                                                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                                {session.training_type}
                                                                            </span>
                                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                                {formatSlovakDate(session.training_date)}
                                                                            </span>
                                                                        </div>
                                                                        {session.booking_type && (
                                                                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                                                {session.booking_type === 'paid' && '💰 Zaplatené'}
                                                                                {session.booking_type === 'credit' && '💳 Kredit'}
                                                                                {session.booking_type === 'season_ticket' && '🎫 Permanentka'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Archive;