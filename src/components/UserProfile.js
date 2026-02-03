import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from '../contexts/LanguageContext';
import { Tooltip } from 'react-tooltip';
import api from '../api/api';

const SpinnerIcon = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const UserProfile = () => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [bookedSessions, setBookedSessions] = useState([]);
  const [seasonTickets, setSeasonTickets] = useState([]);
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
  const [showHistory, setShowHistory] = useState(false); // Nový state pre históriu


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
      if (isAdmin) fetchAdminSeasonTickets();
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const endpoint = isAdmin ? '/api/admin/bookings' : `/api/bookings/user/${userId}`;
        const response = await api.get(endpoint);
        setBookedSessions(isAdmin ? response.data : response.data);
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

  // Parsovanie existujúcej adresy pri zapnutí editácie
  useEffect(() => {
    if (isEditing && editedAddress) {
      try {
        const parts = editedAddress.split(',');
        if (parts.length >= 2) {
          const part1 = parts[0].trim(); // Ulica + Číslo
          const part2 = parts[1].trim(); // PSČ + Mesto

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
  }, [isEditing]); // Odstránené editedAddress zo závislostí aby sa neprepisovalo počas písania, len pri otvorení

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target)) setShowCityDropdown(false);
      if (streetInputRef.current && !streetInputRef.current.contains(event.target)) setShowStreetDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // API Search functions
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

  // Upravený SAVE handler (spojí adresu dokopy)
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
      setEditedAddress(fullAddress); // Aktualizujeme hlavný state
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
          available_spots: session.available_spots || session.max_participants,
          cancelled: session.cancelled,
          participants: [],
        };
      }
      if (session.user_id) {
        grouped[key].participants.push({
          first_name: session.first_name,
          last_name: session.last_name,
          email: session.email,
          children: session.number_of_children || 1,
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

    // Získanie dňa týždňa
    const dayOfWeek = date.getDay();
    const daysSK = ['NE', 'PO', 'UT', 'ST', 'ŠT', 'PI', 'SO'];
    const daysEN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const dayName = t?.calendar ? t.calendar[daysEN[dayOfWeek].toLowerCase()] : daysSK[dayOfWeek];

    return `${day}. ${month}. ${year} - ${hours}:${minutes} (${dayName})`;
  };

  const processedAdminSessions = React.useMemo(() =>
    processSessions(bookedSessions),
    [bookedSessions]);

  // 2. Vytiahneme unikátne typy tréningov (odstránime duplicity)
  const availableSessionTypes = [...new Set(processedAdminSessions
    .map(session => session.training_type)
    .filter(type => type) // Odstráni prázdne hodnoty (null/undefined)
  )];

  // 3. Zoradíme ich: MINI, MIDI, MAXI prvé, ostatné podľa abecedy
  const sortedSessionTypes = availableSessionTypes.sort((a, b) => {
    const priorityOrder = ['MINI', 'MIDI', 'MAXI'];
    const indexA = priorityOrder.indexOf(a);
    const indexB = priorityOrder.indexOf(b);

    // Ak sú oba v prioritnom zozname, zoraď podľa poradia v zozname
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // Ak je len A prioritný, ide dopredu
    if (indexA !== -1) return -1;
    // Ak je len B prioritný, ide dopredu
    if (indexB !== -1) return 1;

    // Ostatné zoraď abecedne
    return a.localeCompare(b);
  });

  // Logika pre rozdelenie tiketov
  const currentDate = new Date();

  const activeTickets = seasonTickets.filter(ticket =>
    ticket.entries_remaining > 0 && new Date(ticket.expiry_date) > currentDate
  );

  const historyTickets = seasonTickets.filter(ticket =>
    ticket.entries_remaining === 0 || new Date(ticket.expiry_date) <= currentDate
  );

  const renderSessionTable = (type) => {
    const filtered = processSessions(bookedSessions)
      .filter((session) => session.training_type === type)
      .sort((a, b) => new Date(b.training_date) - new Date(a.training_date));

    if (filtered.length === 0) return null;


    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
        <h4 className="text-xl font-bold text-gray-800 dark:text-white px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {t?.profile?.sessionType?.[type.toLowerCase()] || `${type} Sessions`}
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t?.profile?.table?.date || 'Dátum'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t?.profile?.table?.type || 'Typ'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t?.profile?.table?.availableSpots || 'Miesta'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t?.profile?.table?.participants || 'Účastníci'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t?.profile?.table?.children || 'Deti'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t?.profile?.table?.actions || 'Akcie'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((session, index) => {
                const sessionTime = new Date(session.training_date);
                const currentTime = new Date();
                const hoursDifference = (sessionTime - currentTime) / (1000 * 60 * 60);

                // PODMIENKY PRE STAV
                const isWithin10Hours = hoursDifference <= 10;
                const isCancelled = session.cancelled === true;
                const remainingBookings = session.participants.filter(p => p.active === true).length;
                const totalChildren = session.participants.reduce((sum, participant) => sum + participant.children, 0);

                // --- LOGIKA PRE AKTIVITU TLAČIDIEL ---

                // 1. Checklist: Aktívny len ak nie je zrušený
                const canChecklist = !isCancelled;

                // 2. Cancel: Aktívny len ak nie je zrušený A ZÁROVEŇ je viac ako 10 hodín do začiatku
                const canCancel = !isCancelled && !isWithin10Hours;

                // 3. Force Cancel: Aktívny len ak nie je zrušený A ZÁROVEŇ je menej ako 10 hodín
                const canForceCancel = !isCancelled && isWithin10Hours;

                // 4. Delete: Aktívny len ak JE zrušený A nemá žiadnych aktívnych účastníkov
                const canDelete = isCancelled && remainingBookings === 0;

                return (
                  <tr
                    key={`${session.training_id || 'session'}-${session.training_date || ''}-${session.training_type || ''}-${index}`}
                    className={`
                      ${isCancelled ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : ''}
                      ${isWithin10Hours && !isCancelled ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                      hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatSlovakDate(session.training_date)}
                      </div>
                      {isCancelled && (
                        <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 mt-1">
                          ❌ {t?.profile?.cancelled || 'CANCELLED'}
                        </div>
                      )}
                      {isWithin10Hours && !isCancelled && (
                        <div className="text-orange-600 dark:text-orange-400 text-xs font-medium mt-1 flex items-center">
                          ⏳ {Math.round(hoursDifference)} {t?.profile?.hoursUntilSession || 'h'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {session.training_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <span className={`font-bold ${session.available_spots === 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {session.available_spots}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">of {session.max_participants}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2 max-w-xs">
                        {session.participants.map((participant, index) => (
                          <div key={`${participant.email || 'participant'}-${participant.first_name || ''}-${participant.last_name || ''}-${index}`} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900 dark:text-white">{participant.first_name} {participant.last_name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">{participant.email}</div>
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className={`
                                  inline-flex items-center px-2 py-1 rounded text-xs font-medium
                                  ${participant.booking_type === 'credit'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : participant.booking_type === 'season_ticket'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : participant.booking_type === 'paid' && participant.active === false
                                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  }
                                `}>
                                  {participant.booking_type === 'credit'
                                    ? '💳 Credit'
                                    : participant.booking_type === 'season_ticket'
                                      ? '🎫 Season Ticket'
                                      : participant.booking_type === 'paid' && participant.active === false
                                        ? '❌ Cancelled'
                                        : '💰 Paid'}
                                </span>
                                {participant.amount_paid > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                    €{participant.amount_paid}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {session.participants.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400 italic">No participants</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <span className="font-bold text-blue-600 dark:text-blue-400">{totalChildren}</span>
                      </div>
                    </td>

                    {/* --- UPRAVENÁ SEKCIA S IKONAMI --- */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center gap-2">

                        {/* 1. CHECKLIST IKONA */}
                        <button
                          disabled={!canChecklist}
                          className={`p-2 rounded-full transition-all ${canChecklist
                            ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
                            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            }`}
                          onClick={() => canChecklist && navigate(`/admin/checklist/${session.training_id}`)}
                          title={canChecklist ? "Otvoriť Checklist" : "Nedostupné (Zrušené)"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </button>

                        {/* 2. CANCEL SESSION IKONA (Teraz sivá ak je < 10h) */}
                        <button
                          disabled={!canCancel}
                          className={`p-2 rounded-full transition-all ${canCancel
                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer'
                            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            }`}
                          onClick={() => canCancel && handleAdminCancelSession(session.training_id, session.training_type, session.training_date, false)}
                          title={canCancel
                            ? (t?.profile?.cancelSession || "Cancel Session")
                            : isWithin10Hours
                              ? "Menej ako 10h (Použi Force Cancel)"
                              : "Už zrušené"
                          }
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        {/* 3. FORCE CANCEL IKONA */}
                        <button
                          disabled={!canForceCancel}
                          className={`p-2 rounded-full transition-all ${canForceCancel
                            ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer'
                            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            }`}
                          onClick={() => canForceCancel && handleAdminCancelSession(session.training_id, session.training_type, session.training_date, true)}
                          title={canForceCancel ? "Force Cancel" : "Dostupné len 10h pred tréningom"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </button>

                        {/* 4. DELETE SESSION IKONA */}
                        <button
                          disabled={!canDelete}
                          className={`p-2 rounded-full transition-all ${canDelete
                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer'
                            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            }`}
                          onClick={() => canDelete && handleDeleteSession(session.training_id, session.training_type, session.training_date)}
                          title={canDelete ? "Delete Session" : isCancelled ? `Čakám na zrušenie ${remainingBookings} rezervácií` : "Session musí byť najprv zrušený"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

  // Updated confirmCancellation function in UserProfile.js

  const confirmCancellation = async () => {
    if (!selectedBooking) return;

    try {
      if (cancellationType === 'refund') {
        // Original refund logic - DELETE request WITHOUT requestCredit flag
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
          } else if (response.data.refundError) {
            message += ` ${t?.profile?.cancel?.refundFailed || 'Refund processing failed.'} ${response.data.refundError}`;
          }
          showAlert(message, response.data.refundError ? 'danger' : 'success');
        }

      } else if (cancellationType === 'credit') {
        // NEW: Request credit instead of refund
        const response = await api.delete(
          `/api/bookings/${selectedBooking.bookingId}`,
          {
            data: { requestCredit: true } // Send flag to backend
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
        // NEW: Return season ticket entry or credit
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
        // Original replacement logic
        await api.post(
          `/api/replace-booking/${selectedBooking.bookingId}`,
          { newTrainingId: selectedReplacement }
        );
        showAlert(t?.profile?.cancel?.replacementSuccess || 'Session successfully replaced.', 'success');
      }

      // Refresh bookings
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
      // 1. Overenie hesla (volá Váš pôvodný endpoint)
      const verifyResponse = await api.post(
        '/api/verify-password',
        { password }
      );

      // Keďže Váš verify endpoint vracia 200 len pri úspechu a 400 pri chybe,
      // podmienka if (verifyResponse.data.success) je tu vlastne redundantná,
      // ale pre zachovanie logiky ju môžeme nechať.
      if (verifyResponse.data.success) {

        // 2. Zmazanie užívateľa (volá nový endpoint s mailom)
        await api.delete(`/api/users/${userId}`);

        // 3. Vyčistenie klientskych dát
        localStorage.removeItem('userId');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole'); // Ak používate aj role
        // localStorage.clear(); // TIP: Toto pre istotu vymaže úplne všetko z localStorage

        // 4. TVRDÝ RELOAD A PRESMEROVANIE
        // Namiesto navigate('/account-deleted') použijeme toto:
        window.location.href = '/account-deleted';

      } else {
        setError(t?.profile?.delete?.error?.incorrect || 'Incorrect password');
      }
    } catch (err) {
      // Tu zachytávame 400 z verify-password alebo 500 z delete
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
    <div className="container mx-auto px-4 py-8 max-w-7xl mt-8 space-y-10">
      {alertMessage && (
        <div className={`alert alert-${alertVariant} rounded-lg p-4 mb-6 ${alertVariant === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          alertVariant === 'danger' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`} role="alert">
          {alertMessage}
        </div>
      )}

      <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
        {t?.profile?.title || 'Account Settings'}
      </h2>

      {isAdmin ? (
        <div className="space-y-8">

          {/* Dynamicky vykreslíme tabuľku pre každý nájdený typ */}
          {sortedSessionTypes.length > 0 ? (
            sortedSessionTypes.map((type) => (
              <React.Fragment key={type}>
                {renderSessionTable(type)}
              </React.Fragment>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Žiadne tréningy na zobrazenie.
            </p>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t?.profile?.seasonTickets?.title || 'Season Ticket Holders'}
            </h3>
            {adminSeasonTickets.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                {t?.profile?.seasonTickets?.noTickets || 'No users have purchased season tickets.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t?.profile?.seasonTickets?.name || 'Name'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t?.profile?.seasonTickets?.email || 'Email'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t?.profile?.seasonTickets?.totalEntries || 'Total Entries'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t?.profile?.seasonTickets?.remainingEntries || 'Remaining Entries'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {adminSeasonTickets.map((ticket, index) => (
                      <tr key={`${ticket.id || 'ticket'}-${ticket.email || ''}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ticket.first_name} {ticket.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {ticket.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {ticket.entries_total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {ticket.entries_remaining}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* TLAČIDLO ARCHÍV - pridaj za Season Ticket Holders sekciou */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  📦 {t?.archive?.title || 'Archív hodín'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t?.archive?.description || 'Zobraziť uskutočnené tréningy z minulosti'}
                </p>
              </div>
              <button
                onClick={() => navigate('/archive')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {t?.archive?.open || 'Otvoriť archív'} →
              </button>
            </div>
          </div>
        </div>
      ) : (
        // ================== USER ČASŤ (Nový dizajn) ==================
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t?.profile?.mySeasonTickets?.title || 'Vaše permanentky'}
            </h3>

            {/* 1. AKTÍVNE PERMANENTKY */}
            {activeTickets.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t?.profile?.mySeasonTickets?.noTickets || 'Nemáte žiadne aktívne permanentky.'}
                </p>
                <button
                  onClick={() => navigate('/season-tickets')}
                  className="bg-secondary-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-secondary-600 transition-colors"
                >
                  Kúpiť novú permanentku →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto mb-2">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t?.profile?.mySeasonTickets?.ticketId || 'ID'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t?.profile?.mySeasonTickets?.entriesTotal || 'Vstupy'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t?.profile?.mySeasonTickets?.entriesRemaining || 'Zostatok'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t?.profile?.mySeasonTickets?.purchaseDate || 'Kúpené'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t?.profile?.mySeasonTickets?.expiryDate || 'Platnosť'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {activeTickets.map((ticket, index) => (
                      <tr key={`${ticket.id || 'ticket'}-${ticket.purchase_date || ''}-${index}`} className="hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                          #{ticket.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {ticket.entries_total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 py-1 px-3 rounded-full text-sm font-bold">
                            {ticket.entries_remaining}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {formatSlovakDate(ticket.purchase_date).split(' - ')[0]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {formatSlovakDate(ticket.expiry_date).split(' - ')[0]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. HISTÓRIA / VYČERPANÉ (Zobrazí sa len ak existujú staré lístky) */}
            {historyTickets.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium transition-colors mb-4"
                >
                  {showHistory ? 'Skryť históriu permanentiek' : `Zobraziť históriu / Vyčerpané permanentky (${historyTickets.length})`}
                  <span className={`transform transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {showHistory && (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 opacity-75 hover:opacity-100 transition-opacity">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-100 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dátum nákupu</th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-50 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {historyTickets.map((ticket, index) => (
                          <tr key={`${ticket.id || 'ticket'}-${ticket.purchase_date || ''}-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">#{ticket.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {ticket.entries_remaining === 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                                  Vyčerpaná
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                                  Expirovaná
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatSlovakDate(ticket.purchase_date).split(' - ')[0]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/*  ARCHÍV TLAČIDLO  */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  📦 {t?.archive?.title || 'Archív hodín'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t?.archive?.userDescription || 'Zobraziť históriu vašich absolvovaných hodín'}
                </p>
              </div>
              <button
                onClick={() => navigate('/archive')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {t?.archive?.open || 'Otvoriť archív'} →
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t?.profile?.bookedSessions?.title || 'Vaše rezervované relácie'}
            </h3>
            {bookedSessions.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                {t?.profile?.bookedSessions?.noSessions || 'Nemáte žiadne rezervované relácie.'}
              </p>
            ) : (
              <div className="space-y-4">
                {visibleSessions.map((session, index) => {
                  const isCancelled = session.cancelled === true;
                  const canCancel = !isCancelled && canCancelSession(session.training_date);

                  const getBookingTypeInfo = () => {
                    // PRIORITA 1: Skontroluj booking_type (najspoľahlivejšie)
                    if (session.booking_type === 'credit') {
                      return {
                        type: 'credit',
                        label: t?.profile?.bookingMethods?.credit || '💳 Kredit',
                        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      };
                    }

                    if (session.booking_type === 'season_ticket') {
                      return {
                        type: 'season_ticket',
                        label: t?.profile?.bookingMethods?.season_ticket || '🎫 Permanentka',
                        badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      };
                    }

                    // PRIORITA 2: Fallback na credit_id (pre starší kód)
                    if (session.credit_id) {
                      return {
                        type: 'credit',
                        label: t?.profile?.bookingMethods?.credit || '💳 Kredit',
                        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      };
                    }

                    // PRIORITA 3: Platená rezervácia
                    if (session.booking_type === 'paid' || (session.amount_paid && session.amount_paid > 0)) {
                      return {
                        type: 'paid',
                        label: t?.profile?.bookingMethods?.paid || '💰 Zaplatené',
                        badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      };
                    }

                    // PRIORITA 4: Neznámy typ (fallback)
                    return {
                      type: 'unknown',
                      label: t?.profile?.bookingMethods?.reservation || 'Rezervácia',
                      badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                    };
                  };

                  const bookingTypeInfo = getBookingTypeInfo();

                  return (
                    <div
                      key={`${session.booking_id || 'booking'}-${session.training_date || ''}-${index}`}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border ${isCancelled
                        ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        } transition-colors`}
                    >
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                          <strong className="text-lg text-gray-900 dark:text-white font-semibold">
                            {session.training_type}
                          </strong>
                          <span className="text-base text-gray-700 dark:text-gray-300 font-medium">
                            {formatSlovakDate(session.training_date)}
                          </span>
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bookingTypeInfo.badgeClass}`}>
                              {bookingTypeInfo.label}
                            </span>
                          </div>
                        </div>
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
                        className="flex-shrink-0 w-auto"
                      >
                        <button
                          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${isCancelled || !canCancel
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          onClick={() => handleCancelSession(session.booking_id, session.training_date, session.training_type)}
                          disabled={isCancelled || !canCancel}
                        >
                          {isCancelled ? t?.profile?.cancelled || 'Zrušené' : t?.profile?.cancel?.button || 'Zrušiť reláciu'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Tooltip id="cancel-tooltip" place="top" effect="solid" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t?.profile?.info?.title || 'Your Profile Information'}
            </h3>

            {updateMessage && (
              <div className={`rounded-lg p-4 mb-6 ${updateVariant === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                {updateMessage}
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              {!isEditing ? (
                // VIEW MODE (Bez zmeny)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      {t?.profile?.info?.address || 'Address'}
                    </h5>
                    <p className="text-gray-600 dark:text-gray-300">
                      {editedAddress || t?.profile?.info?.noAddress || 'No address provided'}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      {t?.profile?.info?.mobile || 'Mobile Number'}
                    </h5>
                    <p className="text-gray-600 dark:text-gray-300">
                      {editedMobile || t?.profile?.info?.noMobile || 'No mobile number provided'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                      onClick={() => setIsEditing(true)}
                    >
                      {t?.profile?.info?.editButton || 'Edit Profile Information'}
                    </button>
                  </div>
                </div>
              ) : (
                // EDIT MODE (SMART ADRESA)
                <div className="space-y-4">

                  {/* 1. MESTO */}
                  <div className="relative" ref={cityInputRef}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mesto / Obec *
                    </label>
                    <input
                      type="text"
                      value={addrCity}
                      onChange={(e) => { setAddrCity(e.target.value); setShowCityDropdown(true); }}
                      onFocus={() => setShowCityDropdown(true)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="Napr. Nitra"
                    />
                    {isSearchingCity && <div className="absolute right-3 top-9"><SpinnerIcon className="w-5 h-5 text-gray-400" /></div>}
                    {showCityDropdown && citySuggestions.length > 0 && (
                      <ul className="absolute z-50 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                        {citySuggestions.map((city, idx) => (
                          <li key={city.place_id || idx} onClick={() => handleSelectCity(city)} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-700 dark:text-gray-200">
                            {city.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 2. ULICA + CHECKBOX */}
                  <div className="relative" ref={streetInputRef}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ulica *
                    </label>
                    <input
                      type="text"
                      value={addrStreet}
                      onChange={(e) => { setAddrStreet(e.target.value); setShowStreetDropdown(true); }}
                      onFocus={() => !hasNoStreet && setShowStreetDropdown(true)}
                      disabled={!addrCity || hasNoStreet}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white
                          ${hasNoStreet ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed border-gray-300' : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-600'}`}
                      placeholder={hasNoStreet ? 'Obec nemá ulice' : (addrCity ? `Ulica v ${addrCity}` : "Najprv vyberte mesto")}
                    />
                    {isSearchingStreet && !hasNoStreet && <div className="absolute right-3 top-9"><SpinnerIcon className="w-5 h-5 text-gray-400" /></div>}
                    {showStreetDropdown && streetSuggestions.length > 0 && !hasNoStreet && (
                      <ul className="absolute z-50 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                        {streetSuggestions.map((street, idx) => (
                          <li key={street.place_id || idx} onClick={() => handleSelectStreet(street)} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-700 dark:text-gray-200">
                            {street.display_name.split(',')[0]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="noStreetProfile"
                      checked={hasNoStreet}
                      onChange={(e) => {
                        setHasNoStreet(e.target.checked);
                        if (e.target.checked) setAddrStreet('');
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="noStreetProfile" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                      Obec nemá ulice (použiť len číslo domu)
                    </label>
                  </div>

                  {/* 3. ČÍSLO a PSČ */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Číslo *</label>
                      <input
                        ref={numberInputRef}
                        type="text"
                        value={addrNumber}
                        onChange={(e) => setAddrNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                        placeholder="36"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PSČ *</label>
                      <input
                        type="text"
                        value={addrZip}
                        onChange={(e) => setAddrZip(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                        placeholder="949 01"
                      />
                    </div>
                  </div>

                  {/* 4. MOBILE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t?.profile?.info?.mobile || 'Mobile Number'}
                    </label>
                    <input
                      type="tel"
                      value={editedMobile}
                      onChange={(e) => setEditedMobile(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder={t?.profile?.info?.mobilePlaceholder || 'Enter your mobile number (optional)'}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t?.profile?.info?.mobileHelp || 'Optional: Add your mobile number for important updates'}
                    </p>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-3 pt-2">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleUpdateProfile}
                      disabled={isUpdating || !addrCity || !addrZip || !addrNumber}
                    >
                      {isUpdating
                        ? (t?.profile?.update?.updating || 'Updating...')
                        : (t?.profile?.update?.save || 'Save Changes')
                      }
                    </button>
                    <button
                      className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                      onClick={() => {
                        setIsEditing(false);
                        setUpdateMessage('');
                        // Reset pri zrušení
                        api.get(`/api/users/${userId}`).then(res => {
                          setEditedAddress(res.data.address || '');
                          setEditedMobile(res.data.mobile || '');
                        });
                      }}
                      disabled={isUpdating}
                    >
                      {t?.profile?.update?.cancel || 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* --- GENERATE PAYMENT REPORT--- */}
      {isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700 mt-8">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {t?.profile?.report?.title || 'Generate Payment Report'}
          </h4>
          <form onSubmit={handleGenerateReport}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5 w-full min-w-0"> {/* Pridané min-w-0 aj sem */}
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t?.profile?.report?.startDate || 'Start Date'}
                </label>
                {/* Začiatočný dátum */}
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  // block zabezpečí riadkovanie, min-h vynúti výšku aj keď je input prázdny
                  className="w-full min-w-0 block min-h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  style={{
                    WebkitAppearance: 'none', // Odstráni iOS sivý gradient
                    appearance: 'none',
                    MozAppearance: 'none'
                  }}
                  required
                />
                {/* Tooltip message */}
                {tooltipMessage && (
                  <div className="text-red-500 text-sm mt-1">
                    {tooltipMessage}
                  </div>
                )}

              </div>
              <div className="md:col-span-5 w-full min-w-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t?.profile?.report?.endDate || 'End Date'}
                </label>
                {/* Koncový dátum */}
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full min-w-0 block min-h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    MozAppearance: 'none'
                  }}
                  required
                />
              </div>
              <div className="md:col-span-2">
                {/* Tlačidlo môže zostať ako máš */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isButtonDisabled}
                >
                  {t?.profile?.report?.generate || 'Generate PDF'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* --- ARCHÍV ZRUŠENÝCH HODÍN --- */}
      {isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700 mt-8">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Archív zrušených hodín
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"> {/* Zmenené na items-end pre zarovnanie s buttonom */}
            <div className="md:col-span-10 w-full min-w-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Informačný prehľad
              </label>
              <div className="w-full min-h-[42px] px-3 py-2 border border-transparent bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-400 flex items-center">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t?.profile?.report?.generate || 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-red-200 dark:border-red-800 relative overflow-hidden mt-8 mb-8">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>
        <h5 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
          <span>⚠️</span>
          {t?.profile?.dangerZone?.title || 'Danger Zone'}
        </h5>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {t?.profile?.dangerZone?.description || 'Deleting your account will permanently remove all your data from our system. This action is irreversible.'}
        </p>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isDeleting}
        >
          {isDeleting
            ? t?.profile?.dangerZone?.deleting || 'Deleting...'
            : t?.profile?.dangerZone?.delete || 'Delete My Account'
          }
        </button>
        {error && <div className="bg-red-100 text-red-800 rounded-lg p-3 mt-4 border border-red-200">{error}</div>}
      </div>

      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-xl font-semibold text-gray-800">
            {t?.profile?.deleteModal?.title || 'Confirm Account Deletion'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t?.profile?.deleteModal?.label || 'Enter your password to confirm deletion:'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder={t?.profile?.deleteModal?.placeholder || 'Password'}
              />
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            {t?.profile?.deleteModal?.cancel || 'Cancel'}
          </Button>
          <Button variant="danger" onClick={confirmDeleteAccount}>
            {t?.profile?.deleteModal?.confirm || 'Confirm Deletion'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="text-xl font-semibold text-gray-800">
            {t?.profile?.cancelModal?.title || 'Zrušiť rezerváciu'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5 className="text-lg font-semibold text-gray-800 mb-4">
            {t?.profile?.cancelModal?.chooseOption || 'Vyberte možnosť zrušenia:'}
          </h5>

          <div className="space-y-4 mb-4">
            {/* ========== PAID BOOKING OPTIONS ========== */}
            {bookingType === 'paid' && (
              <>
                {/* Option 1: Refund */}
                <div className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="cancellationType"
                    id="refundOption"
                    checked={cancellationType === 'refund'}
                    onChange={() => setCancellationType('refund')}
                    className="w-4 h-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="refundOption" className="ml-3 flex-1 cursor-pointer">
                    <div className="font-semibold text-gray-800">
                      💰 {t?.profile?.cancelModal?.refundOption || 'Požiadať o vrátenie peňazí'}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {t?.profile?.cancelModal?.refundDescription || 'Peniaze vám budú vrátené na váš bankový účet do 5-10 pracovných dní'}
                    </p>
                  </label>
                </div>

                {/* Option 2: Credit */}
                <div className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="cancellationType"
                    id="creditOption"
                    checked={cancellationType === 'credit'}
                    onChange={() => setCancellationType('credit')}
                    className="w-4 h-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="creditOption" className="ml-3 flex-1 cursor-pointer">
                    <div className="font-semibold text-gray-800">
                      💳 {t?.profile?.cancelModal?.creditOption || 'Požiadať o kredit'}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {t?.profile?.cancelModal?.creditDescription || 'Kredit sa pripíše na váš účet a môžete ho použiť na budúcu rezerváciu'}
                    </p>
                  </label>
                </div>

                {/* Option 3: Replace */}
                <div className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="cancellationType"
                    id="replacementOption"
                    checked={cancellationType === 'replacement'}
                    onChange={() => setCancellationType('replacement')}
                    className="w-4 h-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="replacementOption" className="ml-3 flex-1 cursor-pointer">
                    <div className="font-semibold text-gray-800">
                      🔄 {t?.profile?.cancelModal?.replacementOption || 'Nájsť iný termín'}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {t?.profile?.cancelModal?.replacementDescription || 'Vyberte si náhradný termín zo zoznamu dostupných hodín'}
                    </p>
                  </label>
                </div>
              </>
            )}

            {/* ========== SEASON TICKET / CREDIT OPTIONS ========== */}
            {(bookingType === 'season_ticket' || bookingType === 'credit') && (
              <>
                {/* Option 1: Return entry/credit */}
                <div className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="cancellationType"
                    id="returnOption"
                    checked={cancellationType === 'return'}
                    onChange={() => setCancellationType('return')}
                    className="w-4 h-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="returnOption" className="ml-3 flex-1 cursor-pointer">
                    <div className="font-semibold text-gray-800">
                      {bookingType === 'season_ticket' ? '🎫' : '💳'}
                      {' '}
                      {bookingType === 'season_ticket'
                        ? (t?.profile?.cancelModal?.returnTicket || 'Vrátiť vstup z permanentky')
                        : (t?.profile?.cancelModal?.returnCredit || 'Vrátiť kredit na účet')
                      }
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {bookingType === 'season_ticket'
                        ? (t?.profile?.cancelModal?.returnTicketDescription || 'Vstup sa vráti na vašu permanentku a môžete ho použiť neskôr')
                        : (t?.profile?.cancelModal?.returnCreditDescription || 'Kredit sa vráti na váš účet a môžete ho použiť na inú hodinu')
                      }
                    </p>
                  </label>
                </div>

                {/* Option 2: Replace */}
                <div className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="cancellationType"
                    id="replacementOption"
                    checked={cancellationType === 'replacement'}
                    onChange={() => setCancellationType('replacement')}
                    className="w-4 h-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="replacementOption" className="ml-3 flex-1 cursor-pointer">
                    <div className="font-semibold text-gray-800">
                      🔄 {t?.profile?.cancelModal?.replacementOption || 'Nájsť iný termín'}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {t?.profile?.cancelModal?.replacementDescription || 'Vyberte si náhradný termín zo zoznamu dostupných hodín'}
                    </p>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* ========== REPLACEMENT SESSION SELECTOR ========== */}
          {cancellationType === 'replacement' && (
            <div className="mb-4 mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t?.profile?.cancelModal?.selectReplacement || 'Vyberte náhradný termín:'}
              </label>
              <select
                value={selectedReplacement}
                onChange={(e) => setSelectedReplacement(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t?.profile?.cancelModal?.chooseSession || 'Vyberte termín...'}</option>
                {replacementSessions.map((session, index) => (
                  <option key={`${session.id || 'replacement'}-${session.training_date || ''}-${index}`} value={session.id}>
                    {new Date(session.training_date).toLocaleString('sk-SK', {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {session.training_type}
                    {' '}({session.available_spots} voľných miest)
                  </option>
                ))}
              </select>
              {replacementSessions.length === 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ {t?.profile?.cancelModal?.noReplacements || 'Momentálne nie sú dostupné žiadne náhradné termíny.'}
                </p>
              )}
            </div>
          )}

          {/* ========== INFO BOXES ========== */}
          {cancellationType === 'refund' && bookingType === 'paid' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <strong className="text-blue-800">ℹ️ {t?.profile?.cancelModal?.refundInfo || 'Informácie o vrátení peňazí:'}</strong>
              <p className="text-blue-700 mt-1 text-sm">
                {t?.profile?.cancelModal?.refundDetails || 'Peniaze budú automaticky vrátené na váš bankový účet. Proces môže trvať 5-10 pracovných dní.'}
                <a
                  href="https://docs.stripe.com/refunds"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 font-medium underline hover:text-blue-900"
                >
                  {t?.profile?.cancelModal?.moreInfo || 'Viac info'}
                </a>
              </p>
            </div>
          )}

          {cancellationType === 'credit' && bookingType === 'paid' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <strong className="text-green-800">✅ {t?.profile?.cancelModal?.creditInfo || 'Informácie o kredite:'}</strong>
              <p className="text-green-700 mt-1 text-sm">
                {t?.profile?.cancelModal?.creditDetails || 'Kredit bude okamžite pripísaný na váš účet so všetkými pôvodnými podmienkami rezervácie. Použiť ho môžete na akúkoľvek budúcu hodinu.'}
              </p>
            </div>
          )}

          {cancellationType === 'return' && bookingType === 'season_ticket' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <strong className="text-yellow-800">🎫 {t?.profile?.cancelModal?.ticketReturnInfo || 'Informácie o permanentke:'}</strong>
              <p className="text-yellow-700 mt-1 text-sm">
                {t?.profile?.cancelModal?.ticketReturnDetails || 'Vstup bude okamžite vrátený na vašu permanentku a môžete ho použiť na inú hodinu.'}
              </p>
            </div>
          )}

          {cancellationType === 'return' && bookingType === 'credit' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <strong className="text-green-800">💳 {t?.profile?.cancelModal?.creditReturnInfo || 'Informácie o kredite:'}</strong>
              <p className="text-green-700 mt-1 text-sm">
                {t?.profile?.cancelModal?.creditReturnDetails || 'Kredit bude okamžite vrátený na váš účet a môžete ho použiť na inú hodinu.'}
              </p>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            {t?.profile?.cancelModal?.cancel || 'Zatvoriť'}
          </Button>
          <Button
            variant="primary"
            onClick={confirmCancellation}
            disabled={
              !cancellationType ||
              (cancellationType === 'replacement' && !selectedReplacement)
            }
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
          >
            {cancellationType === 'replacement' && selectedReplacement
              ? (t?.profile?.cancelModal?.confirmReplace || 'Potvrdiť presun')
              : cancellationType === 'refund'
                ? (t?.profile?.cancelModal?.confirmRefund || 'Potvrdiť vrátenie peňazí')
                : cancellationType === 'credit'
                  ? (t?.profile?.cancelModal?.confirmCredit || 'Potvrdiť kredit')
                  : cancellationType === 'return'
                    ? (t?.profile?.cancelModal?.confirmReturn || 'Potvrdiť vrátenie')
                    : (t?.profile?.cancelModal?.confirm || 'Potvrdiť zrušenie')
            }
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAdminCancelModal} onHide={() => setShowAdminCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-xl font-semibold text-gray-800">
            {forceCancel ? 'Force Cancel Session' : 'Cancel Session'}
            {forceCancel && <span className="text-orange-600 ml-2">(Within 10 Hours)</span>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-gray-700 mb-4">
            {forceCancel ? 'FORCE CANCEL:' : 'Cancel'} {selectedSession?.type} session on {selectedSession?.date ? new Date(selectedSession.date).toLocaleString() : ''}?
            {forceCancel && <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2 text-orange-800">This session is within 10 hours. Force cancel will proceed despite timing restrictions.</div>}
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for cancellation:</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdminCancelModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmAdminCancel}>
            {forceCancel ? 'Force Cancel' : 'Confirm Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
      <Tooltip id="generate-tooltip" place="top" effect="solid" />
    </div>
  );
};

export default UserProfile;