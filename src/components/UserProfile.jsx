import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { useTranslation } from '../contexts/LanguageContext';
import { Tooltip } from 'react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, XCircle, Zap, Trash2, 
  MapPin, Phone, ShieldAlert, FileText, 
  Ticket, CalendarDays, History, Archive, Gift,
  AlertTriangle, ChevronDown, CheckCircle, CreditCard, RefreshCw, ChevronUp,
  Mail
} from 'lucide-react';
import api from '../api/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const SpinnerIcon = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const UserProfile = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, [location]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [bookedSessions, setBookedSessions] = useState([]);
  const [seasonTickets, setSeasonTickets] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [adminSeasonTickets, setAdminSeasonTickets] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellationType, setCancellationType] = useState('');
  const [replacementSessions, setReplacementSessions] = useState([]);
  const [selectedReplacement, setSelectedReplacement] = useState('');
  const [bookingType, setBookingType] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminCancelModal, setShowAdminCancelModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [reason, setReason] = useState('');
  const [forceCancel, setForceCancel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showGcHistory, setShowGcHistory] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkEmailSession, setBulkEmailSession] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // --- SMART ADRESA LOGIKA ---
  const [addrCity, setAddrCity] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrNumber, setAddrNumber] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [hasNoStreet, setHasNoStreet] = useState(false);

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [isSearchingStreet, setIsSearchingStreet] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);

  const cityInputRef = useRef(null);
  const streetInputRef = useRef(null);
  const numberInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedAddress, setEditedAddress] = useState('');
  const [editedMobile, setEditedMobile] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateVariant, setUpdateVariant] = useState('success');

  const showAlert = (message, variant = 'success') => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setTimeout(() => setAlertMessage(''), 5000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await api.get(`/api/users/${userId}`);
        setIsAdmin(response.data.role === 'admin' || localStorage.getItem('userRole') === 'admin');
      } catch (error) {
        console.error('Admin check failed:', error);
      }
    };

    const fetchSeasonTickets = async () => {
      try {
        const response = await api.get(`/api/season-tickets/${userId}`);
        setSeasonTickets(response.data);
      } catch (error) {
        console.error('Error fetching season tickets:', error);
      }
    };

    const fetchGiftCards = async () => {
      try {
        const response = await api.get(`/api/gift-cards/user/${userId}`);
        setGiftCards(response.data);
      } catch (error) {
        console.error('Error fetching gift cards:', error);
      }
    };

    const fetchAdminSeasonTickets = async () => {
      try {
        const response = await api.get(`/api/admin/season-tickets`);
        setAdminSeasonTickets(response.data);
      } catch (error) {
        console.error('Error fetching admin season tickets:', error);
      }
    };

    if (userId) {
      checkAdmin();
      fetchSeasonTickets();
      fetchGiftCards();
      if (isAdmin) fetchAdminSeasonTickets();
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const endpoint = isAdmin ? '/api/admin/bookings' : `/api/bookings/user/${userId}`;
        const response = await api.get(endpoint);
        setBookedSessions(response.data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    if (userId) fetchBookings();
  }, [userId, isAdmin]);

  useEffect(() => {
    const currentDate = new Date().toISOString().split('T')[0];
    if (endDate && new Date(endDate) > new Date(currentDate)) {
      setIsButtonDisabled(true);
      setTooltipMessage(t?.profile?.tooltip?.futureDate?.replace('{date}', currentDate) || `This date is invalid because it is in the future. Please select a date up to ${currentDate}.`);
    } else {
      setIsButtonDisabled(false);
      setTooltipMessage('');
    }
  }, [endDate, t]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/api/users/${userId}`);
        const userData = response.data;
        setEditedAddress(userData.address || '');
        setEditedMobile(userData.mobile || '');
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    if (isEditing && editedAddress) {
      try {
        const parts = editedAddress.split(',');
        if (parts.length >= 2) {
          const part1 = parts[0].trim();
          const part2 = parts[1].trim();

          const streetMatch = part1.match(/^(.*)\s+(\S+)$/);
          if (streetMatch) {
            setAddrStreet(streetMatch[1]);
            setAddrNumber(streetMatch[2]);
          } else {
            setAddrStreet(part1);
          }

          const zipMatch = part2.match(/^(\d{3}\s?\d{2})\s+(.+)$/);
          if (zipMatch) {
            setAddrZip(zipMatch[1]);
            setAddrCity(zipMatch[2]);
          } else {
            setAddrCity(part2);
          }
        } else {
          setAddrStreet(editedAddress);
        }
      } catch (e) { console.error(e); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target)) setShowCityDropdown(false);
      if (streetInputRef.current && !streetInputRef.current.contains(event.target)) setShowStreetDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchCity = async (query) => {
    if (query.length < 2) return;
    setIsSearchingCity(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${query}&country=Slovakia&format=json&addressdetails=1&limit=5&accept-language=sk`);
      const data = await res.json();
      setCitySuggestions(data);
      setShowCityDropdown(true);
    } catch (err) { console.error(err); } finally { setIsSearchingCity(false); }
  };

  const searchStreet = async (query) => {
    if (query.length < 2 || !addrCity || hasNoStreet) return;
    setIsSearchingStreet(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?street=${query}&city=${addrCity}&country=Slovakia&format=json&addressdetails=1&limit=5&accept-language=sk`);
      const data = await res.json();
      setStreetSuggestions(data);
      setShowStreetDropdown(true);
    } catch (err) { console.error(err); } finally { setIsSearchingStreet(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (addrCity && showCityDropdown) searchCity(addrCity); }, 500);
    return () => clearTimeout(timer);
  }, [addrCity, showCityDropdown]);

  useEffect(() => {
    const timer = setTimeout(() => { if (addrStreet && showStreetDropdown && !hasNoStreet) searchStreet(addrStreet); }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addrStreet, hasNoStreet, showStreetDropdown]);

  const handleSelectCity = (city) => {
    const cityName = city.address.city || city.address.town || city.address.village || city.display_name.split(',')[0];
    setAddrCity(cityName);
    setAddrZip(city.address.postcode || '');
    setShowCityDropdown(false);
    if (hasNoStreet && numberInputRef.current) numberInputRef.current.focus();
    else if (streetInputRef.current) streetInputRef.current.focus();
  };

  const handleSelectStreet = (street) => {
    const streetName = street.address.road || street.display_name.split(',')[0];
    setAddrStreet(streetName);
    if (street.address.postcode) setAddrZip(street.address.postcode);
    setShowStreetDropdown(false);
    if (numberInputRef.current) numberInputRef.current.focus();
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    setUpdateMessage('');

    let fullAddress = '';
    if (hasNoStreet) {
      fullAddress = `${addrCity} ${addrNumber}, ${addrZip} ${addrCity}`;
    } else {
      fullAddress = `${addrStreet} ${addrNumber}, ${addrZip} ${addrCity}`;
    }

    try {
      await api.put(`/api/users/${userId}`, {
        address: fullAddress,
        mobile: editedMobile
      });

      setUpdateMessage(t?.profile?.update?.success || 'Profile updated successfully!');
      setUpdateVariant('success');
      setEditedAddress(fullAddress);
      setIsEditing(false);
    } catch (err) {
      setUpdateMessage(err.response?.data?.error || t?.profile?.update?.error?.generic || 'Failed to update profile');
      setUpdateVariant('danger');
    } finally {
      setIsUpdating(false);
    }
  };

  const processSessions = (data) => {
    if (!Array.isArray(data)) {
      console.error('Expected array but received:', data);
      return [];
    }
    const grouped = {};
    data.forEach((session) => {
      const key = `${session.training_date}-${session.training_type}`;
      if (!grouped[key]) {
        grouped[key] = {
          training_id: session.training_id,
          training_date: session.training_date,
          training_type: session.training_type,
          max_participants: session.max_participants,
          total_children: session.total_children || 0,
          available_spots: session.available_spots ?? session.max_participants,
          cancelled: session.cancelled,
          participants: [],
        };
      }
      if (session.user_id) {
        const isAdultParticipant = session.age_group === 'adult' || Number(session.number_of_adults || 0) > 0;
        grouped[key].participants.push({
          first_name: session.first_name,
          last_name: session.last_name,
          email: session.email,
          children: isAdultParticipant ? 0 : (session.number_of_children ?? 0),
          booking_type: session.booking_type || null,
          active: session.active,
          amount_paid: session.amount_paid || 0,
        });
      }
    });
    return Object.values(grouped);
  };

  const refreshBookings = async () => {
    try {
      const endpoint = isAdmin ? '/api/admin/bookings' : `/api/bookings/user/${userId}`;
      const response = await api.get(endpoint);
      setBookedSessions(response.data);
      console.log('[DEBUG] Bookings refreshed after cancellation');
    } catch (error) {
      console.error('Error refreshing sessions:', error);
    }
  };

  const formatSlovakDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const dayOfWeek = date.getDay();
    const daysSK = ['NE', 'PO', 'UT', 'ST', 'ŠT', 'PI', 'SO'];
    const daysEN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayName = t?.calendar ? t.calendar[daysEN[dayOfWeek].toLowerCase()] : daysSK[dayOfWeek];
    return `${day}. ${month}. ${year} - ${hours}:${minutes} (${dayName})`;
  };

  const processedAdminSessions = React.useMemo(() => processSessions(bookedSessions), [bookedSessions]);
  const availableSessionTypes = [...new Set(processedAdminSessions.map(session => session.training_type).filter(type => type))];

  const sortedSessionTypes = availableSessionTypes.sort((a, b) => {
    const priorityOrder = ['MINI', 'MIDI', 'MAXI'];
    const indexA = priorityOrder.indexOf(a);
    const indexB = priorityOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const currentDate = new Date();
  const activeTickets = seasonTickets.filter(ticket => ticket.entries_remaining > 0 && new Date(ticket.expiry_date) > currentDate);
  const historyTickets = seasonTickets.filter(ticket => ticket.entries_remaining === 0 || new Date(ticket.expiry_date) <= currentDate);

  const renderSessionTable = (type) => {
    const filtered = processSessions(bookedSessions)
      .filter((session) => session.training_type === type)
      .sort((a, b) => new Date(b.training_date) - new Date(a.training_date));

    if (filtered.length === 0) return null;

    return (
      <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 mb-8 overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
          <h4 className="text-xl font-extrabold text-foreground">
            {t?.profile?.sessionType?.[type.toLowerCase()] || `${type} Sessions`}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-white">
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.table?.date || 'Dátum'}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.table?.type || 'Typ'}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.table?.availableSpots || 'Miesta'}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.table?.participants || 'Účastníci'}</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.table?.children || 'Deti'}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.table?.actions || 'Akcie'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filtered.map((session, index) => {
                const sessionTime = new Date(session.training_date);
                const currentTime = new Date();
                const hoursDifference = (sessionTime - currentTime) / (1000 * 60 * 60);

                const isWithin10Hours = hoursDifference <= 10;
                const isCancelled = session.cancelled === true;
                const remainingBookings = session.participants.filter(p => p.active === true).length;
                const totalChildren = session.participants.reduce((sum, participant) => sum + participant.children, 0);

                const canChecklist = !isCancelled;
                const canCancel = !isCancelled && !isWithin10Hours;
                const canForceCancel = !isCancelled && isWithin10Hours;
                const canDelete = isCancelled && remainingBookings === 0;

                return (
                  <tr
                    key={`${session.training_id || 'session'}-${session.training_date || ''}-${session.training_type || ''}-${index}`}
                    className={`
                      ${isCancelled ? 'bg-neutral-50 text-neutral-400' : ''}
                      ${isWithin10Hours && !isCancelled ? 'bg-orange-50/30' : ''}
                      hover:bg-neutral-50 transition-colors
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-foreground">
                        {formatSlovakDate(session.training_date)}
                      </div>
                      {isCancelled && (
                        <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-100 mt-1.5">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> {t?.profile?.cancelled || 'CANCELLED'}
                        </div>
                      )}
                      {isWithin10Hours && !isCancelled && (
                        <div className="text-orange-600 text-xs font-bold mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> {Math.round(hoursDifference)} {t?.profile?.hoursUntilSession || 'h'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {session.training_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <span className={`font-black text-lg ${session.available_spots === 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {session.available_spots}
                        </span>
                        <div className="text-xs font-medium text-neutral-400">z {session.max_participants}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2 max-w-xs">
                        {session.participants.map((participant, index) => (
                          <div key={`${participant.email || 'participant'}-${participant.first_name || ''}-${participant.last_name || ''}-${index}`} className="bg-white border border-neutral-200 rounded-xl p-3 shadow-sm">
                            <div className="space-y-1">
                              <div className="font-bold text-foreground text-sm">{participant.first_name} {participant.last_name}</div>
                              <div className="text-xs text-neutral-500">{participant.email}</div>
                              <div className="flex flex-wrap gap-1.5 items-center mt-2">
                                <span className={`
                                  inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border
                                  ${participant.booking_type === 'credit'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : participant.booking_type === 'season_ticket'
                                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                      : participant.booking_type === 'gift_card'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : participant.booking_type === 'paid' && participant.active === false
                                          ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                          : participant.booking_type === 'paid' && (!participant.amount_paid || participant.amount_paid === 0)
                                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }
                                `}>
                                  {participant.booking_type === 'credit'
                                    ? 'Kredit'
                                    : participant.booking_type === 'season_ticket'
                                      ? 'Permanentka'
                                      : participant.booking_type === 'gift_card'
                                        ? '🎁 Zaplatená'
                                        : participant.booking_type === 'paid' && participant.active === false
                                          ? 'Zrušené'
                                          : participant.booking_type === 'paid' && (!participant.amount_paid || participant.amount_paid === 0)
                                            ? 'Čaká na platbu'
                                            : 'Zaplatená'}
                                </span>
                                {participant.amount_paid > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                    €{participant.amount_paid}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {session.participants.length === 0 && <div className="text-sm font-medium text-neutral-400 italic">Žiadni účastníci</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <span className="font-black text-lg text-primary">{totalChildren}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          disabled={!canChecklist}
                          className={`p-2 rounded-xl transition-all ${canChecklist
                            ? 'text-primary hover:bg-primary/10 cursor-pointer'
                            : 'text-neutral-300 cursor-not-allowed'
                            }`}
                          onClick={() => canChecklist && navigate(`/admin/checklist/${session.training_id}`)}
                          title={canChecklist ? "Otvoriť Checklist" : "Nedostupné (Zrušené)"}
                        >
                          <ClipboardCheck className="w-5 h-5" />
                        </button>

                        <button
                          disabled={!canCancel}
                          className={`p-2 rounded-xl transition-all ${canCancel
                            ? 'text-red-500 hover:bg-red-50 cursor-pointer'
                            : 'text-neutral-300 cursor-not-allowed'
                            }`}
                          onClick={() => canCancel && handleAdminCancelSession(session.training_id, session.training_type, session.training_date, false)}
                          title={canCancel ? (t?.profile?.cancelSession || "Cancel Session") : isWithin10Hours ? "Menej ako 10h (Použi Force Cancel)" : "Už zrušené"}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>

                        <button
                          disabled={!canForceCancel}
                          className={`p-2 rounded-xl transition-all ${canForceCancel
                            ? 'text-orange-500 hover:bg-orange-50 cursor-pointer'
                            : 'text-neutral-300 cursor-not-allowed'
                            }`}
                          onClick={() => canForceCancel && handleAdminCancelSession(session.training_id, session.training_type, session.training_date, true)}
                          title={canForceCancel ? "Force Cancel" : "Dostupné len 10h pred tréningom"}
                        >
                          <Zap className="w-5 h-5" />
                        </button>

                        {/* Bulk Email Button */}
                        <button
                          disabled={(session.participants || []).filter(p => p.active !== false).length === 0}
                          className={`p-2 rounded-xl transition-all ${
                            (session.participants || []).filter(p => p.active !== false).length > 0
                              ? 'text-blue-500 hover:bg-blue-50 cursor-pointer'
                              : 'text-neutral-300 cursor-not-allowed'
                          }`}
                          onClick={() => handleOpenBulkEmail(session)}
                          title={
                            (session.participants || []).filter(p => p.active !== false).length > 0
                              ? 'Poslať hromadný email účastníkom'
                              : 'Žiadni aktívni účastníci'
                          }
                        >
                          <Mail className="w-5 h-5" />
                        </button>

                        <button
                          disabled={!canDelete}
                          className={`p-2 rounded-xl transition-all ${canDelete
                            ? 'text-red-600 hover:bg-red-50 cursor-pointer'
                            : 'text-neutral-300 cursor-not-allowed'
                            }`}
                          onClick={() => canDelete && handleDeleteSession(session.training_id, session.training_type, session.training_date)}
                          title={canDelete ? "Delete Session" : isCancelled ? `Čakám na zrušenie ${remainingBookings} rezervácií` : "Session musí byť najprv zrušený"}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleAdminCancelSession = (id, type, date, useForceCancel = false) => {
    setSelectedSession({ id, type, date });
    setReason('');
    setForceCancel(useForceCancel);

    if (useForceCancel) {
      setShowAdminCancelModal(true);
    } else {
      const sessionTime = new Date(date);
      const currentTime = new Date();
      const hoursDifference = (sessionTime - currentTime) / (1000 * 60 * 60);

      if (hoursDifference <= 10) {
        if (window.confirm(`This session is in ${Math.round(hoursDifference)} hours. Do you want to force cancel?`)) {
          setForceCancel(true);
        } else {
          return;
        }
      }
      setShowAdminCancelModal(true);
    }
  };

  const handleOpenBulkEmail = (session) => {
    setBulkEmailSession(session);
    setEmailSubject('');
    setEmailMessage('');
    setShowBulkEmailModal(true);
  };

  const handleSendBulkEmail = async () => {
    if (!bulkEmailSession?.training_id || !emailSubject.trim() || !emailMessage.trim()) {
      showAlert('Vyplň predmet a správu pred odoslaním.', 'danger');
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await api.post('/api/admin/send-bulk-email', {
        trainingId: bulkEmailSession.training_id,
        subject: emailSubject,
        message: emailMessage,
      });
      setShowEmailConfirm(false);
      setShowBulkEmailModal(false);
      showAlert(`✅ Email odoslaný ${response.data.sent} účastníkom.`, 'success');
    } catch (err) {
      showAlert(err.response?.data?.error || 'Chyba pri odosielaní.', 'danger');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const confirmAdminCancel = async () => {
    try {
      const response = await api.post('/api/admin/cancel-session', {
        trainingId: selectedSession.id,
        reason,
        forceCancel
      });

      showAlert(`Session canceled successfully! ${response.data.canceledBookings} bookings affected.${response.data.forceCancelUsed ? ' (Force Cancel)' : ''}`, 'success');
      await refreshBookings();

    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to cancel session';

      if (errorMessage.includes('within 10 hours')) {
        if (window.confirm('Session is within 10 hours. Do you want to force cancel?')) {
          setForceCancel(true);
          await confirmAdminCancel();
          return;
        }
      } else {
        showAlert(errorMessage, 'danger');
      }
      console.error('Cancel session error:', error);
    } finally {
      setShowAdminCancelModal(false);
      setSelectedSession(null);
      setReason('');
      setForceCancel(false);
    }
  };

  const canCancelSession = (trainingDate) => {
    const now = new Date();
    const sessionTime = new Date(trainingDate);
    const hoursBeforeSession = (sessionTime - now) / (1000 * 60 * 60);
    return hoursBeforeSession > 10;
  };

  const handleCancelSession = async (bookingId, trainingDate) => {
    if (!canCancelSession(trainingDate)) {
      showAlert(t?.profile?.cancel?.alert || 'Cancellation is not allowed within 10 hours of the session.', 'danger');
      return;
    }

    setSelectedBooking({ bookingId, trainingDate });

    try {
      const response = await api.get(`/api/bookings/${bookingId}/type`);
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      if (!response.data.bookingType) {
        throw new Error('Booking type not returned');
      }
      setBookingType(response.data.bookingType);
    } catch (error) {
      console.error('Error fetching booking type:', error);
      showAlert(
        error.message || t?.profile?.cancel?.error?.generic || 'Failed to fetch booking details.',
        'danger'
      );
      setSelectedBooking(null);
      return;
    }

    try {
      const response = await api.get(`/api/replacement-sessions/${bookingId}`);
      setReplacementSessions(response.data);
    } catch (error) {
      console.error('Error fetching replacement sessions:', error);
      setReplacementSessions([]);
    }

    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    if (!selectedBooking) return;

    try {
      if (cancellationType === 'refund') {
        const response = await api.delete(
          `/api/bookings/${selectedBooking.bookingId}`
        );

        if (response.data.error) {
          showAlert(
            response.data.error || t?.profile?.cancel?.error?.generic || 'Failed to cancel booking.',
            'danger'
          );
        } else {
          let message = t?.profile?.cancel?.success || 'Session canceled successfully.';
          if (response.data.refundProcessed) {
            message += ` ${t?.profile?.cancel?.refundSuccess || 'Refund has been processed.'} Refund ID: ${response.data.refundId}.`;
          } else if (response.data.seasonTicketEntriesReturned > 0) {
            message += ` ${t?.profile?.cancel?.seasonTicketSuccess?.replace('{count}', response.data.seasonTicketEntriesReturned) || `${response.data.seasonTicketEntriesReturned} entries returned to your season ticket.`}`;
          } else if (response.data.creditReturned) {
            message += ` ${t?.profile?.cancel?.creditReturned || 'Your credit has been returned to your account.'}`;
          } else if (response.data.giftCardBalanceRestored) {
            message += ' Hodnota rezervácie bola vrátená na váš darčekový poukaz.';
          } else if (response.data.refundError) {
            message += ` ${t?.profile?.cancel?.refundFailed || 'Refund processing failed.'} ${response.data.refundError}`;
          }
          showAlert(message, response.data.refundError ? 'danger' : 'success');
        }

      } else if (cancellationType === 'credit') {
        const response = await api.delete(
          `/api/bookings/${selectedBooking.bookingId}`,
          {
            data: { requestCredit: true }
          }
        );

        if (response.data.error) {
          showAlert(
            response.data.error || 'Failed to issue credit.',
            'danger'
          );
        } else {
          const message = response.data.creditIssued
            ? (t?.profile?.cancel?.creditIssued || 'Credit has been added to your account and is ready to use!')
            : (t?.profile?.cancel?.creditReturned || 'Your credit has been returned to your account.');
          showAlert(message, 'success');
        }

      } else if (cancellationType === 'return') {
        const response = await api.delete(
          `/api/bookings/${selectedBooking.bookingId}`
        );

        if (response.data.error) {
          showAlert(response.data.error, 'danger');
        } else {
          const message = bookingType === 'season_ticket'
            ? (t?.profile?.cancel?.entryReturned || 'Entry has been returned to your season ticket.')
            : (t?.profile?.cancel?.creditReturned || 'Your credit has been returned to your account.');
          showAlert(message, 'success');
        }

      } else if (cancellationType === 'replacement' && selectedReplacement) {
        await api.post(
          `/api/replace-booking/${selectedBooking.bookingId}`,
          { newTrainingId: selectedReplacement }
        );
        showAlert(t?.profile?.cancel?.replacementSuccess || 'Session successfully replaced.', 'success');
      }

      const bookingsResponse = await api.get(`/api/bookings/user/${userId}`);
      setBookedSessions(bookingsResponse.data);

    } catch (error) {
      console.error('Error processing cancellation:', error);
      if (error.response?.data?.error?.includes('10 hours')) {
        showAlert('Cancellation is not allowed within 10 hours of the session.', 'danger');
      } else {
        showAlert(
          error.response?.data?.error || t?.profile?.cancel?.error?.generic || 'Failed to process cancellation.',
          'danger'
        );
      }
    } finally {
      setShowCancelModal(false);
      setSelectedBooking(null);
      setReplacementSessions([]);
      setSelectedReplacement('');
      setCancellationType('');
      setBookingType('');
    }
  };

  const handleDeleteSession = async (trainingId, trainingType, trainingDate) => {
    if (!window.confirm(`Are you sure you want to permanently delete the ${trainingType} session on ${new Date(trainingDate).toLocaleString()}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.delete(
        `/api/admin/training-sessions/${trainingId}`
      );
      showAlert(response.data.message || 'Session deleted successfully!', 'success');
      await refreshBookings();
    } catch (error) {
      console.error('Error deleting session:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete session';
      showAlert(errorMessage, 'danger');
    }
  };

  const handleDeleteAccount = async () => {
    setShowPasswordModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!password) {
      setError(t?.profile?.delete?.error?.required || 'Please enter a password');
      return;
    }

    setIsDeleting(true);
    try {
      const verifyResponse = await api.post('/api/verify-password', { password });

      if (verifyResponse.data.success) {
        await api.delete(`/api/users/${userId}`);
        localStorage.removeItem('userId');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole'); 
        window.location.href = '/account-deleted';
      } else {
        setError(t?.profile?.delete?.error?.incorrect || 'Incorrect password');
      }
    } catch (err) {
      setError(err.response?.data?.error || t?.profile?.delete?.error?.generic || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowPasswordModal(false);
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      showAlert(t?.profile?.report?.error?.required || 'Please fill in both dates.', 'danger');
      return;
    }

    try {
      const response = await api.post(
        '/api/admin/payment-report',
        { startDate, endDate },
        { responseType: 'arraybuffer' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment_report_${startDate}_to_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating report:', error);
      showAlert(t?.profile?.report?.error?.generic || 'Failed to generate payment report. Check console for details.', 'danger');
    }
  };

  const now = new Date();
  const visibleSessions = bookedSessions.filter(session => {
    const sessionStart = new Date(session.training_date);
    const hideAfter = new Date(sessionStart.getTime() + 1 * 60 * 60 * 1000);
    return now < hideAfter;
  });

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-16 container-custom max-w-7xl mx-auto px-4 sm:px-6 relative space-y-8"
    >
      {/* Alert Banner */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-2xl p-5 border shadow-sm flex items-start gap-3 ${
              alertVariant === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              alertVariant === 'danger' ? 'bg-red-50 text-red-800 border-red-200' :
              'bg-blue-50 text-blue-800 border-blue-200'
            }`} 
            role="alert"
          >
            {alertVariant === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />}
            {alertVariant === 'danger' && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />}
            <span className="font-medium text-sm sm:text-base">{alertMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hlavný nadpis */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-black text-foreground uppercase tracking-tight">
          {t?.profile?.title || 'Nastavenia účtu'}
        </h2>
      </div>

      {isAdmin ? (
        <div className="space-y-8">
          {/* Administrátorské Tabuľky Tréningov */}
          {sortedSessionTypes.length > 0 ? (
            sortedSessionTypes.map((type) => (
              <React.Fragment key={type}>
                {renderSessionTable(type)}
              </React.Fragment>
            ))
          ) : (
            <div className="bg-white rounded-[2rem] border border-neutral-200 p-12 text-center shadow-sm">
              <CalendarDays className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 font-bold">
                Žiadne tréningy na zobrazenie.
              </p>
            </div>
          )}

          {/* Administrátorské Permanentky */}
          <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-neutral-200 overflow-hidden">
            <h3 className="text-2xl font-extrabold text-foreground mb-6 flex items-center gap-3">
              <Ticket className="w-6 h-6 text-primary" />
              {t?.profile?.seasonTickets?.title || 'Držitelia permanentiek'}
            </h3>
            
            {adminSeasonTickets.length === 0 ? (
              <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                <p className="text-neutral-500 font-bold">
                  {t?.profile?.seasonTickets?.noTickets || 'Zatiaľ nikto nemá zakúpenú permanentku.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.seasonTickets?.name || 'Name'}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.seasonTickets?.email || 'Email'}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.seasonTickets?.type || 'Typ'}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.seasonTickets?.totalEntries || 'Celkovo'}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.seasonTickets?.remainingEntries || 'Zostatok'}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.seasonTickets?.expiryDate || 'Platnosť do'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {adminSeasonTickets.map((ticket, index) => (
                      <tr key={`${ticket.id || 'ticket'}-${ticket.email || ''}-${index}`} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground">
                          {ticket.first_name} {ticket.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {ticket.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                            {ticket.product_name || ticket.product_code || ticket.training_type_name || ticket.training_type || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-500">
                          {ticket.entries_total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticket.entries_remaining > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {ticket.entries_remaining}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 font-medium">
                          {formatSlovakDate(ticket.expiry_date).split(' - ')[0]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TLAČIDLO ARCHÍV (Admin) */}
          <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-neutral-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Archive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-foreground mb-1">
                    {t?.archive?.title || 'Archív hodín'}
                  </h3>
                  <p className="text-sm font-medium text-neutral-500">
                    {t?.archive?.description || 'Zobraziť uskutočnené tréningy z minulosti'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/archive')}
                className="w-full sm:w-auto bg-primary hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {t?.archive?.open || 'Otvoriť archív'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // ================== USER ČASŤ (Nový dizajn) ==================
        <>
          <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-neutral-200 mb-8">
            <h3 className="text-2xl font-extrabold text-foreground mb-6 flex items-center gap-3">
              <Ticket className="w-6 h-6 text-primary" />
              {t?.profile?.mySeasonTickets?.title || 'Vaše permanentky'}
            </h3>

            {/* 1. AKTÍVNE PERMANENTKY */}
            {activeTickets.length === 0 ? (
              <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
                <Ticket className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 font-bold mb-4">
                  {t?.profile?.mySeasonTickets?.noTickets || 'Nemáte žiadne aktívne permanentky.'}
                </p>
                <button
                  onClick={() => navigate('/season-tickets')}
                  className="bg-secondary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-secondary-600 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  Kúpiť novú permanentku
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm mb-4">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.mySeasonTickets?.type || 'Typ'}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.mySeasonTickets?.entriesTotal || 'Vstupy'}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.mySeasonTickets?.entriesRemaining || 'Zostatok'}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.mySeasonTickets?.purchaseDate || 'Kúpené'}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">{t?.profile?.mySeasonTickets?.expiryDate || 'Platnosť do'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {activeTickets.map((ticket, index) => (
                      <tr key={`${ticket.id || 'ticket'}-${ticket.purchase_date || ''}-${index}`} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-foreground text-sm">
                            {ticket.product_name || ticket.product_code || ticket.training_type_name || ticket.training_type || '-'}
                          </div>
                          {ticket.training_types && ticket.training_types.length > 0 && (
                            <div className="text-xs font-medium text-neutral-400 mt-1">
                              {ticket.training_types.map((type) => type.name).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-500">
                          {ticket.entries_total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 py-1 px-3 rounded-full text-xs font-bold">
                            {ticket.entries_remaining}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-500">
                          {formatSlovakDate(ticket.purchase_date).split(' - ')[0]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-500">
                          {formatSlovakDate(ticket.expiry_date).split(' - ')[0]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. HISTÓRIA / VYČERPANÉ */}
            {historyTickets.length > 0 && (
              <div className="mt-8 pt-6 border-t border-neutral-100">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-neutral-400 hover:text-primary font-bold text-sm transition-colors mb-4 group"
                >
                  <History className="w-4 h-4" />
                  {showHistory ? 'Skryť históriu permanentiek' : `Zobraziť históriu / Vyčerpané permanentky (${historyTickets.length})`}
                  <ChevronDown className={`w-4 h-4 transform transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="overflow-x-auto rounded-xl border border-neutral-200">
                        <table className="min-w-full divide-y divide-neutral-200">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-neutral-400 uppercase">Typ</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-neutral-400 uppercase">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-neutral-400 uppercase">Dátum nákupu</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-neutral-100">
                            {historyTickets.map((ticket, index) => (
                              <tr key={`${ticket.id || 'ticket'}-${ticket.purchase_date || ''}-${index}`} className="opacity-75 hover:opacity-100 transition-opacity">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-bold text-sm text-neutral-600">
                                    {ticket.product_name || ticket.product_code || ticket.training_type_name || ticket.training_type || '-'}
                                  </div>
                                  {ticket.training_types && ticket.training_types.length > 0 && (
                                    <div className="text-xs font-medium text-neutral-400 mt-1">
                                      {ticket.training_types.map((type) => type.name).join(', ')}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {ticket.entries_remaining === 0 ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                                      Vyčerpaná
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                                      Expirovaná
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-500">
                                  {formatSlovakDate(ticket.purchase_date).split(' - ')[0]}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {giftCards.length > 0 && (() => {
            const activeGiftCards = giftCards.filter(gc => 
              gc.status === 'active' && new Date(gc.expiresAt) > new Date() && gc.balance > 0
            );
            const historyGiftCards = giftCards.filter(gc => 
              gc.status === 'used' || gc.balance <= 0 || new Date(gc.expiresAt) <= new Date()
            );

            return (
              <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-neutral-200 mb-8">
                <h3 className="text-2xl font-extrabold text-foreground mb-6 flex items-center gap-3">
                  <Gift className="w-6 h-6 text-amber-500" />
                  Darčekové poukazy
                </h3>

                {activeGiftCards.length === 0 ? (
                  <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
                    <Gift className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 font-bold">Nemáte žiadne aktívne darčekové poukazy.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {activeGiftCards.map((gc, index) => (
                      <div key={gc.id || index} className="bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-xs font-black tracking-widest text-amber-700 bg-white border border-amber-200 rounded-lg px-2 py-1">
                            {gc.code}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400 text-white">
                            Aktívny
                          </span>
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-500 font-medium">Využité:</span>
                            <span className="font-bold text-foreground">
                              {(parseFloat(gc.amount) - parseFloat(gc.balance)).toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500 font-medium">Zostatok:</span>
                            <span className="font-black text-amber-700 text-base">
                              {parseFloat(gc.balance).toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-amber-200 mt-1.5">
                            <span className="text-neutral-400 font-medium text-xs">Platné do:</span>
                            <span className="font-bold text-xs text-neutral-600">
                              {new Date(gc.expiresAt).toLocaleDateString('sk-SK', { 
                                day: '2-digit', month: '2-digit', year: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {historyGiftCards.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <button
                      onClick={() => setShowGcHistory(!showGcHistory)}
                      className="flex items-center gap-2 text-neutral-400 hover:text-primary font-bold text-sm transition-colors mb-4"
                    >
                      <History className="w-4 h-4" />
                      {showGcHistory 
                        ? 'Skryť archív poukazov' 
                        : `Zobraziť vyčerpané / expirované poukazy (${historyGiftCards.length})`}
                      <ChevronDown className={`w-4 h-4 transform transition-transform duration-300 ${showGcHistory ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showGcHistory && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {historyGiftCards.map((gc, index) => (
                              <div key={gc.id || index} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 opacity-70">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-mono text-xs font-black tracking-widest text-neutral-500">
                                    {gc.code}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    gc.balance <= 0 || gc.status === 'used'
                                      ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                      : 'bg-red-50 text-red-600 border-red-100'
                                  }`}>
                                    {gc.balance <= 0 || gc.status === 'used' ? 'Vyčerpaný' : 'Expirovaný'}
                                  </span>
                                </div>
                                <div className="text-xs text-neutral-500 font-medium">
                                  Hodnota: {parseFloat(gc.amount).toFixed(2)} €
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })()}

          {/* VAŠE REZERVOVANÉ RELÁCIE */}
          <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-neutral-200 mb-8">
            <h3 className="text-2xl font-extrabold text-foreground mb-6 flex items-center gap-3">
              <CalendarDays className="w-6 h-6 text-primary" />
              {t?.profile?.bookedSessions?.title || 'Vaše rezervované relácie'}
            </h3>
            
            {bookedSessions.length === 0 ? (
              <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
                <CalendarDays className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 font-bold">
                  {t?.profile?.bookedSessions?.noSessions || 'Nemáte žiadne rezervované relácie.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleSessions.map((session, index) => {
                  const isCancelled = session.cancelled === true;
                  const canCancel = !isCancelled && canCancelSession(session.training_date);

                  const getBookingTypeInfo = () => {
                    if (session.booking_type === 'credit') {
                      return { type: 'credit', label: t?.profile?.bookingMethods?.credit || 'Kredit', icon: <CreditCard className="w-3.5 h-3.5"/>, badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
                    }
                    if (session.booking_type === 'season_ticket') {
                      return { type: 'season_ticket', label: t?.profile?.bookingMethods?.season_ticket || 'Permanentka', icon: <Ticket className="w-3.5 h-3.5"/>, badgeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
                    }
                    if (session.booking_type === 'gift_card') {
                      return { type: 'gift_card', label: '🎁 Zaplatená', icon: null, badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
                    }
                    if (session.booking_type === 'paid' && session.amount_paid && session.amount_paid > 0) {
                      return { type: 'paid', label: t?.profile?.bookingMethods?.paid || 'Zaplatené', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                    }
                    if (session.booking_type === 'paid' && (!session.amount_paid || session.amount_paid === 0)) {
                      return { type: 'pending', label: t?.profile?.bookingMethods?.pending || 'Čaká sa na platbu', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' };
                    }
                    return { type: 'unknown', label: t?.profile?.bookingMethods?.reservation || 'Rezervácia', badgeClass: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
                  };

                  const bookingTypeInfo = getBookingTypeInfo();

                  return (
                    <div
                      key={`${session.booking_id || 'booking'}-${session.training_date || ''}-${index}`}
                      className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border ${isCancelled
                        ? 'bg-neutral-50 border-neutral-200'
                        : 'bg-white border-neutral-200 shadow-sm hover:border-primary/30 transition-colors'
                        }`}
                    >
                      <div className="flex-1 mb-4 md:mb-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <strong className={`text-lg font-black uppercase ${isCancelled ? 'text-neutral-400' : 'text-foreground'}`}>
                            {session.training_type}
                          </strong>
                          <span className={`text-sm font-medium ${isCancelled ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {formatSlovakDate(session.training_date)}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${isCancelled ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : bookingTypeInfo.badgeClass}`}>
                            {bookingTypeInfo.icon} {bookingTypeInfo.label}
                          </span>
                        </div>
                        {session.theme && (
                          <div className="inline-flex items-center px-3 py-1 bg-neutral-100 rounded-lg">
                            <span className="text-neutral-600 font-bold text-xs uppercase tracking-wider">
                              Téma: {session.theme}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div
                        data-tooltip-id="cancel-tooltip"
                        data-tooltip-content={
                          isCancelled
                            ? 'Táto relácia bola zrušená administrátorom. Skontrolujte svoj email pre informácie o vrátení platby/kreditu.'
                            : !canCancel
                              ? t?.profile?.cancel?.tooltip || 'Zrušenie už nie je možné, do relácie zostáva menej ako 10 hodín.'
                              : ''
                        }
                        className="flex-shrink-0 w-full md:w-auto"
                      >
                        <button
                          className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isCancelled || !canCancel
                            ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                            : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600'
                            }`}
                          onClick={() => handleCancelSession(session.booking_id, session.training_date, session.training_type)}
                          disabled={isCancelled || !canCancel}
                        >
                          <XCircle className="w-4 h-4" />
                          {isCancelled ? t?.profile?.cancelled || 'Zrušené' : t?.profile?.cancel?.button || 'Zrušiť reláciu'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Tooltip id="cancel-tooltip" place="top" effect="solid" className="rounded-lg !bg-neutral-800 !text-white font-medium text-xs px-3 py-2 shadow-xl" />
          </div>

          {/* PROFILOVÉ INFORMÁCIE (Smart Adresa) */}
          <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-neutral-200 mb-8">
            <h3 className="text-2xl font-extrabold text-foreground mb-6 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-primary" />
              {t?.profile?.info?.title || 'Profilové informácie'}
            </h3>

            <AnimatePresence>
              {updateMessage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-xl p-4 mb-6 border font-medium text-sm flex items-start gap-3 ${updateVariant === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {updateVariant === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                  <span className="mt-0.5">{updateMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-neutral-50 rounded-2xl p-6 md:p-8 border border-neutral-100">
              {!isEditing ? (
                // VIEW MODE
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h5 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {t?.profile?.info?.address || 'Address'}
                    </h5>
                    <p className="text-lg font-bold text-foreground">
                      {editedAddress || <span className="text-neutral-400 font-medium italic">{t?.profile?.info?.noAddress || 'No address provided'}</span>}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {t?.profile?.info?.mobile || 'Mobile Number'}
                    </h5>
                    <p className="text-lg font-bold text-foreground">
                      {editedMobile || <span className="text-neutral-400 font-medium italic">{t?.profile?.info?.noMobile || 'No mobile number provided'}</span>}
                    </p>
                  </div>
                  <div className="md:col-span-2 pt-4 border-t border-neutral-200">
                    <button
                      className="bg-primary hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
                      onClick={() => setIsEditing(true)}
                    >
                      {t?.profile?.info?.editButton || 'Edit Profile Information'}
                    </button>
                  </div>
                </div>
              ) : (
                // EDIT MODE (SMART ADRESA)
                <div className="space-y-5">
                  <div className="relative" ref={cityInputRef}>
                    <label className="block text-sm font-bold text-foreground mb-1.5">
                      Mesto / Obec *
                    </label>
                    <input
                      type="text"
                      value={addrCity}
                      onChange={(e) => { setAddrCity(e.target.value); setShowCityDropdown(true); }}
                      onFocus={() => setShowCityDropdown(true)}
                      className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground font-medium"
                      placeholder="Napr. Nitra"
                    />
                    {isSearchingCity && <div className="absolute right-4 top-10"><SpinnerIcon className="w-5 h-5 text-primary" /></div>}
                    {showCityDropdown && citySuggestions.length > 0 && (
                      <ul className="absolute z-50 w-full bg-white border border-neutral-200 rounded-xl shadow-xl max-h-60 overflow-y-auto mt-2 py-1">
                        {citySuggestions.map((city, idx) => (
                          <li key={city.place_id || idx} onClick={() => handleSelectCity(city)} className="px-4 py-3 hover:bg-primary/5 cursor-pointer text-sm font-medium text-neutral-700 border-b border-neutral-50 last:border-0">
                            {city.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="relative" ref={streetInputRef}>
                    <label className="block text-sm font-bold text-foreground mb-1.5">
                      Ulica *
                    </label>
                    <input
                      type="text"
                      value={addrStreet}
                      onChange={(e) => { setAddrStreet(e.target.value); setShowStreetDropdown(true); }}
                      onFocus={() => !hasNoStreet && setShowStreetDropdown(true)}
                      disabled={!addrCity || hasNoStreet}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-medium
                          ${hasNoStreet ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200' : 'bg-white border-neutral-300 text-foreground'}`}
                      placeholder={hasNoStreet ? 'Obec nemá ulice' : (addrCity ? `Ulica v ${addrCity}` : "Najprv vyberte mesto")}
                    />
                    {isSearchingStreet && !hasNoStreet && <div className="absolute right-4 top-10"><SpinnerIcon className="w-5 h-5 text-primary" /></div>}
                    {showStreetDropdown && streetSuggestions.length > 0 && !hasNoStreet && (
                      <ul className="absolute z-50 w-full bg-white border border-neutral-200 rounded-xl shadow-xl max-h-60 overflow-y-auto mt-2 py-1">
                        {streetSuggestions.map((street, idx) => (
                          <li key={street.place_id || idx} onClick={() => handleSelectStreet(street)} className="px-4 py-3 hover:bg-primary/5 cursor-pointer text-sm font-medium text-neutral-700 border-b border-neutral-50 last:border-0">
                            {street.display_name.split(',')[0]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-center gap-3 bg-white p-3 border border-neutral-200 rounded-xl">
                    <input
                      type="checkbox"
                      id="noStreetProfile"
                      checked={hasNoStreet}
                      onChange={(e) => {
                        setHasNoStreet(e.target.checked);
                        if (e.target.checked) setAddrStreet('');
                      }}
                      className="w-5 h-5 text-primary border-neutral-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="noStreetProfile" className="text-sm font-bold text-neutral-700 cursor-pointer select-none">
                      Obec nemá ulice (použiť len číslo domu)
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-bold text-foreground mb-1.5">Číslo *</label>
                      <input
                        ref={numberInputRef}
                        type="text"
                        value={addrNumber}
                        onChange={(e) => setAddrNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground font-medium"
                        placeholder="36"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-foreground mb-1.5">PSČ *</label>
                      <input
                        type="text"
                        value={addrZip}
                        onChange={(e) => setAddrZip(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground font-medium"
                        placeholder="949 01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1.5">
                      {t?.profile?.info?.mobile || 'Mobile Number'}
                    </label>
                    <input
                      type="tel"
                      value={editedMobile}
                      onChange={(e) => setEditedMobile(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground font-medium"
                      placeholder={t?.profile?.info?.mobilePlaceholder || 'Enter your mobile number (optional)'}
                    />
                    <p className="text-xs font-medium text-neutral-500 mt-2">
                      {t?.profile?.info?.mobileHelp || 'Optional: Add your mobile number for important updates'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-200 mt-2">
                    <button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center min-w-[140px]"
                      onClick={handleUpdateProfile}
                      disabled={isUpdating || !addrCity || !addrZip || !addrNumber}
                    >
                      {isUpdating ? <SpinnerIcon className="w-5 h-5 text-white" /> : (t?.profile?.update?.save || 'Uložiť zmeny')}
                    </button>
                    <button
                      className="bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50"
                      onClick={() => {
                        setIsEditing(false);
                        setUpdateMessage('');
                        api.get(`/api/users/${userId}`).then(res => {
                          setEditedAddress(res.data.address || '');
                          setEditedMobile(res.data.mobile || '');
                        });
                      }}
                      disabled={isUpdating}
                    >
                      {t?.profile?.update?.cancel || 'Zrušiť'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ARCHÍV TLAČIDLO (User) */}
          <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-neutral-200 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Archive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-foreground mb-1">
                    {t?.archive?.title || 'Archív hodín'}
                  </h3>
                  <p className="text-sm font-medium text-neutral-500">
                    {t?.archive?.userDescription || 'Zobraziť históriu vašich absolvovaných hodín'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/archive')}
                className="w-full sm:w-auto bg-primary hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {t?.archive?.open || 'Otvoriť archív'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* --- GENERATE PAYMENT REPORT (Admin) --- */}
      {isAdmin && (
        <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-neutral-200">
          <h4 className="text-xl font-extrabold text-foreground mb-6 flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            {t?.profile?.report?.title || 'Generate Payment Report'}
          </h4>
          <form onSubmit={handleGenerateReport} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5 w-full min-w-0">
                <label className="block text-sm font-bold text-foreground mb-2">
                  {t?.profile?.report?.startDate || 'Start Date'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-w-0 block min-h-[46px] px-4 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-foreground"
                  style={{ WebkitAppearance: 'none', appearance: 'none', MozAppearance: 'none' }}
                  required
                />
                {tooltipMessage && (
                  <div className="text-red-500 text-xs font-bold mt-2">
                    {tooltipMessage}
                  </div>
                )}
              </div>
              <div className="md:col-span-5 w-full min-w-0">
                <label className="block text-sm font-bold text-foreground mb-2">
                  {t?.profile?.report?.endDate || 'End Date'}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full min-w-0 block min-h-[46px] px-4 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-foreground"
                  style={{ WebkitAppearance: 'none', appearance: 'none', MozAppearance: 'none' }}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-xl transition-all hover:shadow-md disabled:opacity-50 min-h-[46px]"
                  disabled={isButtonDisabled}
                >
                  {t?.profile?.report?.generate || 'PDF'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* --- ARCHÍV ZRUŠENÝCH HODÍN (Admin) --- */}
      {isAdmin && (
        <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-neutral-200">
          <h4 className="text-xl font-extrabold text-foreground mb-6 flex items-center gap-3">
            <Archive className="w-6 h-6 text-primary" />
            Archív zrušených hodín
          </h4>
          <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-10 w-full min-w-0">
                <label className="block text-sm font-bold text-foreground mb-2">
                  Informačný prehľad
                </label>
                <div className="w-full min-h-[46px] px-4 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-600 flex items-center">
                  Stiahnite si prehľad všetkých zrušených hodín, ktoré už boli vymazané z kalendára, ale zostali v databáze pre účely auditu.
                </div>
              </div>
              <div className="md:col-span-2">
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get('/api/admin/archived-sessions-report', { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `archiv_zrusenych_hodin_${new Date().toISOString().split('T')[0]}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    } catch (err) {
                      alert('Nepodarilo sa vygenerovať PDF: ' + err.message);
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all hover:shadow-md min-h-[46px]"
                >
                  {t?.profile?.report?.generate || 'Generovať PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DANGER ZONE */}
      <div className="bg-white rounded-[2rem] shadow-sm p-8 sm:p-10 border border-red-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>
        <h5 className="text-2xl font-black text-red-600 mb-3 flex items-center gap-3">
          <AlertTriangle className="w-7 h-7" />
          {t?.profile?.dangerZone?.title || 'Danger Zone'}
        </h5>
        <p className="text-neutral-600 font-medium mb-6 max-w-2xl">
          {t?.profile?.dangerZone?.description || 'Deleting your account will permanently remove all your data from our system. This action is irreversible.'}
        </p>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold py-3 px-8 rounded-xl border border-red-200 hover:border-red-600 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={isDeleting}
        >
          {isDeleting ? <SpinnerIcon className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
          {isDeleting
            ? t?.profile?.dangerZone?.deleting || 'Odstraňujem...'
            : t?.profile?.dangerZone?.delete || 'Vymazať môj účet'
          }
        </button>
        {error && (
          <div className="bg-red-50 text-red-800 rounded-xl p-4 mt-5 border border-red-200 font-bold text-sm flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* Password Modal pre Delete Account */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <div className="bg-white rounded-[2rem] shadow-2xl border-0 overflow-hidden">
          <Modal.Header closeButton className="border-b border-neutral-100 p-6 pb-4">
            <Modal.Title className="text-2xl font-black text-foreground">
              {t?.profile?.deleteModal?.title || 'Potvrdiť vymazanie účtu'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-6">
            <form>
              <div className="mb-2">
                <label className="block text-sm font-bold text-foreground mb-2">
                  {t?.profile?.deleteModal?.label || 'Zadajte heslo pre potvrdenie vymazania:'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors font-medium text-foreground"
                  placeholder={t?.profile?.deleteModal?.placeholder || 'Heslo'}
                />
              </div>
            </form>
          </Modal.Body>
          <Modal.Footer className="border-t border-neutral-100 p-6 pt-4 flex gap-3">
            <button 
              className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors flex-1"
              onClick={() => setShowPasswordModal(false)}
            >
              {t?.profile?.deleteModal?.cancel || 'Zrušiť'}
            </button>
            <button 
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all hover:shadow-md flex-1"
              onClick={confirmDeleteAccount}
            >
              {t?.profile?.deleteModal?.confirm || 'Potvrdiť vymazanie'}
            </button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Zrušenie Rezervácie Modal (USER) */}
      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        size="lg"
        centered
        className="d-flex align-items-center justify-content-center"
        dialogClassName="mx-4 w-full max-w-2xl"
        contentClassName="rounded-[2rem] shadow-2xl border-0 overflow-hidden"
      >
        <div className="bg-white rounded-[2rem] shadow-2xl border-0 overflow-hidden">
          <Modal.Header closeButton className="border-b border-neutral-100 p-6 sm:p-8 pb-4">
            <Modal.Title className="text-2xl font-black text-foreground">
              {t?.profile?.cancelModal?.title || 'Zrušiť rezerváciu'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-6 sm:p-8">
            <h5 className="text-lg font-bold text-foreground mb-5">
              {t?.profile?.cancelModal?.chooseOption || 'Vyberte možnosť zrušenia:'}
            </h5>

            <div className="space-y-4 mb-6">
              {/* ========== PAID BOOKING OPTIONS ========== */}
              {bookingType === 'paid' && (
                <>
                  <label className={`block flex items-start p-4 border rounded-2xl cursor-pointer transition-all ${cancellationType === 'refund' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-neutral-200 hover:border-primary/40 hover:bg-neutral-50'}`}>
                    <input
                      type="radio"
                      name="cancellationType"
                      checked={cancellationType === 'refund'}
                      onChange={() => setCancellationType('refund')}
                      className="w-5 h-5 mt-0.5 text-primary border-neutral-300 focus:ring-primary"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-bold text-foreground text-base">
                        💰 {t?.profile?.cancelModal?.refundOption || 'Požiadať o vrátenie peňazí'}
                      </div>
                      <p className="text-sm font-medium text-neutral-500 mt-1">
                        {t?.profile?.cancelModal?.refundDescription || 'Peniaze vám budú vrátené na váš bankový účet do 5-10 pracovných dní'}
                      </p>
                    </div>
                  </label>

                  <label className={`block flex items-start p-4 border rounded-2xl cursor-pointer transition-all ${cancellationType === 'credit' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-neutral-200 hover:border-primary/40 hover:bg-neutral-50'}`}>
                    <input
                      type="radio"
                      name="cancellationType"
                      checked={cancellationType === 'credit'}
                      onChange={() => setCancellationType('credit')}
                      className="w-5 h-5 mt-0.5 text-primary border-neutral-300 focus:ring-primary"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-bold text-foreground text-base">
                        💳 {t?.profile?.cancelModal?.creditOption || 'Požiadať o kredit'}
                      </div>
                      <p className="text-sm font-medium text-neutral-500 mt-1">
                        {t?.profile?.cancelModal?.creditDescription || 'Kredit sa pripíše na váš účet a môžete ho použiť na budúcu rezerváciu'}
                      </p>
                    </div>
                  </label>

                  <label className={`block flex items-start p-4 border rounded-2xl cursor-pointer transition-all ${cancellationType === 'replacement' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-neutral-200 hover:border-primary/40 hover:bg-neutral-50'}`}>
                    <input
                      type="radio"
                      name="cancellationType"
                      checked={cancellationType === 'replacement'}
                      onChange={() => setCancellationType('replacement')}
                      className="w-5 h-5 mt-0.5 text-primary border-neutral-300 focus:ring-primary"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-bold text-foreground text-base">
                        🔄 {t?.profile?.cancelModal?.replacementOption || 'Nájsť iný termín'}
                      </div>
                      <p className="text-sm font-medium text-neutral-500 mt-1">
                        {t?.profile?.cancelModal?.replacementDescription || 'Vyberte si náhradný termín zo zoznamu dostupných hodín'}
                      </p>
                    </div>
                  </label>
                </>
              )}

              {/* ========== SEASON TICKET / CREDIT OPTIONS ========== */}
              {(bookingType === 'season_ticket' || bookingType === 'credit') && (
                <>
                  <label className={`block flex items-start p-4 border rounded-2xl cursor-pointer transition-all ${cancellationType === 'return' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-neutral-200 hover:border-primary/40 hover:bg-neutral-50'}`}>
                    <input
                      type="radio"
                      name="cancellationType"
                      checked={cancellationType === 'return'}
                      onChange={() => setCancellationType('return')}
                      className="w-5 h-5 mt-0.5 text-primary border-neutral-300 focus:ring-primary"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-bold text-foreground text-base">
                        {bookingType === 'season_ticket' ? '🎫' : '💳'}{' '}
                        {bookingType === 'season_ticket'
                          ? (t?.profile?.cancelModal?.returnTicket || 'Vrátiť vstup z permanentky')
                          : (t?.profile?.cancelModal?.returnCredit || 'Vrátiť kredit na účet')
                        }
                      </div>
                      <p className="text-sm font-medium text-neutral-500 mt-1">
                        {bookingType === 'season_ticket'
                          ? (t?.profile?.cancelModal?.returnTicketDescription || 'Vstup sa vráti na vašu permanentku a môžete ho použiť neskôr')
                          : (t?.profile?.cancelModal?.returnCreditDescription || 'Kredit sa vráti na váš účet a môžete ho použiť na inú hodinu')
                        }
                      </p>
                    </div>
                  </label>

                  <label className={`block flex items-start p-4 border rounded-2xl cursor-pointer transition-all ${cancellationType === 'replacement' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-neutral-200 hover:border-primary/40 hover:bg-neutral-50'}`}>
                    <input
                      type="radio"
                      name="cancellationType"
                      checked={cancellationType === 'replacement'}
                      onChange={() => setCancellationType('replacement')}
                      className="w-5 h-5 mt-0.5 text-primary border-neutral-300 focus:ring-primary"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-bold text-foreground text-base">
                        🔄 {t?.profile?.cancelModal?.replacementOption || 'Nájsť iný termín'}
                      </div>
                      <p className="text-sm font-medium text-neutral-500 mt-1">
                        {t?.profile?.cancelModal?.replacementDescription || 'Vyberte si náhradný termín zo zoznamu dostupných hodín'}
                      </p>
                    </div>
                  </label>
                </>
              )}

              {/* ========== GIFT CARD OPTIONS ========== */}
              {bookingType === 'gift_card' && (
                <label className={`block flex items-start p-4 border rounded-2xl cursor-pointer transition-all ${cancellationType === 'return' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-neutral-200 hover:border-primary/40 hover:bg-neutral-50'}`}>
                  <input
                    type="radio"
                    name="cancellationType"
                    checked={cancellationType === 'return'}
                    onChange={() => setCancellationType('return')}
                    className="w-5 h-5 mt-0.5 text-primary border-neutral-300 focus:ring-primary"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-bold text-foreground text-base">
                      🎁 Vrátiť hodnotu na darčekový poukaz
                    </div>
                    <p className="text-sm font-medium text-neutral-500 mt-1">
                      Suma rezervácie bude okamžite vrátená na zostatok vášho darčekového poukazu.
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* ========== REPLACEMENT SESSION SELECTOR ========== */}
            {cancellationType === 'replacement' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mb-4 mt-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-100"
              >
                <label className="block text-sm font-bold text-blue-900 mb-2">
                  {t?.profile?.cancelModal?.selectReplacement || 'Vyberte náhradný termín:'}
                </label>
                <select
                  value={selectedReplacement}
                  onChange={(e) => setSelectedReplacement(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-foreground"
                >
                  <option value="">{t?.profile?.cancelModal?.chooseSession || 'Vyberte termín...'}</option>
                  {replacementSessions.map((session, index) => (
                    <option key={`${session.id || 'replacement'}-${session.training_date || ''}-${index}`} value={session.id}>
                      {new Date(session.training_date).toLocaleString('sk-SK', {
                        day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })} - {session.training_type} ({session.available_spots} voľných miest)
                    </option>
                  ))}
                </select>
                {replacementSessions.length === 0 && (
                  <p className="text-sm font-bold text-orange-600 mt-3 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> 
                    {t?.profile?.cancelModal?.noReplacements || 'Momentálne nie sú dostupné žiadne náhradné termíny.'}
                  </p>
                )}
              </motion.div>
            )}

            {/* ========== INFO BOXES ========== */}
            <AnimatePresence mode='wait'>
              {cancellationType === 'refund' && bookingType === 'paid' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4 flex items-start gap-3">
                  <div className="text-blue-600 mt-0.5">ℹ️</div>
                  <div>
                    <strong className="text-blue-900 block mb-1 text-sm">{t?.profile?.cancelModal?.refundInfo || 'Informácie o vrátení peňazí:'}</strong>
                    <p className="text-blue-700 text-sm font-medium">
                      {t?.profile?.cancelModal?.refundDetails || 'Peniaze budú automaticky vrátené na váš bankový účet. Proces môže trvať 5-10 pracovných dní.'}
                      <a href="https://docs.stripe.com/refunds" target="_blank" rel="noopener noreferrer" className="ml-1 font-bold underline hover:text-blue-900">
                        {t?.profile?.cancelModal?.moreInfo || 'Viac info'}
                      </a>
                    </p>
                  </div>
                </motion.div>
              )}

              {cancellationType === 'credit' && bookingType === 'paid' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4 flex items-start gap-3">
                  <div className="text-emerald-600 mt-0.5">✅</div>
                  <div>
                    <strong className="text-emerald-900 block mb-1 text-sm">{t?.profile?.cancelModal?.creditInfo || 'Informácie o kredite:'}</strong>
                    <p className="text-emerald-700 text-sm font-medium">
                      {t?.profile?.cancelModal?.creditDetails || 'Kredit bude okamžite pripísaný na váš účet so všetkými pôvodnými podmienkami rezervácie. Použiť ho môžete na akúkoľvek budúcu hodinu.'}
                    </p>
                  </div>
                </motion.div>
              )}

              {cancellationType === 'return' && bookingType === 'season_ticket' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4 flex items-start gap-3">
                  <div className="text-yellow-600 mt-0.5">🎫</div>
                  <div>
                    <strong className="text-yellow-900 block mb-1 text-sm">{t?.profile?.cancelModal?.ticketReturnInfo || 'Informácie o permanentke:'}</strong>
                    <p className="text-yellow-700 text-sm font-medium">
                      {t?.profile?.cancelModal?.ticketReturnDetails || 'Vstup bude okamžite vrátený na vašu permanentku a môžete ho použiť na inú hodinu.'}
                    </p>
                  </div>
                </motion.div>
              )}

              {cancellationType === 'return' && bookingType === 'credit' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4 flex items-start gap-3">
                  <div className="text-emerald-600 mt-0.5">💳</div>
                  <div>
                    <strong className="text-emerald-900 block mb-1 text-sm">{t?.profile?.cancelModal?.creditReturnInfo || 'Informácie o kredite:'}</strong>
                    <p className="text-emerald-700 text-sm font-medium">
                      {t?.profile?.cancelModal?.creditReturnDetails || 'Kredit bude okamžite vrátený na váš účet a môžete ho použiť na inú hodinu.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Modal.Body>

          <Modal.Footer className="border-t border-neutral-100 p-6 pt-4 flex gap-3">
            <button 
              className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors flex-1"
              onClick={() => setShowCancelModal(false)}
            >
              {t?.profile?.cancelModal?.cancel || 'Zatvoriť'}
            </button>
            <button
              onClick={confirmCancellation}
              disabled={!cancellationType || (cancellationType === 'replacement' && !selectedReplacement)}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-600 transition-all hover:shadow-md disabled:bg-neutral-300 disabled:shadow-none flex-1 flex items-center justify-center gap-2"
            >
              {cancellationType === 'replacement' && selectedReplacement
                ? <><RefreshCw className="w-4 h-4" /> {t?.profile?.cancelModal?.confirmReplace || 'Potvrdiť presun'}</>
                : cancellationType === 'refund'
                  ? <><CreditCard className="w-4 h-4" /> {t?.profile?.cancelModal?.confirmRefund || 'Potvrdiť vrátenie peňazí'}</>
                  : cancellationType === 'credit'
                    ? <><CreditCard className="w-4 h-4" /> {t?.profile?.cancelModal?.confirmCredit || 'Potvrdiť kredit'}</>
                    : cancellationType === 'return'
                      ? <><RefreshCw className="w-4 h-4" /> {t?.profile?.cancelModal?.confirmReturn || 'Potvrdiť vrátenie'}</>
                      : (t?.profile?.cancelModal?.confirm || 'Potvrdiť zrušenie')
              }
            </button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Admin Cancel Modal */}
      <Modal show={showAdminCancelModal} onHide={() => setShowAdminCancelModal(false)} centered>
        <div className="bg-white rounded-[2rem] shadow-2xl border-0 overflow-hidden">
          <Modal.Header closeButton className="border-b border-neutral-100 p-6 pb-4">
            <Modal.Title className="text-2xl font-black text-foreground flex items-center gap-2">
              {forceCancel ? 'Force Cancel Session' : 'Cancel Session'}
              {forceCancel && <span className="text-orange-600 text-sm uppercase bg-orange-100 px-2 py-0.5 rounded-md tracking-wider">(Within 10 Hours)</span>}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-6">
            <p className="text-neutral-600 font-medium mb-4">
              <strong className="text-foreground">{forceCancel ? 'FORCE CANCEL:' : 'Cancel'}</strong> {selectedSession?.type} session on {selectedSession?.date ? formatSlovakDate(selectedSession.date) : ''}?
            </p>
            {forceCancel && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-orange-800 text-sm font-bold flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                This session is within 10 hours. Force cancel will proceed despite timing restrictions.
              </div>
            )}
            <div className="mb-2">
              <label className="block text-sm font-bold text-foreground mb-2">Reason for cancellation:</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors font-medium text-foreground resize-none"
                required
                placeholder="Enter cancellation reason..."
              />
            </div>
          </Modal.Body>
          <Modal.Footer className="border-t border-neutral-100 p-6 pt-4 flex gap-3">
            <button 
              className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors flex-1"
              onClick={() => setShowAdminCancelModal(false)}
            >
              Zrušiť
            </button>
            <button 
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all hover:shadow-md flex-1"
              onClick={confirmAdminCancel}
            >
              {forceCancel ? 'Force Cancel' : 'Potvrdiť'}
            </button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Bulk Email Compose Modal */}
      <Modal show={showBulkEmailModal} onHide={() => setShowBulkEmailModal(false)} centered>
        <div className="bg-white rounded-[2rem] shadow-2xl border-0 overflow-hidden">
          <Modal.Header closeButton className="border-b border-neutral-100 p-6 pb-4">
            <Modal.Title className="text-xl font-black text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Hromadný email účastníkom
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-6 space-y-4">
            {bulkEmailSession && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm font-medium text-blue-800">
                📅 {bulkEmailSession.training_type} — {formatSlovakDate(bulkEmailSession.training_date)}
                <span className="ml-2 text-blue-600">
                  ({(bulkEmailSession.participants || []).filter(p => p.active !== false).length} príjemcov)
                </span>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Predmet</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Napr. Zmena termínu hodiny..."
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-medium text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Správa</label>
              <textarea
                rows={6}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Tu napíš správu pre účastníkov..."
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-medium text-foreground resize-none"
              />
            </div>
          </Modal.Body>
          <Modal.Footer className="border-t border-neutral-100 p-6 pt-4 flex gap-3">
            <button
              className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors flex-1"
              onClick={() => setShowBulkEmailModal(false)}
            >
              Zrušiť
            </button>
            <button
              disabled={!emailSubject.trim() || !emailMessage.trim()}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-md disabled:bg-neutral-300 disabled:shadow-none flex-1 flex items-center justify-center gap-2"
              onClick={() => { setShowBulkEmailModal(false); setShowEmailConfirm(true); }}
            >
              <Mail className="w-4 h-4" /> Pokračovať
            </button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Bulk Email Confirm Modal */}
      <Modal show={showEmailConfirm} onHide={() => { setShowEmailConfirm(false); setShowBulkEmailModal(true); }} centered>
        <div className="bg-white rounded-[2rem] shadow-2xl border-0 overflow-hidden">
          <Modal.Header closeButton className="border-b border-neutral-100 p-6 pb-4">
            <Modal.Title className="text-xl font-black text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Naozaj odoslať?
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-6">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800 font-medium space-y-2">
              <p>Chystáte sa odoslať email <strong>{(bulkEmailSession?.participants || []).filter(p => p.active !== false).length} účastníkom</strong> hodiny:</p>
              <p className="font-bold">{bulkEmailSession?.training_type} — {bulkEmailSession ? formatSlovakDate(bulkEmailSession.training_date) : ''}</p>
              <p className="mt-3">📧 <strong>Predmet:</strong> {emailSubject}</p>
            </div>
            <p className="text-sm text-neutral-500 font-medium mt-4">Táto akcia sa nedá vrátiť späť. Pokračovať?</p>
          </Modal.Body>
          <Modal.Footer className="border-t border-neutral-100 p-6 pt-4 flex gap-3">
            <button
              className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors flex-1"
              onClick={() => { setShowEmailConfirm(false); setShowBulkEmailModal(true); }}
            >
              Späť
            </button>
            <button
              disabled={isSendingEmail}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-md disabled:bg-neutral-300 flex-1 flex items-center justify-center gap-2"
              onClick={handleSendBulkEmail}
            >
              {isSendingEmail
                ? <><SpinnerIcon className="w-4 h-4" /> Odosielam...</>
                : <><Mail className="w-4 h-4" /> Áno, odoslať</>
              }
            </button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Moderný React Tooltip global */}
      <Tooltip id="generate-tooltip" place="top" effect="solid" className="rounded-lg !bg-neutral-800 !text-white font-medium text-xs px-3 py-2 shadow-xl" />
      
      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-primary hover:bg-primary-600 text-white rounded-full shadow-lg transition-all duration-300 z-50 w-14 h-14 flex items-center justify-center cursor-pointer border-2 border-white hover:scale-110"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default UserProfile;