import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Archive as ArchiveIcon, ArrowLeft, ChevronRight, 
  CalendarDays, ClipboardCheck, CreditCard, Ticket, Sparkles 
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

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
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center font-bold text-neutral-500 animate-pulse">
                    Načítavam archív...
                </div>
            </div>
        );
    }

    const organizedData = organizeData();
    const years = Object.keys(organizedData).sort((a, b) => b - a);

    return (
        <motion.section 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="py-12 md:py-16 container-custom max-w-7xl mx-auto px-4 sm:px-6 relative space-y-8"
        >
            {/* Header */}
            <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                            <ArchiveIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">
                                {t?.archive?.title || 'Archív hodín'}
                            </h2>
                            <p className="text-sm font-medium text-neutral-500 mt-1">
                                {isAdmin ? 'Kompletný archív všetkých predošlých tréningov' : 'Prehľad vašich absolvovaných hodín'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/profile')}
                        className="inline-flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t?.archive?.backToProfile || 'Späť na profil'}</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            {archivedSessions.length === 0 ? (
                <div className="bg-white rounded-[2rem] shadow-sm p-12 border border-neutral-200 text-center">
                    <CalendarDays className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500 font-bold text-lg">
                        {t?.archive?.noSessions || 'Žiadne archivované hodiny.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="p-6 sm:p-8 space-y-4">
                        {years.map(year => (
                            <div key={year} className="border-b border-neutral-100 last:border-0 pb-4 last:pb-0">
                                {/* ROK */}
                                <button
                                    onClick={() => toggleYear(year)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 rounded-2xl transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 transition-transform duration-300 ${expandedYears[year] ? 'rotate-90 bg-primary/10 text-primary' : ''}`}>
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                        <span className="text-xl font-black text-foreground">
                                            {year}
                                        </span>
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
                                            {Object.values(organizedData[year]).flat(2).length} {isAdmin ? 'sessions' : 'hodín'}
                                        </span>
                                    </div>
                                </button>

                                {/* MESIACE */}
                                <AnimatePresence>
                                    {expandedYears[year] && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="ml-4 sm:ml-8 space-y-3 pt-2"
                                        >
                                            {Object.keys(organizedData[year]).sort((a, b) => b - a).map(month => (
                                                <div key={month}>
                                                    <button
                                                        onClick={() => toggleMonth(year, month)}
                                                        className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 transition-transform duration-300 ${expandedMonths[`${year}-${month}`] ? 'rotate-90 bg-primary/10 text-primary' : ''}`}>
                                                                <ChevronRight className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-base font-extrabold text-foreground">
                                                                {getMonthName(parseInt(month))}
                                                            </span>
                                                            <span className="text-xs font-bold text-neutral-400">
                                                                ({isAdmin
                                                                    ? Object.values(organizedData[year][month]).flat().length
                                                                    : organizedData[year][month].length} {isAdmin ? 'sessions' : 'hodín'})
                                                            </span>
                                                        </div>
                                                    </button>

                                                    {/* OBSAH MESIACA */}
                                                    <AnimatePresence>
                                                        {expandedMonths[`${year}-${month}`] && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="ml-4 sm:ml-8 space-y-3 pt-2"
                                                            >
                                                                {isAdmin ? (
                                                                    // ADMIN VIEW: Typy sessionov
                                                                    Object.keys(organizedData[year][month]).sort().map(type => (
                                                                        <div key={type}>
                                                                            <button
                                                                                onClick={() => toggleType(year, month, type)}
                                                                                className="w-full flex items-center justify-between p-3 hover:bg-primary/5 rounded-xl transition-colors cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className={`w-6 h-6 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-500 transition-transform duration-300 ${expandedTypes[`${year}-${month}-${type}`] ? 'rotate-90 bg-primary/10 text-primary' : ''}`}>
                                                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                                                    </div>
                                                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                                                                        {type}
                                                                                    </span>
                                                                                    <span className="text-xs font-medium text-neutral-500">
                                                                                        ({organizedData[year][month][type].length} sessions)
                                                                                    </span>
                                                                                </div>
                                                                            </button>

                                                                            {/* ZOZNAM SESSIONOV PRE ADMIN */}
                                                                            <AnimatePresence>
                                                                                {expandedTypes[`${year}-${month}-${type}`] && (
                                                                                    <motion.div 
                                                                                        initial={{ opacity: 0, height: 0 }}
                                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                                        exit={{ opacity: 0, height: 0 }}
                                                                                        className="ml-4 sm:ml-8 space-y-2.5 pt-2 pb-2"
                                                                                    >
                                                                                        {organizedData[year][month][type]
                                                                                            .sort((a, b) => new Date(b.training_date) - new Date(a.training_date))
                                                                                            .map(session => (
                                                                                                <div
                                                                                                    key={session.training_id}
                                                                                                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-200 hover:border-primary/40 transition-all shadow-sm"
                                                                                                >
                                                                                                    <div className="flex-1">
                                                                                                        <div className="font-bold text-foreground text-sm sm:text-base">
                                                                                                            {formatSlovakDate(session.training_date)}
                                                                                                        </div>
                                                                                                        <div className="text-xs font-medium text-neutral-500 mt-1 flex items-center gap-2">
                                                                                                            <span>{session.participant_count || 0} účastníkov</span>
                                                                                                            <span>•</span>
                                                                                                            <span>{session.total_children || 0} detí</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <button
                                                                                                        onClick={() => navigate(`/admin/checklist/${session.training_id}`)}
                                                                                                        className="p-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 font-bold text-xs"
                                                                                                        title="Otvoriť Checklist"
                                                                                                    >
                                                                                                        <ClipboardCheck className="w-4 h-4" />
                                                                                                        <span className="hidden sm:inline">Checklist</span>
                                                                                                    </button>
                                                                                                </div>
                                                                                            ))}
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    // USER VIEW: Priamy zoznam sessionov
                                                                    organizedData[year][month]
                                                                        .sort((a, b) => new Date(b.training_date) - new Date(a.training_date))
                                                                        .map(session => (
                                                                            <div
                                                                                key={session.booking_id}
                                                                                className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                                                                        {session.training_type}
                                                                                    </span>
                                                                                    <span className="font-bold text-foreground text-sm sm:text-base">
                                                                                        {formatSlovakDate(session.training_date)}
                                                                                    </span>
                                                                                </div>
                                                                                {session.booking_type && (
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border ${
                                                                                            session.booking_type === 'paid' && session.amount_paid > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                                            session.booking_type === 'credit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                                            session.booking_type === 'season_ticket' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                                            'bg-neutral-100 text-neutral-600 border-neutral-200'
                                                                                        }`}>
                                                                                            {session.booking_type === 'paid' && session.amount_paid > 0 && <><CreditCard className="w-3.5 h-3.5" /> Zaplatené</>}
                                                                                            {session.booking_type === 'paid' && (!session.amount_paid || session.amount_paid === 0) && '⏳ Čakajúce'}
                                                                                            {session.booking_type === 'credit' && <><CreditCard className="w-3.5 h-3.5" /> Kredit</>}
                                                                                            {session.booking_type === 'season_ticket' && <><Ticket className="w-3.5 h-3.5" /> Permanentka</>}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.section>
    );
};

export default Archive;