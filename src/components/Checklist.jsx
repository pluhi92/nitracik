import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Printer, CheckCircle2, XCircle, 
  Users, CheckSquare, AlertTriangle, ShieldCheck, ShieldAlert 
} from 'lucide-react';
import api from '../api/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const Checklist = () => {
    const { trainingId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState({ participants: [], training: null });
    const [loading, setLoading] = useState(true);

    // Načítanie dát
    useEffect(() => {
        const fetchChecklist = async () => {
            try {
                const response = await api.get(`/api/admin/checklist/${trainingId}`);
                setData(response.data);
            } catch (error) {
                console.error('Error loading checklist:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChecklist();
    }, [trainingId]);

    // Funkcia na zmenu checkboxu (v DB stĺpec checked_in)
    const handleCheckInToggle = async (bookingId, currentStatus) => {
        const newStatus = !currentStatus;

        // Optimistický update UI
        setData(prevData => ({
            ...prevData,
            participants: prevData.participants.map(p =>
                p.booking_id === bookingId ? { ...p, checked_in: newStatus } : p
            )
        }));

        try {
            await api.put(`/api/admin/checklist/${bookingId}/toggle`, {
                checked_in: newStatus
            });
        } catch (error) {
            console.error('Failed to update check-in status', error);
            // Vrátenie späť pri chybe
            setData(prevData => ({
                ...prevData,
                participants: prevData.participants.map(p =>
                    p.booking_id === bookingId ? { ...p, checked_in: currentStatus } : p
                )
            }));
            alert('Nepodarilo sa uložiť zmenu.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center font-bold text-neutral-500 animate-pulse">
                    Načítavam checklist...
                </div>
            </div>
        );
    }

    const formattedDate = data.training
        ? (() => {
            const date = new Date(data.training.training_date);
            const datePart = new Intl.DateTimeFormat('sk-SK', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            }).format(date);
            const weekdayRaw = new Intl.DateTimeFormat('sk-SK', { weekday: 'long' }).format(date);
            const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
            const timePart = new Intl.DateTimeFormat('sk-SK', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(date);
            return `${datePart} - ${weekday} | ${timePart}`;
          })()
        : '';

    return (
        <motion.section 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="py-12 md:py-16 container-custom max-w-7xl mx-auto px-4 sm:px-6 relative"
        >
            <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-6 sm:p-10">
                
                {/* Horná lišta s tlačidlami */}
                <div className="flex justify-between items-center mb-8 no-print gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary font-bold transition-colors group cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Späť</span>
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="bg-primary hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:shadow-md flex items-center gap-2 cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Tlačiť Checklist</span>
                    </button>
                </div>

                {/* Hlavička checklistu */}
                <div className="checklist-header mb-4 border-b border-neutral-100 pb-4">
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight mb-2">
                        Prezenčná listina (Checklist)
                    </h2>
                    <h4 className="text-neutral-500 font-bold text-base sm:text-lg mb-2">
                        {data.training?.training_type} | {formattedDate}
                    </h4>
                    {data.training?.max_participants && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                            <Users className="w-3.5 h-3.5" />
                            Kapacita: {data.participants.length} / {data.training.max_participants}
                        </span>
                    )}
                </div>

                {/* Tabuľka */}
                <div className="overflow-x-auto rounded-2xl border border-neutral-200 shadow-sm">
                    <table className="min-w-full divide-y divide-neutral-200 text-sm">
                        <thead className="bg-neutral-900 text-white">
                            <tr>
                                <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider w-[50px]">#</th>
                                <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider">Meno</th>
                                <th className="px-4 py-3.5 text-center font-bold text-xs uppercase tracking-wider">Počet detí</th>
                                <th className="px-4 py-3.5 text-center font-bold text-xs uppercase tracking-wider">Sprievod</th>
                                <th className="px-4 py-3.5 text-center font-bold text-xs uppercase tracking-wider">Foto</th> 
                                <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider">Poznámka</th>
                                <th className="px-4 py-3.5 text-center font-bold text-xs uppercase tracking-wider">Typ platby</th>
                                <th className="px-4 py-3.5 text-center font-bold text-xs uppercase tracking-wider">CHECK</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                            {data.participants.length > 0 ? (
                                data.participants.map((p, index) => (
                                    <tr 
                                        key={p.booking_id}
                                        className={`transition-colors duration-200 align-middle ${p.checked_in ? "bg-emerald-50/70" : "hover:bg-neutral-50/50"}`}
                                    >
                                        <td className="px-4 py-4 font-bold text-neutral-400">{index + 1}</td>
                                        <td className="px-4 py-4 font-bold text-foreground">
                                            {p.first_name} {p.last_name}
                                        </td>
                                        
                                        {/* Deti + Vek */}
                                        <td className="px-4 py-4 text-center">
                                            <div className="font-bold text-base text-foreground">{p.number_of_children}</div>
                                            {p.children_ages && (
                                                <div className="text-neutral-400 text-xs mt-0.5">
                                                    ({p.children_ages})
                                                </div>
                                            )}
                                        </td>
                                        
                                        {/* Sprievod */}
                                        <td className="px-4 py-4 text-center">
                                            {p.accompanying_person ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                    ÁNO
                                                </span>
                                            ) : (
                                                <span className="text-neutral-300 font-medium">-</span>
                                            )}
                                        </td>

                                        {/* Foto súhlas */}
                                        <td className="px-4 py-4 text-center">
                                            {p.photo_consent ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Súhlasí s fotením">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Áno</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200" title="NESÚHLASÍ s fotením!">
                                                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                                                    <span>NIE</span>
                                                </span>
                                            )}
                                        </td>

                                        {/* Poznámka */}
                                        <td className="px-4 py-4">
                                            {p.note ? (
                                                <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded-md border border-red-100 inline-block">
                                                    {p.note}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-300 italic text-xs">-</span>
                                            )}
                                        </td>

                                        {/* Platba */}
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                p.payment_display === 'Platba' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                p.payment_display === 'Permanentka' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {p.payment_display}
                                            </span>
                                        </td>

                                        {/* Checkbox */}
                                        <td className="px-4 py-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 text-primary border-neutral-300 rounded focus:ring-primary cursor-pointer accent-primary" 
                                                checked={!!p.checked_in}
                                                onChange={() => handleCheckInToggle(p.booking_id, p.checked_in)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-neutral-400 font-medium">
                                        Žiadni účastníci na tento termín.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; }
                        .container-custom { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                        .bg-white { box-shadow: none !important; border: none !important; padding: 0 !important; }
                        h2 { font-size: 20px; }
                        .badge, span { border: 1px solid #ccc !important; color: black !important; }
                        tr.bg-emerald-50\\/70 td, .table-success td { background-color: #eee !important; }
                    }
                `}</style>
            </div>
        </motion.section>
    );
};

export default Checklist;