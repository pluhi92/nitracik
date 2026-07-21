// Booking.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Login from './Login';
import { useNavigate, useLocation } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import { Tooltip } from 'react-tooltip';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from '../contexts/LanguageContext';
import { Modal, Button, Form } from 'react-bootstrap';
import CustomCalendar from './CustomCalendar';
import api from '../api/api';
import { HexColorPicker } from "react-colorful";
import { getAvailableSeasonTickets } from '../tests/bookingSeasonTicketUtils';

const Booking = () => {
  const toDateKey = (value) => {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [userData, setUserData] = useState(null);
  const [trainingType, setTrainingType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [childrenCount, setChildrenCount] = useState(1);
  const [childrenAges, setChildrenAges] = useState([]);
  const [note, setNote] = useState('');
  const [mobile, setMobile] = useState('');
  const [accompanyingPerson, setAccompanyingPerson] = useState(false);
  const [consent, setConsent] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trainingDates, setTrainingDates] = useState({});
  const [seasonTickets, setSeasonTickets] = useState([]);
  const [useSeasonTicket, setUseSeasonTicket] = useState(false);
  const [selectedSeasonTicket, setSelectedSeasonTicket] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [newTrainingDate, setNewTrainingDate] = useState('');
  const [newTrainingType, setNewTrainingType] = useState('MIDI');
  const [trainingTypeId, setTrainingTypeId] = useState('');
  const [trainingTypes, setTrainingTypes] = useState([]);
  const [selectedTypeObj, setSelectedTypeObj] = useState(null);
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);

  // Scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [newTypePrice1, setNewTypePrice1] = useState(15);
  const [newTypePrice2, setNewTypePrice2] = useState(28);
  const [newTypePrice3, setNewTypePrice3] = useState(39);
  const [newAccompanyingPrice, setNewAccompanyingPrice] = useState(3);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [warningMessage, setWarningMessage] = useState('');
  const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
  const [availability, setAvailability] = useState({
    isAvailable: true,
    remainingSpots: 0,
    requestedChildren: 0,
  });
  const [newTypeColor, setNewTypeColor] = useState('#3b82f6');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { t } = useTranslation();
  const [credits, setCredits] = useState([]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [isCreditMode, setIsCreditMode] = useState(false);
  const [serviceConsent, setServiceConsent] = useState(false);
  const [showServiceConsentModal, setShowServiceConsentModal] = useState(false);
  const [showDuplicateBookingModal, setShowDuplicateBookingModal] = useState(false);
  const [duplicateBookingModalContext, setDuplicateBookingModalContext] = useState(null);
  const [duplicateBookingConfirmedKey, setDuplicateBookingConfirmedKey] = useState('');
  const [pendingExistingSessionId, setPendingExistingSessionId] = useState('');
  const [pendingExistingBookingId, setPendingExistingBookingId] = useState(null);
  const [fillFormPreference, setFillFormPreference] = useState({});
  const [userBookings, setUserBookings] = useState([]);
  const [trainingId, setTrainingId] = useState(null);
  const [newTypeDuration, setNewTypeDuration] = useState(60); // Default 60 min
  const [pricingMode, setPricingMode] = useState('tiered'); // 'fixed' alebo 'tiered'
  const [fixedPricePerChild, setFixedPricePerChild] = useState(15); // Pre fixný režim
  const [ageGroup, setAgeGroup] = useState('child'); // 'child' | 'adult'
  const [newAudienceType, setNewAudienceType] = useState('children'); // pre admin modal
  
  // Admin - téma pre detské tréningy
  const [sessionTheme, setSessionTheme] = useState('');
  const [useSessionTheme, setUseSessionTheme] = useState(false);
  const [lockedReservation, setLockedReservation] = useState(null);
  const [isLockedSelectionApplied, setIsLockedSelectionApplied] = useState(false);

  const calculateTotalPrice = () => {
    if (!selectedTypeObj) return 0;

    // Pre dospelých použijeme cenu pre child_count = 1, pre deti podľa počtu detí
    const childCount = ageGroup === 'adult' ? 1 : childrenCount;
    const priceObj = selectedTypeObj.prices.find(p => p.child_count === childCount);
    let basePrice = priceObj ? parseFloat(priceObj.price) : 0;

    // Sprievádzajúca osoba len pre deti
    if (accompanyingPerson && ageGroup === 'child') {
      const accPrice = selectedTypeObj.accompanying_person_price ? parseFloat(selectedTypeObj.accompanying_person_price) : 3;
      basePrice += accPrice;
    }

    return basePrice;
  };

  const getOrdinalSuffix = (number) => {
    if (number > 3 && number < 21) return 'th';
    switch (number % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getYearLabel = (age) => {
    const isSlovak = t?.booking?.childrenCount?.includes('Počet');
    if (isSlovak) {
      if (age === 1) return t?.booking?.yearSingular || 'rok';
      if (age >= 2 && age <= 4) return t?.booking?.yearPlural2to4 || 'roky';
      return t?.booking?.yearPlural5Plus || 'rokov';
    }
    return age === 1 ? t?.booking?.yearSingular || 'year' : t?.booking?.yearPlural || 'years';
  };

  const getBookingDateTime = useCallback((booking) => {
    const bookingDateObj = new Date(booking.training_date);

    return {
      date: toDateKey(bookingDateObj),
      time: bookingDateObj.toLocaleTimeString('sk-SK', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  }, []);

  const createDuplicateDateKey = (typeName, dateKey) => `${typeName || ''}::${dateKey || ''}`;
  const createDuplicateSessionKey = (typeName, dateKey, timeValue) => `${typeName || ''}::${dateKey || ''}::${timeValue || ''}`;

  const hasDuplicateBookingForDate = useCallback((typeName, dateKey) =>
    userBookings.some((booking) => {
      if (booking.active === false) return false;

      const bookingDateTime = getBookingDateTime(booking);

      return booking.training_type === typeName && bookingDateTime.date === dateKey;
    }), [userBookings, getBookingDateTime]);

  const closeDuplicateBookingModal = () => {
    setShowDuplicateBookingModal(false);
    setDuplicateBookingModalContext(null);
    setPendingExistingSessionId('');
    setPendingExistingBookingId(null);
  };

  const applyDateSelection = (formattedDate) => {
    setSelectedDate(formattedDate);
    setSelectedTime('');
    setTrainingId(null);

    setTimeout(() => {
      if (timeSelectRef.current) {
        timeSelectRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 300);
  };

  const timeSelectRef = useRef(null);

  useEffect(() => {
    if (useSeasonTicket && selectedSeasonTicket) {
      setAccompanyingPerson(false);
    }
  }, [useSeasonTicket, selectedSeasonTicket]);

  useEffect(() => {
    if (!useSeasonTicket) return;

    const selectedTicket = seasonTickets.find(ticket => ticket.id === parseInt(selectedSeasonTicket));
    const ticketMatchesType = selectedTicket && selectedTypeObj
      ? Array.isArray(selectedTicket.training_types)
        ? selectedTicket.training_types.some((type) => type.id === selectedTypeObj.id)
        : false
      : true;

    if (selectedTicket && selectedTypeObj && !ticketMatchesType) {
      setUseSeasonTicket(false);
      setSelectedSeasonTicket('');
    }
  }, [useSeasonTicket, selectedSeasonTicket, selectedTypeObj, seasonTickets]);

  useEffect(() => {
    if (childrenAges.length === childrenCount) {
      return; // Zastavíme vykonávanie efektu, ak nie je potrebné nič meniť
    }
    const newAges = [];
    for (let i = 0; i < childrenCount; i++) {
      newAges.push(childrenAges[i] || '');
    }
    setChildrenAges(newAges);
  }, [childrenCount, childrenAges]);

  // Reset formulára pri zmene ageGroup
  useEffect(() => {
    setWarningMessage('');
    setDuplicateBookingConfirmedKey('');
    closeDuplicateBookingModal();

    // Reset child-only flows when switching audiences
    setIsCreditMode(false);
    setSelectedCredit(null);
    setUseSeasonTicket(false);
    setSelectedSeasonTicket('');
    setServiceConsent(false);

    // Reset výberov
    setSelectedDate('');
    setSelectedTime('');
    setTrainingId(null);
    setChildrenAges([]);
    setChildrenCount(ageGroup === 'adult' ? 1 : 1);
    setAccompanyingPerson(false);
    setPhotoConsent(null);
    setNote('');
    setMobile('');
  }, [ageGroup]);

  useEffect(() => {
    if (!location.state?.incomingLocked) {
      return;
    }

    const nextLocked = {
      incomingId: location.state.incomingId,
      incomingTypeId: location.state.incomingTypeId,
      incomingType: location.state.incomingType,
      incomingDate: location.state.incomingDate,
      incomingTime: location.state.incomingTime,
      incomingAgeGroup: location.state.incomingAgeGroup || 'child'
    };

    setLockedReservation((prev) => {
      if (
        prev &&
        String(prev.incomingId) === String(nextLocked.incomingId) &&
        String(prev.incomingTypeId) === String(nextLocked.incomingTypeId) &&
        prev.incomingType === nextLocked.incomingType
      ) {
        return prev;
      }

      setIsLockedSelectionApplied(false);
      return nextLocked;
    });
  }, [location.state]);

  useEffect(() => {
    const fetchTrainingDates = async () => {
      try {
        const response = await api.get('/api/training-dates');
        const dates = response.data.reduce((acc, training) => {
          const date = toDateKey(training.training_date);
          const time = new Date(training.training_date).toLocaleTimeString('sk-SK', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });

          if (!acc[training.training_type]) {
            acc[training.training_type] = {};
          }
          if (!acc[training.training_type][date]) {
            acc[training.training_type][date] = [];
          }

          acc[training.training_type][date].push({ time, id: training.id });
          return acc;
        }, {});
        setTrainingDates(dates);
      } catch (error) {
        console.error('Error fetching training dates:', error);
      }
    };

    const fetchSeasonTickets = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await api.get(`/api/season-tickets/${userId}`);
        setSeasonTickets(
          response.data.filter(
            ticket =>
              ticket.entries_remaining > 0 &&
              new Date(ticket.expiry_date) > new Date()
          )
        );
      } catch (error) {
        console.error('Error fetching season tickets:', error);
      }
    };

    const fetchCredits = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await api.get(`/api/credits/${userId}`);
        setCredits(response.data);
      } catch (error) {
        console.error('Error fetching credits:', error);
      }
    };

    const fetchUserBookings = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await api.get(`/api/bookings/user/${userId}`);
        setUserBookings(response.data);
      } catch (error) {
        console.error('Error fetching user bookings:', error);
      }
    };

    const fetchTypes = async (audience = null) => {
      const params = new URLSearchParams();
      if (isAdmin) params.set('admin', 'true');
      if (audience) params.set('audience', audience);

      const qs = params.toString();
      const response = await api.get(`/api/training-types${qs ? `?${qs}` : ''}`);
      setTrainingTypes(response.data);
    };

    if (isLoggedIn) {
      const targetAudience = (lockedReservation?.incomingAgeGroup || ageGroup) === 'adult' ? 'adults' : 'children';

      fetchTrainingDates();
      fetchSeasonTickets();
      fetchCredits();
      fetchUserBookings();
      fetchTypes(targetAudience);
    }
  }, [isLoggedIn, isAdmin, ageGroup, lockedReservation]);

  useEffect(() => {
    // Ak nemáme ID alebo dáta, končíme
    if (!trainingTypeId || trainingTypes.length === 0) return;

    // 1. Nájdi objekt podľa ID
    const typeObj = trainingTypes.find(t => t.id === Number(trainingTypeId));

    // 2. Nastav ho do state-u (tým sa spustí výpočet ceny)
    setSelectedTypeObj(typeObj || null);

    // 3. Synchronizuj aj názov (pretože CustomCalendar filtruje podľa názvu stringu)
    if (typeObj) {
      setTrainingType(typeObj.name);
    }
  }, [trainingTypeId, trainingTypes]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      fetchUserData();
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await api.get(`/api/users/${localStorage.getItem('userId')}`);
        setIsAdmin(response.data.role === 'admin' || localStorage.getItem('userRole') === 'admin');
      } catch (error) {
        console.error('Admin check failed:', error);
      }
    };

    if (isLoggedIn) checkAdmin();
  }, [isLoggedIn]);

  const fetchUserData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.get(`/api/users/${userId}`);
      setUserData(response.data);
      setMobile(response.data.mobile || '');
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleAddTrainingDate = async (e) => {
    e.preventDefault();
    try {
      // Zistíme či je vybraný detský tréning
      const selectedType = trainingTypes.find(t => t.id === parseInt(newTrainingType));
      const isChildrenType = selectedType?.audience_type === 'children';
      
      await api.post('/api/set-training', {
        trainingType: newTrainingType,
        trainingDate: newTrainingDate,
        maxParticipants: parseInt(maxParticipants),
        theme: isChildrenType && useSessionTheme ? sessionTheme : null,
      });

      const fetchResponse = await api.get('/api/training-dates');
      const updatedDates = processTrainingDates(fetchResponse.data);
      setTrainingDates(updatedDates);

      setNewTrainingDate('');
      setMaxParticipants(10);
      setSessionTheme('');
      setUseSessionTheme(false);

      alert('Training date added successfully!');
    } catch (error) {
      console.error('Error adding training date:', error);
      alert(`Failed to add training date: ${error.response?.data?.error || error.message}`);
    }
  };

  const processTrainingDates = (data) => {
    return data.reduce((acc, training) => {
      const date = toDateKey(training.training_date);
      const time = new Date(training.training_date).toLocaleTimeString('sk-SK', { // ← Zmena na sk-SK
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // ← Pridané pre 24-hodinový formát
      });
      if (!acc[training.training_type]) {
        acc[training.training_type] = {};
      }
      if (!acc[training.training_type][date]) {
        acc[training.training_type][date] = [];
      }
      // TU JE KĽÚČOVÁ ZMENA (rovnako ako vyššie):
      acc[training.training_type][date].push({ time, id: training.id, theme: training.theme });
      return acc;
    }, {});
  };

  const handleCreateType = async (e) => {
    e.preventDefault();

    // Príprava cien podľa cieľovej skupiny
    let calculatedPrices = [];
    const price = parseFloat(fixedPricePerChild);

    if (newAudienceType === 'adults') {
      // Pre dospelých - len jedna cena (za osobu)
      calculatedPrices = [
        { child_count: 1, price: price }
      ];
    } else if (newAudienceType === 'both') {
      // Pre "Oboje" - zatiaľ len fixná cena
      calculatedPrices = [
        { child_count: 1, price: price },
        { child_count: 2, price: price * 2 },
        { child_count: 3, price: price * 3 }
      ];
    } else {
      // Pre deti - podľa zvoleného režimu
      if (pricingMode === 'fixed') {
        calculatedPrices = [
          { child_count: 1, price: price },
          { child_count: 2, price: price * 2 },
          { child_count: 3, price: price * 3 }
        ];
      } else {
        calculatedPrices = [
          { child_count: 1, price: parseFloat(newTypePrice1) || 0 },
          { child_count: 2, price: parseFloat(newTypePrice2) || 0 },
          { child_count: 3, price: parseFloat(newTypePrice3) || 0 }
        ];
      }
    }

    try {
      await api.post('/api/admin/training-types', {
        name: newTypeName,
        description: newTypeDesc,
        durationMinutes: parseInt(newTypeDuration),
        accompanyingPrice: newAudienceType === 'children' ? parseFloat(newAccompanyingPrice) : 0,
        colorHex: newTypeColor,
        audienceType: newAudienceType,
        prices: calculatedPrices
      });

      alert("Nový typ tréningu bol vytvorený!");
      setShowCreateTypeModal(false);

      // Reset formulára na defaulty
      setNewTypeName('');
      setNewTypeDesc('');
      setNewTypeDuration(60);
      setNewTypeColor('#3b82f6');
      setPricingMode('tiered');
      setNewAudienceType('children'); // Reset na default
      setFixedPricePerChild(15);

      const response = await api.get(`/api/training-types?admin=true`);
      setTrainingTypes(response.data);
    } catch (error) {
      console.error(error);
      alert("Nepodarilo sa vytvoriť typ tréningu");
    }
  };

  const toggleTypeStatus = async (typeId, currentStatus) => {
    try {
      await api.put(`/api/admin/training-types/${typeId}/toggle`, { active: !currentStatus });
      const response = await api.get(`/api/training-types?admin=true`);

      setTrainingTypes(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTypeChange = (e) => {
    const newId = e.target.value; // Teraz to bude ID (číslo/string) alebo prázdny string
    setTrainingTypeId(newId);     // Nastavíme ID -> useEffect hore sa postará o zvyšok
    setDuplicateBookingConfirmedKey('');
    closeDuplicateBookingModal();

    // Ak je prázdny value (placeholder), resetujeme všetko
    if (!newId) {
      setTrainingType('');
      setSelectedTypeObj(null);
    }

    // Reset výberov
    setSelectedDate('');
    setSelectedTime('');
    setTrainingId(null);
  };

  useEffect(() => {
    const checkAvailability = async () => {
      // Ak nemáme ID alebo počet detí, kontrolu nerobíme
      if (!trainingId || !childrenCount) {
        setAvailability({ isAvailable: true, remainingSpots: 0, requestedChildren: 0 });
        return;
      }

      try {
        const response = await api.get('/api/check-availability', {
          params: {
            trainingId, // Posielame len to podstatné
            childrenCount
          },
        });

        setAvailability({
          isAvailable: response.data.available,
          remainingSpots: response.data.remainingSpots,
          requestedChildren: childrenCount,
        });
      } catch (error) {
        console.error('Error checking availability:', error);
      }
    };

    checkAvailability();
    // Sledujeme primárne trainingId a childrenCount
  }, [trainingId, childrenCount]);

  useEffect(() => {
    if (!lockedReservation) {
      return;
    }

    const {
      incomingTypeId,
      incomingType,
      incomingAgeGroup
    } = lockedReservation;

    if (incomingAgeGroup && ageGroup !== incomingAgeGroup) {
      setAgeGroup(incomingAgeGroup);
      return;
    }

    if (incomingTypeId && trainingTypes.length > 0) {
      const foundById = trainingTypes.find(t => t.id === Number(incomingTypeId));

      if (foundById) {
        setTrainingTypeId(String(foundById.id));
        setTrainingType(foundById.name);
        setSelectedTypeObj(foundById);
        return;
      }
    }

    if (incomingType && trainingTypes.length > 0) {
      const foundByName = trainingTypes.find(t => t.name === incomingType);

      if (foundByName) {
        setTrainingTypeId(String(foundByName.id));
        setTrainingType(foundByName.name);
        setSelectedTypeObj(foundByName);
      }
    }
  }, [lockedReservation, trainingTypes, ageGroup, isCreditMode]);

  useEffect(() => {
    if (!lockedReservation?.incomingId || isLockedSelectionApplied) {
      return;
    }

    const effectiveType = trainingType || lockedReservation.incomingType;

    if (!effectiveType || !trainingDates[effectiveType]) {
      return;
    }

    const entries = Object.entries(trainingDates[effectiveType]);
    const incomingId = String(lockedReservation.incomingId);

    for (const [dateKey, sessions] of entries) {
      const matchedSession = sessions.find((session) => String(session.id) === incomingId);

      if (!matchedSession) {
        continue;
      }

      if (selectedDate !== dateKey) {
        setSelectedDate(dateKey);
      }

      if (selectedTime !== matchedSession.time) {
        setSelectedTime(matchedSession.time);
      }

      if (String(trainingId) !== String(matchedSession.id)) {
        setTrainingId(String(matchedSession.id));
      }

      setIsLockedSelectionApplied(true);

      return;
    }
  }, [lockedReservation, trainingType, trainingDates, selectedDate, selectedTime, trainingId, isLockedSelectionApplied]);

  const handleAgeChange = (index, age) => {
    const newAges = [...childrenAges];
    newAges[index] = age === '' ? '' : parseInt(age);
    setChildrenAges(newAges);
  };

  const createCurrentDateDuplicateKey = () => createDuplicateDateKey(trainingType, selectedDate);
  const createCurrentSessionDuplicateKey = () => createDuplicateSessionKey(trainingType, selectedDate, selectedTime);

  const isDuplicateApprovedForCurrentSelection = () => {
    const currentDateKey = createCurrentDateDuplicateKey();
    const currentSessionKey = createCurrentSessionDuplicateKey();

    return duplicateBookingConfirmedKey === currentDateKey || duplicateBookingConfirmedKey === currentSessionKey;
  };

  const openBackendDuplicateBookingModal = () => {
    setDuplicateBookingModalContext({
      source: 'backend',
      typeName: trainingType,
      date: selectedDate,
      time: selectedTime
    });
    setShowDuplicateBookingModal(true);
  };

  const openSelectionDuplicateBookingModal = ({ typeName, date, time, source = 'selection' }) => {
    setDuplicateBookingModalContext({
      source,
      typeName,
      date,
      time,
    });
    setShowDuplicateBookingModal(true);
  };

  const openPendingDuplicateBookingModal = useCallback((existingSessionId, existingBookingId, context = {}) => {
    const {
      typeName = trainingType,
      date = selectedDate,
      time = selectedTime,
      origin = null,
    } = context;

    setPendingExistingSessionId(existingSessionId || '');
    setPendingExistingBookingId(existingBookingId || null);
    setDuplicateBookingModalContext({
      source: 'pending',
      origin,
      typeName,
      date,
      time
    });
    setShowDuplicateBookingModal(true);
  }, [trainingType, selectedDate, selectedTime]);

  const checkDuplicateStatusForTraining = useCallback(async ({
    selectedTrainingId,
    typeName,
    date,
    time,
    source = 'selection',
  }) => {
    if (!selectedTrainingId) {
      return false;
    }

    try {
      const response = await api.get('/api/bookings/duplicate-status', {
        params: { trainingId: selectedTrainingId },
      });

      if (response.data?.code === 'ACTIVE_DUPLICATE') {
        openSelectionDuplicateBookingModal({
          typeName,
          date,
          time,
          source,
        });
        return true;
      }

      if (response.data?.code === 'PENDING_BOOKING') {
        openPendingDuplicateBookingModal(
          response.data?.existingSessionId,
          response.data?.existingBookingId,
          {
            typeName,
            date,
            time,
            origin: source,
          }
        );
        return true;
      }
    } catch (error) {
      console.error('Duplicate status check failed:', error);
    }

    return false;
  }, [openPendingDuplicateBookingModal]);

  useEffect(() => {
    if (!lockedReservation || !isLockedSelectionApplied || showDuplicateBookingModal) {
      return;
    }

    const effectiveType = trainingType || lockedReservation.incomingType;
    const incomingDate = lockedReservation.incomingDate;
    const incomingTime = lockedReservation.incomingTime;
    const incomingId = lockedReservation.incomingId;

    if (!effectiveType || !incomingDate || !incomingTime || !incomingId) {
      return;
    }

    const sessionKey = createDuplicateSessionKey(effectiveType, incomingDate, incomingTime);

    if (duplicateBookingConfirmedKey === sessionKey) {
      return;
    }

    checkDuplicateStatusForTraining({
      selectedTrainingId: incomingId,
      typeName: effectiveType,
      date: incomingDate,
      time: incomingTime,
      source: 'activity',
    });
  }, [
    lockedReservation,
    isLockedSelectionApplied,
    showDuplicateBookingModal,
    trainingType,
    duplicateBookingConfirmedKey,
    checkDuplicateStatusForTraining,
  ]);

  const startPaidBookingCheckout = async ({ forceAllowDuplicate = false } = {}) => {
    const childrenAgeString = ageGroup === 'child' ? childrenAges.join(', ') : '';
    const allowDuplicate = forceAllowDuplicate || isDuplicateApprovedForCurrentSelection();

    if (ageGroup === 'adult') {
      const paymentSession = await api.post('/api/create-adult-payment-session', {
        userId: userData.id,
        trainingId,
        trainingType,
        selectedDate,
        selectedTime,
        mobile,
        note,
        allowDuplicate,
         photoConsent: photoConsent === true ? true : null,
      });

      const stripe = await stripePromise;

      // Store booking ID and session ID for recovery if payment fails
      localStorage.setItem('pendingBookingId', paymentSession.data.bookingId);
      localStorage.setItem('pendingSessionId', paymentSession.data.sessionId);

      const { error } = await stripe.redirectToCheckout({
        sessionId: paymentSession.data.sessionId,
      });

      if (error) throw error;
      return;
    }

    const paymentSession = await api.post('/api/create-payment-session', {
      userId: userData.id,
      trainingId,
      trainingType,
      selectedDate,
      selectedTime,
      childrenCount,
      childrenAge: childrenAgeString,
      totalPrice: calculateTotalPrice(),
      photoConsent: photoConsent === true ? true : null,
      mobile,
      note,
      accompanyingPerson,
      allowDuplicate,
    });

    const stripe = await stripePromise;

    // Store booking ID and session ID for recovery if payment fails
    localStorage.setItem('pendingBookingId', paymentSession.data.bookingId);
    localStorage.setItem('pendingSessionId', paymentSession.data.sessionId);

    const { error } = await stripe.redirectToCheckout({
      sessionId: paymentSession.data.sessionId,
    });

    if (error) throw error;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWarningMessage('');

    // Validate date and time are selected for all booking types
    if (!trainingId || !selectedDate || !selectedTime) {
      setWarningMessage(t?.booking?.selectDateTimeRequired || 'Please select date and time for your booking.');
      setLoading(false);
      return;
    }

    if (isCreditMode) {
      // For child credits, validate that all ages are selected
      if (ageGroup === 'child' && childrenAges.some(age => age === '')) {
        setWarningMessage(t?.booking?.selectAllAges || 'Please select an age for all children.');
        setLoading(false);
        return;
      }

      try {
        await api.post('/api/bookings/use-credit', {
          creditId: selectedCredit.id,
          trainingId: trainingId,
          childrenAges: ageGroup === 'child' ? childrenAges.join(', ') : '',
          photoConsent: photoConsent === true ? true : null,
          mobile: mobile,
          note: note,
          accompanyingPerson: ageGroup === 'child' ? accompanyingPerson : false
        });

        alert(t?.booking?.creditSuccess || 'Booked with credit!');
        setIsCreditMode(false);
        setSelectedCredit(null);
        navigate('/profile');

        const creditsResponse = await api.get('/api/credits/' + localStorage.getItem('userId'));
        setCredits(creditsResponse.data);
      } catch (error) {
        console.error('Credit booking error:', error);
        setWarningMessage(error.response?.data?.error || t?.booking?.error || 'Error processing booking. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (ageGroup === 'child' && childrenAges.some(age => age === '')) {
      setWarningMessage(t?.booking?.selectAllAges || 'Please select an age for all children.');
      setLoading(false);
      return;
    }

    // Validate service consent for card payments (not for season ticket usage and not for credits)
    if (!useSeasonTicket && !isCreditMode && !serviceConsent) {
      setWarningMessage('Musíte prijať súhlas so začatím poskytovania služby.');
      setLoading(false);
      return;
    }

    const childrenAgeString = ageGroup === 'child' ? childrenAges.join(', ') : '';

    try {
      if (useSeasonTicket && selectedSeasonTicket) {
        const selectedTicket = seasonTickets.find(ticket => ticket.id === parseInt(selectedSeasonTicket));

        if (!selectedTicket) {
          setWarningMessage(t?.booking?.seasonTicketNotFound || 'Selected season ticket not found');
          setLoading(false);
          return;
        }

        // For adults, we need 1 entry; for children, we need childrenCount entries
        const entriesNeeded = ageGroup === 'adult' ? 1 : childrenCount;

        if (selectedTicket.entries_remaining < entriesNeeded) {
          const message = t?.booking?.notEnoughEntries || 'Not enough entries in your season ticket. Needed: {needed}, Available: {available}';
          setWarningMessage(
            message.replace('{needed}', entriesNeeded).replace('{available}', selectedTicket.entries_remaining)
          );
          setLoading(false);
          return;
        }

        if (new Date(selectedTicket.expiry_date) < new Date()) {
          setWarningMessage(t?.booking?.seasonTicketExpired || 'Your season ticket has expired');
          setLoading(false);
          return;
        }

        const response = await api.post('/api/use-season-ticket', {
          userId: userData.id,
          seasonTicketId: selectedSeasonTicket,
          trainingTypeId: selectedTypeObj?.id,
          trainingId,
          trainingType,
          selectedDate,
          selectedTime,
          childrenCount: entriesNeeded,
          childrenAge: childrenAgeString,
          photoConsent: photoConsent === true ? true : null,
          mobile,
          note,
          accompanyingPerson: false,
          ageGroup,
        });

        if (response.data.success) {
          alert(t?.booking?.seasonTicketSuccess || 'Booking created using season ticket!');
          navigate('/profile');
        }
      } else {
        await startPaidBookingCheckout();
        return;
      }
    } catch (error) {
      console.error('Booking error:', error);

      const duplicateCode = error.response?.data?.code;

      if (error.response?.status === 409 && (duplicateCode === 'DUPLICATE_BOOKING' || duplicateCode === 'ACTIVE_DUPLICATE')) {
        openBackendDuplicateBookingModal();
        setWarningMessage('');
        setLoading(false);
        return;
      }

      if (error.response?.status === 409 && duplicateCode === 'PENDING_BOOKING') {
        openPendingDuplicateBookingModal(
          error.response?.data?.existingSessionId,
          error.response?.data?.existingBookingId
        );
        setWarningMessage('');
        setLoading(false);
        return;
      }

      if (error.response?.status === 401) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        setWarningMessage('Relácia vypršala. Prihláste sa prosím znova.');
        setLoading(false);
        navigate('/login');
        return;
      }

      if (error.response?.data?.error) {
        setWarningMessage(error.response.data.error);
      } else {
        setWarningMessage(t?.booking?.error || 'Error processing booking. Please try again.');
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session_id');
    const bookingId = urlParams.get('booking_id');
    if (sessionId && bookingId) {
      api.get(`/api/booking-success?session_id=${sessionId}&booking_id=${bookingId}`).then(() => {
        alert(t?.booking?.paymentSuccess || 'Payment successful! Booking confirmed.');
        navigate('/profile');
      }).catch(error => {
        console.error('Error confirming payment:', error);
        alert(t?.booking?.paymentError || 'Payment confirmation failed. Please contact support.');
      });
    }
  }, [location.search, navigate, t]);

  const handleDateSelect = (formattedDate) => {
    const duplicateDateKey = createDuplicateDateKey(trainingType, formattedDate);

    if (
      trainingType &&
      hasDuplicateBookingForDate(trainingType, formattedDate) &&
      duplicateBookingConfirmedKey !== duplicateDateKey
    ) {
      setDuplicateBookingModalContext({
        source: 'calendar',
        typeName: trainingType,
        date: formattedDate
      });
      setShowDuplicateBookingModal(true);
      return;
    }

    applyDateSelection(formattedDate);

    const daySessions = trainingType && trainingDates[trainingType]?.[formattedDate]
      ? trainingDates[trainingType][formattedDate]
      : [];

    // Ak je na dátume len jeden slot, vieme overiť duplicitu okamžite už po kliknutí na dátum.
    if (daySessions.length === 1) {
      const onlySession = daySessions[0];
      const sessionKey = createDuplicateSessionKey(trainingType, formattedDate, onlySession.time);

      if (duplicateBookingConfirmedKey !== sessionKey) {
        checkDuplicateStatusForTraining({
          selectedTrainingId: onlySession.id,
          typeName: trainingType,
          date: formattedDate,
          time: onlySession.time,
          source: 'selection',
        });
      }
    }
  };

  const handleTimeSlotSelect = async (e) => {
    const id = e.target.value;
    setTrainingId(id);

    const sessionObj = trainingDates[trainingType][selectedDate]
      .find(s => String(s.id) === String(id));
    const nextTime = sessionObj?.time || '';
    setSelectedTime(nextTime);

    if (!id || !sessionObj) {
      return;
    }

    const sessionKey = createDuplicateSessionKey(trainingType, selectedDate, nextTime);

    if (duplicateBookingConfirmedKey === sessionKey) {
      return;
    }

    await checkDuplicateStatusForTraining({
      selectedTrainingId: id,
      typeName: trainingType,
      date: selectedDate,
      time: nextTime,
      source: 'selection',
    });
  };

  const handleDuplicateBookingConfirm = async () => {
    if (!duplicateBookingModalContext) {
      return;
    }

    if (duplicateBookingModalContext.source === 'pending') {
      closeDuplicateBookingModal();

      setLoading(true);
      setWarningMessage('');

      try {
        const stripe = await stripePromise;

        if (!pendingExistingSessionId) {
          throw new Error('Missing pending Stripe session id');
        }

        const { error } = await stripe.redirectToCheckout({
          sessionId: pendingExistingSessionId,
        });

        if (error) {
          throw error;
        }
        return;
      } catch (error) {
        console.error('Pending booking redirect error:', error);

        // Fallback: ak je pôvodná Stripe session expirovaná, vytvoríme novú s explicitným allowDuplicate.
        try {
          await startPaidBookingCheckout({ forceAllowDuplicate: true });
          return;
        } catch (fallbackError) {
          console.error('Pending booking fallback checkout error:', fallbackError);

          if (fallbackError.response?.status === 409 && (fallbackError.response?.data?.code === 'DUPLICATE_BOOKING' || fallbackError.response?.data?.code === 'ACTIVE_DUPLICATE')) {
            openBackendDuplicateBookingModal();
            setWarningMessage('');
          } else if (fallbackError.response?.data?.error) {
            setWarningMessage(fallbackError.response.data.error);
          } else {
            setWarningMessage('Nepodarilo sa presmerovať na rozpracovanú platbu. Skúste to prosím znova.');
          }

          setLoading(false);
          return;
        }
      }
    }

    if (duplicateBookingModalContext.source === 'backend') {
      setDuplicateBookingConfirmedKey(
        createDuplicateSessionKey(
          duplicateBookingModalContext.typeName,
          duplicateBookingModalContext.date,
          duplicateBookingModalContext.time
        )
      );
      closeDuplicateBookingModal();

      setLoading(true);
      setWarningMessage('');

      try {
        await startPaidBookingCheckout({ forceAllowDuplicate: true });
      } catch (error) {
        console.error('Duplicate confirmation booking error:', error);

        if (error.response?.status === 409 && (error.response?.data?.code === 'DUPLICATE_BOOKING' || error.response?.data?.code === 'ACTIVE_DUPLICATE')) {
          openBackendDuplicateBookingModal();
          setWarningMessage('');
        } else if (error.response?.status === 409 && error.response?.data?.code === 'PENDING_BOOKING') {
          openPendingDuplicateBookingModal(
            error.response?.data?.existingSessionId,
            error.response?.data?.existingBookingId
          );
          setWarningMessage('');
        } else if (error.response?.data?.error) {
          setWarningMessage(error.response.data.error);
        } else {
          setWarningMessage(t?.booking?.error || 'Error processing booking. Please try again.');
        }

        setLoading(false);
      }

      return;
    }

    if (duplicateBookingModalContext.source === 'activity') {
      setDuplicateBookingConfirmedKey(
        createDuplicateSessionKey(
          duplicateBookingModalContext.typeName,
          duplicateBookingModalContext.date,
          duplicateBookingModalContext.time
        )
      );
      closeDuplicateBookingModal();
      return;
    }

    if (duplicateBookingModalContext.source === 'selection') {
      setDuplicateBookingConfirmedKey(
        createDuplicateSessionKey(
          duplicateBookingModalContext.typeName,
          duplicateBookingModalContext.date,
          duplicateBookingModalContext.time
        )
      );
      closeDuplicateBookingModal();
      return;
    }

    setDuplicateBookingConfirmedKey(
      createDuplicateDateKey(duplicateBookingModalContext.typeName, duplicateBookingModalContext.date)
    );
    closeDuplicateBookingModal();
    applyDateSelection(duplicateBookingModalContext.date);
  };

  const handleDuplicateBookingCancel = () => {
    const duplicateSource = duplicateBookingModalContext?.source;

    closeDuplicateBookingModal();

    if (duplicateSource === 'activity' || (duplicateSource === 'pending' && duplicateBookingModalContext?.origin === 'activity')) {
      navigate('/aktivity');
    }
  };

  const formatAvailabilityMessage = () => {
    if (!availability.isAvailable) {
      if (availability.remainingSpots === 0) {
        return t?.booking?.availability?.full || 'All places are already occupied for this session. Please choose another date or time.';
      }
      return t?.booking?.availability?.unavailable
        ?.replace('{count}', availability.remainingSpots)
        ?.replace('{needed}', availability.requestedChildren) ||
        `Only ${availability.remainingSpots} spot${availability.remainingSpots !== 1 ? 's' : ''} remain (needed ${availability.requestedChildren})`;
    }
    return null;
  };

  const closeServiceConsentModal = () => {
    setShowServiceConsentModal(false);
  };

  const COMPATIBLE_CHILD_CREDIT_TYPES = new Set(['MINI', 'MIDI', 'MAXI']);
  const normalizeTrainingTypeName = (value) => (value || '').toString().trim().toUpperCase();

  const currentType = trainingTypes.find(t => t.name === trainingType);

  // Filter credits based on training type audience
  const getCreditsForAudience = (audience) => {
    return credits.filter(credit => {
      const creditType = trainingTypes.find(t => t.name === credit.training_type);
      if (!creditType) return false;
      // For 'children' audience, show credits from children or both types
      // For 'adults' audience, show credits from adults or both types
      return creditType.audience_type === audience || creditType.audience_type === 'both';
    });
  };

  const childCredits = getCreditsForAudience('children');
  const adultCredits = getCreditsForAudience('adults');

  const getAllowedCreditTypeNames = (credit) => {
    if (!credit?.training_type) {
      return [];
    }

    const normalizedCreditType = normalizeTrainingTypeName(credit.training_type);
    if (COMPATIBLE_CHILD_CREDIT_TYPES.has(normalizedCreditType)) {
      return Array.from(COMPATIBLE_CHILD_CREDIT_TYPES);
    }

    return [normalizedCreditType];
  };

  const isMiniMidiMaxiCredit = (credit) => {
    const normalizedCreditType = normalizeTrainingTypeName(credit?.training_type);
    return COMPATIBLE_CHILD_CREDIT_TYPES.has(normalizedCreditType);
  };

  const activeTrainingTypes = trainingTypes.filter(t => isAdmin ? true : t.active);
  const allowedCreditTypeNames = isCreditMode && selectedCredit
    ? new Set(getAllowedCreditTypeNames(selectedCredit))
    : null;
  const selectableTrainingTypes = activeTrainingTypes.filter((type) => {
    if (!allowedCreditTypeNames) {
      return true;
    }

    return allowedCreditTypeNames.has(normalizeTrainingTypeName(type.name));
  });

  const selectCredit = (credit, fillForm = false) => {
    setSelectedCredit(credit);

    // Nájdi ID typu na základe mena
    const creditType = trainingTypes.find(t => t.name === credit.training_type);
    if (creditType) {
      setTrainingTypeId(String(creditType.id));
      setTrainingType(credit.training_type);
    }

    // Determine if this is an adult credit based on training type
    const isAdultCredit = creditType?.audience_type === 'adults';
    
    let parsedAges = [];
    
    // For adult credits, don't set children-related fields
    if (isAdultCredit) {
      setChildrenCount(1);
      setChildrenAges([]);
      setAccompanyingPerson(false);
    } else {
      setChildrenCount(credit.child_count);
      setAccompanyingPerson(credit.accompanying_person === true);

      if (credit.children_ages) {
        console.log('[DEBUG] Original children_ages:', credit.children_ages);

        if (typeof credit.children_ages === 'string') {
          parsedAges = credit.children_ages
            .split(',')
            .map(age => age.trim())
            .map(age => {
              const parsed = parseInt(age);
              return isNaN(parsed) ? '' : parsed;
            });
        } else if (Array.isArray(credit.children_ages)) {
          parsedAges = credit.children_ages.map(age => parseInt(age)).filter(age => !isNaN(age));
        }
      }

      console.log('[DEBUG] Parsed ages:', parsedAges);

      if (parsedAges.length !== credit.child_count) {
        parsedAges = Array(credit.child_count).fill('');
      }

      setChildrenAges(parsedAges);
    }

    if (fillForm) {
      console.log('[DEBUG] Filling form with original data:', {
        photoConsent: credit.photo_consent,
        mobile: credit.mobile,
        note: credit.note,
        childrenAges: parsedAges
      });

      setPhotoConsent(credit.photo_consent);
      setMobile(credit.mobile || '');
      setNote(credit.note || '');
    } else {
      console.log('[DEBUG] Leaving form empty for user input');
      setPhotoConsent(null);
      setMobile('');
      setNote('');
    }

    setConsent(false);
    setFillFormPreference(prev => ({
      ...prev,
      [credit.id]: false
    }));

    setSelectedDate('');
    setSelectedTime('');
    setShowCreditModal(false);
    setIsCreditMode(true);

    console.log('[DEBUG] Credit selected - Final state:', {
      creditId: credit.id,
      accompanyingPerson: credit.accompanying_person,
      child_count: credit.child_count,
      fillForm: fillForm,
      childrenAges: parsedAges,
      photoConsent: fillForm ? credit.photo_consent : 'empty',
      mobile: fillForm ? credit.mobile : 'empty',
      note: fillForm ? credit.note : 'empty'
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto mt-8 px-4">
        <div className="flex justify-center">
          <div className="w-full md:w-96">
            <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
                  {t?.booking?.title || 'Book Your Training'}
                </h2>
                <Login
                  onLoginSuccess={() => {
                    localStorage.setItem('isLoggedIn', 'true');
                    setIsLoggedIn(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availableSeasonTickets = getAvailableSeasonTickets(seasonTickets, selectedTypeObj);

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4 sm:px-6 relative">
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 border-2 border-gray-700 text-gray-700 hover:text-gray-900 hover:border-gray-900 hover:shadow-2xl rounded-full shadow-lg transition-all duration-300 z-50 bg-white/80 w-16 h-16 flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <span className="text-3xl font-black leading-none translate-y-1">^</span>
        </button>
      )}
      <h2 className="text-3xl font-bold text-center text-primary-600 mb-8">
        {t?.booking?.title || 'Book Your Training'}
      </h2>

      {/* Age Group Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              ageGroup === 'child'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            disabled={Boolean(lockedReservation)}
            onClick={() => setAgeGroup('child')}
          >
            Tréning pre deti
          </button>
          <button
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              ageGroup === 'adult'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            disabled={Boolean(lockedReservation)}
            onClick={() => setAgeGroup('adult')}
          >
            Tréning pre dospelých
          </button>
        </div>
      </div>

      {lockedReservation && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          Vybraný termín je predvyplnený z aktivít a v tomto formulári je uzamknutý.
        </div>
      )}

      <div className="flex justify-between gap-4 mb-6">
        <button
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          onClick={() => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userId');
            window.location.reload();
          }}
        >
          {t?.booking?.logout || 'Logout'}
        </button>
        <button
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          onClick={() => navigate(`/season-tickets?audience=${ageGroup}`)}
        >
          {t?.booking?.seasonTickets || 'Purchase Season Ticket'}
        </button>
      </div>

      {/* Credit notification for Children */}
      {ageGroup === 'child' && childCredits.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-6">
          <strong className="text-blue-800 text-lg">
            {t?.booking?.youHaveCredit || 'You have'} {childCredits.length}{' '}
            {childCredits.length === 1 ? 'credit' : 'credits'}!
          </strong>
          <br />
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium mt-2 transition-colors"
            onClick={() => setShowCreditModal(true)}
          >
            🎫 {t?.booking?.useCredit || 'Use Credit'}
          </button>
        </div>
      )}

      {/* Credit notification for Adults */}
      {ageGroup === 'adult' && adultCredits.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-6">
          <strong className="text-blue-800 text-lg">
            {t?.booking?.youHaveCredit || 'You have'} {adultCredits.length}{' '}
            {adultCredits.length === 1 ? 'credit' : 'credits'}!
          </strong>
          <br />
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium mt-2 transition-colors"
            onClick={() => setShowCreditModal(true)}
          >
            🎫 {t?.booking?.useCredit || 'Use Credit'}
          </button>
        </div>
      )}

      {/* 1. ADMIN PANEL - PRIDÁVANIE TERMÍNOV (SESSION) */}
      {isAdmin && (
        <div className="bg-primary-50 border-2 border-primary-100 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center border-b-2 border-primary-500 pb-2 mb-4">
            <h3 className="text-xl font-semibold text-primary-600 mb-0">
              {t?.admin?.title || 'Admin Controls'}
            </h3>
            {/* Tlačidlo na otvorenie modalu pre ÚPLNE NOVÝ TYP (napr. Maľovanie) */}
            <Button variant="outline-primary" size="sm" onClick={() => setShowCreateTypeModal(true)}>
              + Vytvoriť nový typ tréningu
            </Button>
          </div>

          <Form onSubmit={handleAddTrainingDate}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
                <Form.Label className="font-medium text-gray-700">
                  {t?.admin?.trainingType || 'Training Type'}
                </Form.Label>
                <Form.Select
                  value={newTrainingType}
                  onChange={(e) => {
                    setNewTrainingType(e.target.value);
                    // Reset témy pri zmene typu tréningu
                    setUseSessionTheme(false);
                    setSessionTheme('');
                  }}
                  className="w-full"
                >
                  <option value="">-- Select Type --</option>
                  {trainingTypes
                    .filter(type => type.active) // PRIDAŤ TENTO FILTER
                    .map(type => (
                      <option key={type.id} value={type.id}> {/* ZMENA: value je teraz type.id */}
                        {type.name}
                      </option>
                    ))}
                </Form.Select>
              </div>

              {/* Date Input */}
              <div>
                <Form.Label className="font-medium text-gray-700">{t?.admin?.date || "Date"}</Form.Label>
                <Form.Control
                  type="date"
                  value={newTrainingDate.split("T")[0] || ""}
                  onChange={(e) => {
                    const date = e.target.value;
                    const time = newTrainingDate.split("T")[1]?.substring(0, 5) || "00:00";
                    setNewTrainingDate(`${date}T${time}`);
                  }}
                />
              </div>

              {/* Time Input */}
              <div>
                <Form.Label className="font-medium text-gray-700">{t?.admin?.time || "Time"}</Form.Label>
                <Form.Control
                  type="time"
                  value={newTrainingDate.split("T")[1]?.substring(0, 5) || ""}
                  onChange={(e) => {
                    const time = e.target.value;
                    const date = newTrainingDate.split("T")[0] || "";
                    setNewTrainingDate(`${date}T${time}`);
                  }}
                />
              </div>

              <div>
                <Form.Label className="font-medium text-gray-700 text-xs">Max Part.</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />
              </div>

              {/* Téma - len pre detské tréningy */}
              {(() => {
                const selectedType = trainingTypes.find(t => t.id === parseInt(newTrainingType));
                const isChildrenType = selectedType?.audience_type === 'children';
                
                if (!isChildrenType) return null;
                
                return (
                  <div className="md:col-span-1">
                    <Form.Check
                      type="checkbox"
                      id="useTheme"
                      checked={useSessionTheme}
                      onChange={(e) => {
                        setUseSessionTheme(e.target.checked);
                        if (!e.target.checked) setSessionTheme('');
                      }}
                      label={<span className="font-medium text-gray-700 text-sm">Pridať tému</span>}
                      className="mb-1"
                    />
                    <Form.Control
                      type="text"
                      placeholder="napr. VIANOCE, HASIČI"
                      value={sessionTheme}
                      onChange={(e) => setSessionTheme(e.target.value)}
                      disabled={!useSessionTheme}
                      className={!useSessionTheme ? 'bg-gray-100' : ''}
                    />
                  </div>
                );
              })()}

              <div className="flex items-end">
                <Button type="submit" className="bg-primary-500 border-primary-500">
                  {t?.admin?.addSession || 'Add'}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}

      {/* ZOZNAM TYPOV NA ZAPNUTIE/VYPNUTIE - teraz obalené v isAdmin podmienke */}
      {isAdmin && (
        <div className="mt-8 border-t pt-6">
          <h4 className="text-lg font-semibold mb-4 text-gray-700">Manage Training Types (Active/Inactive)</h4>
          <div className="space-y-2">
            {trainingTypes.map(type => (
              <div key={type.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <span>{type.name}</span>
                  {type.audience_type && (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      type.audience_type === 'children' ? 'bg-blue-100 text-blue-800' :
                      type.audience_type === 'adults' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {type.audience_type === 'children' ? 'Deti' :
                       type.audience_type === 'adults' ? 'Dospelí' : 'Oboje'}
                    </span>
                  )}
                </div>
                <Form.Check
                  type="switch"
                  id={`active-switch-${type.id}`}
                  checked={type.active}
                  onChange={() => toggleTypeStatus(type.id, type.active)}
                  label={type.active ? "Active" : "Inactive"}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-6 font-bold text-center">
          {t?.admin?.adminModeActive || 'ADMIN MODE ACTIVE'}
        </div>
      )}

      <Modal show={showCreateTypeModal} onHide={() => setShowCreateTypeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Vytvoriť nový typ tréningu</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleCreateType}>
          <Modal.Body>
            {/* 1. Cieľová skupina - PRVÁ vec ktorú nastavíme */}
            <Form.Group className="mb-4">
              <Form.Label className="block font-bold mb-2 text-gray-700">Cieľová skupina *</Form.Label>
              <div className="flex gap-3">
                <Form.Check
                  type="radio"
                  label="Deti"
                  name="audienceType"
                  value="children"
                  checked={newAudienceType === 'children'}
                  onChange={(e) => setNewAudienceType(e.target.value)}
                  className="me-3"
                />
                <Form.Check
                  type="radio"
                  label="Dospelí"
                  name="audienceType"
                  value="adults"
                  checked={newAudienceType === 'adults'}
                  onChange={(e) => setNewAudienceType(e.target.value)}
                  className="me-3"
                />
                <Form.Check
                  type="radio"
                  label="Oboje"
                  name="audienceType"
                  value="both"
                  checked={newAudienceType === 'both'}
                  onChange={(e) => setNewAudienceType(e.target.value)}
                />
              </div>
            </Form.Group>

            <hr className="my-4" />

            {/* 2. Základné info */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <Form.Group className="col-span-2">
                <Form.Label>Názov</Form.Label>
                <Form.Control
                  required
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  placeholder="napr. Maľovanie, MIDI, Yoga"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Trvanie (min)</Form.Label>
                <Form.Control
                  type="number"
                  required
                  value={newTypeDuration}
                  onChange={e => setNewTypeDuration(e.target.value)}
                />
              </Form.Group>

              {/* Sprevádzajúca osoba - LEN pre Deti */}
              {newAudienceType === 'children' && (
                <Form.Group>
                  <Form.Label>Sprevádzajúca osoba (€)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={newAccompanyingPrice}
                    onChange={e => setNewAccompanyingPrice(e.target.value)}
                  />
                </Form.Group>
              )}
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Popis</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={newTypeDesc}
                onChange={e => setNewTypeDesc(e.target.value)}
              />
            </Form.Group>

            {/* --- NOVO PRIDANÁ ČASŤ: COLOR PICKER --- */}
            <Form.Group className="mb-4 relative">
              <Form.Label className="block font-bold mb-2 text-gray-700">Farba v kalendári</Form.Label>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer shadow-sm hover:scale-105 transition-transform"
                  style={{ backgroundColor: newTypeColor }}
                />
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-bold uppercase">{newTypeColor}</span>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="text-xs text-blue-600 font-semibold hover:underline text-left"
                  >
                    {showColorPicker ? 'Zavrieť výber' : 'Vybrať farbu'}
                  </button>
                </div>

                {/* Maly nahlad ako to bude vyzerat v Aktivity */}
                <div className="ml-auto hidden sm:block">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Náhľad v rozvrhu</div>
                  <div
                    className="px-3 py-1 rounded text-[11px] font-black uppercase border-l-4"
                    style={{
                      backgroundColor: `${newTypeColor}25`,
                      borderColor: newTypeColor,
                      color: '#1f2937'
                    }}
                  >
                    {newTypeName || 'Tréning'}
                  </div>
                </div>
              </div>

              {showColorPicker && (
                <div className="absolute z-50 mt-2 bg-white p-3 rounded-xl shadow-2xl border border-gray-100">
                  <HexColorPicker color={newTypeColor} onChange={setNewTypeColor} />
                  <button
                    type="button"
                    className="w-full mt-3 bg-gray-900 text-white text-xs py-2 rounded-lg font-bold"
                    onClick={() => setShowColorPicker(false)}
                  >
                    Potvrdiť
                  </button>
                </div>
              )}
            </Form.Group>

            <hr className="my-4" />

            {/* 3. Stratégia cien - podľa cieľovej skupiny */}
            <h6 className="font-bold mb-3">Cenová stratégia</h6>
            
            {/* Pre Dospelých alebo Oboje - LEN fixná cena */}
            {(newAudienceType === 'adults' || newAudienceType === 'both') ? (
              <div className="bg-gray-50 p-3 rounded border">
                <Form.Group>
                  <Form.Label className="font-bold text-primary-600">
                    {newAudienceType === 'adults' ? 'Cena za osobu (€)' : 'Fixná cena (€)'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={fixedPricePerChild}
                    onChange={e => setFixedPricePerChild(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    {newAudienceType === 'adults' 
                      ? 'Jednotná cena pre dospelých.' 
                      : 'Jednotná fixná cena pre všetkých účastníkov.'}
                  </Form.Text>
                </Form.Group>
              </div>
            ) : (
              /* Pre Deti - výber medzi fixnou a stupňovanou cenou */
              <>
                <div className="flex gap-4 mb-4">
                  <Form.Check
                    type="radio"
                    label="Fixná cena za dieťa"
                    name="pricingMode"
                    id="modeFixed"
                    checked={pricingMode === 'fixed'}
                    onChange={() => setPricingMode('fixed')}
                  />
                  <Form.Check
                    type="radio"
                    label="Vlastné / stupňované zľavy"
                    name="pricingMode"
                    id="modeTiered"
                    checked={pricingMode === 'tiered'}
                    onChange={() => setPricingMode('tiered')}
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded border">
                  {pricingMode === 'fixed' ? (
                    <Form.Group>
                      <Form.Label className="font-bold text-primary-600">Cena za 1 dieťa (€)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={fixedPricePerChild}
                        onChange={e => setFixedPricePerChild(e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        Systém automaticky vypočíta:
                        2 deti = €{(fixedPricePerChild * 2).toFixed(2)},
                        3 deti = €{(fixedPricePerChild * 3).toFixed(2)}
                      </Form.Text>
                    </Form.Group>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 items-start sm:grid-cols-3">
                      <Form.Group className="mb-0 min-w-0">
                        <Form.Label>1 dieťa (€)</Form.Label>
                        <Form.Control
                          className="w-full"
                          type="number"
                          value={newTypePrice1}
                          onChange={e => setNewTypePrice1(e.target.value)}
                        />
                      </Form.Group>

                      <Form.Group className="mb-0 min-w-0">
                        <Form.Label>2 deti (€)</Form.Label>
                        <Form.Control
                          className="w-full"
                          type="number"
                          value={newTypePrice2}
                          onChange={e => setNewTypePrice2(e.target.value)}
                        />
                      </Form.Group>

                      <Form.Group className="mb-0 min-w-0">
                        <Form.Label>3 deti (€)</Form.Label>
                        <Form.Control
                          className="w-full"
                          type="number"
                          value={newTypePrice3}
                          onChange={e => setNewTypePrice3(e.target.value)}
                        />
                      </Form.Group>
                      <div className="col-span-1 sm:col-span-3">
                        <Form.Text className="text-muted">Nastavte konkrétne ceny pre zľavu súrodencov.</Form.Text>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateTypeModal(false)}>
              Zavrieť
            </Button>
            <Button type="submit" variant="primary">
              Vytvoriť typ
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>


      {/* 2. USER BOOKING FORM */}
      <Form onSubmit={handleSubmit} className="space-y-6">
        {isCreditMode && selectedCredit && isMiniMidiMaxiCredit(selectedCredit) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900">
            <strong>Tento kredit mozete vyuzivat na hodiny MINI, MIDI alebo MAXI.</strong>
          </div>
        )}

        <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200">
          <div className="bg-gray-100 bg-opacity-50 border-b border-gray-300 px-6 py-4">
            <h5 className="text-lg font-bold text-gray-800">
              {t?.booking?.trainingDetails || 'Training Details'}
            </h5>
          </div>

          <div className="p-6">
            <Form.Group className="mb-6">
              <Form.Label className="font-bold text-gray-800">
                {t?.booking?.trainingType?.label || 'Select Training Type'} <span className="text-red-500">*</span>
              </Form.Label>
              <Form.Select
                value={trainingTypeId} // Zmena: viazané na ID
                onChange={handleTypeChange}
                disabled={Boolean(lockedReservation)}
                className="w-full text-lg py-3"
              >
                <option value="">{t?.booking?.trainingType?.placeholder || 'Choose training type...'}</option>
                {selectableTrainingTypes
                  .map(type => (
                    <option key={type.id} value={type.id}> {/* Zmena: value={type.id} */}
                      {type.name} {type.duration_minutes ? `(${type.duration_minutes} min)` : ''} {!type.active ? '(Inactive)' : ''}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-6">
              <Form.Label className="font-bold text-gray-800">
                {t?.booking?.selectDate || 'Select Available Date'} <span className="text-red-500">*</span>
              </Form.Label>
              <div className="flex justify-center">
                <div className="max-w-md w-full">
                  <CustomCalendar
                    trainingDates={trainingDates}
                    trainingType={trainingType}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    minDate={new Date()}
                    disabled={Boolean(lockedReservation)}
                    weekendClassName="bg-gray-100"
                  />
                </div>
              </div>
            </Form.Group>

            {selectedDate && trainingType && trainingDates[trainingType]?.[selectedDate] && (
              <Form.Group className="mb-4" ref={timeSelectRef}>
                <Form.Label className="font-bold text-gray-800">
                  {t?.booking?.selectTime || 'Select Time Slot'} <span className="text-red-500">*</span>
                </Form.Label>
                <Form.Select
                  value={trainingId || ""} // Value je teraz ID
                  onChange={handleTimeSlotSelect}
                  disabled={Boolean(lockedReservation)}
                  className="w-full text-lg py-3"
                >
                  <option value="">-- {t?.booking?.selectTime || 'Choose a Time Slot'} --</option>
                  {trainingDates[trainingType][selectedDate].map((session) => (
                    <option key={session.id} value={session.id}> {/* Value je ID */}
                      {session.time} {/* User vidí ČAS */}
                    </option>
                  ))}
                </Form.Select>
                
                {/* Zobrazenie témy ak je vybraný čas a existuje téma */}
                {(() => {
                  const selectedSession = trainingId && trainingDates[trainingType][selectedDate]
                    ? trainingDates[trainingType][selectedDate].find(s => String(s.id) === String(trainingId))
                    : null;
                  
                  if (selectedSession?.theme) {
                    return (
                      <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                        <p className="text-black font-bold">
                          Téma: {selectedSession.theme}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </Form.Group>
            )}

            {!availability.isAvailable && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4 flex items-center">
                <div className="text-yellow-800">
                  <div className="font-bold">
                    {t?.booking?.availability?.warning || 'Availability Warning'}:
                  </div>
                  <div className="mt-1">{formatAvailabilityMessage()}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200">
          <div className="bg-gray-100 bg-opacity-50 border-b border-gray-300 px-6 py-4">
            <h5 className="text-lg font-bold text-gray-800">
              {t?.booking?.personalInfo || 'Personal Information'}
            </h5>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Form.Group className="mb-4">
                  <Form.Label className="font-bold text-gray-800">
                    {t?.booking?.name || 'Your Name'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={userData ? `${userData.first_name} ${userData.last_name}` : ''}
                    readOnly
                    className="bg-gray-100"
                  />
                </Form.Group>
              </div>
              <div>
                <Form.Group className="mb-4">
                  <Form.Label className="font-bold text-gray-800">
                    {t?.booking?.email || 'Your Email'}
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={userData ? userData.email : ''}
                    readOnly
                    className="bg-gray-100"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Form.Group className="mb-4">
                  <Form.Label className="font-bold text-gray-800">
                    {t?.booking?.mobile || 'Mobile Number'}
                  </Form.Label>
                  <IMaskInput
                    mask="+421 000 000 000"
                    definitions={{ '0': /[0-9]/ }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={mobile}
                    onAccept={(value) => setMobile(value)}
                    placeholder={t?.booking?.mobilePlaceholder || '+421 xxx xxx xxx'}
                  />
                </Form.Group>
              </div>
              <div>
                <Form.Group className="mb-4">
                  <Form.Label className="font-bold text-gray-800">
                    {t?.booking?.address || 'Address'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={userData ? userData.address : ''}
                    readOnly
                    className="bg-gray-100"
                  />
                </Form.Group>
              </div>
            </div>
          </div>
        </div>

        {/* Children Information Card */}
        {ageGroup === 'child' && (
          <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200">
            <div className="bg-gray-100 bg-opacity-50 border-b border-gray-300 px-6 py-4">
              <h5 className="text-lg font-bold text-gray-800">
                {t?.booking?.childrenInfo || 'Children Information'}
              </h5>
            </div>
            <div className="p-6">
              <Form.Group className="mb-6">
                <Form.Label className="font-bold text-gray-800">
                  {t?.booking?.childrenCount || 'Number of Children'} <span className="text-red-500">*</span>
                </Form.Label>
                <Form.Select
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(parseInt(e.target.value))}
                  required
                  disabled={isCreditMode}
                  className="w-full text-lg py-3"
                >
                  {/* Dynamické generovanie možností 1, 2, 3 */}
                  {[1, 2, 3].map(num => {
                    // 1. Zistíme cenu pre daný počet detí z aktuálneho typu tréningu
                    const priceObj = currentType?.prices?.find(p => p.child_count === num);
                    // 2. Ak ešte nie je vybraný typ, alebo cena chýba, dáme '?' alebo 0
                    const displayPrice = priceObj ? priceObj.price : 0;

                    // 3. Text pre dieťa/deti
                    const childLabel = num === 1
                      ? (t?.booking?.child || 'Child')
                      : (t?.booking?.children || 'Children');

                    return (
                      <option key={num} value={num}>
                        {num} {childLabel}{!useSeasonTicket && ` - €${displayPrice}`}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="font-bold text-gray-800">
                  {t?.booking?.childrenAge || 'Age of Children'} <span className="text-red-500">*</span>
                </Form.Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {childrenAges.map((age, index) => (
                    <div key={index} className="border border-gray-300 rounded-lg p-4">
                      <Form.Label className="font-medium text-primary-600 mb-2 block">
                        {t?.booking?.childAge?.replace('{number}', index + 1) || `${index + 1}${getOrdinalSuffix(index + 1)} Child`}
                      </Form.Label>
                      <Form.Select
                        value={age}
                        onChange={(e) => handleAgeChange(index, e.target.value)}
                        required
                        className="w-full"
                      >
                        <option value="" disabled>
                          {t?.booking?.chooseAge || 'Select age'}
                        </option>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((ageOption) => (
                          <option key={ageOption} value={ageOption}>
                            {ageOption} {getYearLabel(ageOption)}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  ))}
                </div>
              </Form.Group>
            </div>
          </div>
        )}

        {/* Additional Options Card */}
        <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200">
          <div className="bg-gray-100 bg-opacity-50 border-b border-gray-300 px-6 py-4">
            <h5 className="text-lg font-bold text-gray-800">
              {t?.booking?.additionalOptions || 'Additional Options'}
            </h5>
          </div>
          <div className="p-6">
            <Form.Group className="mb-4">
              <Form.Label className="font-bold text-gray-800">
                {t?.booking?.notes || 'Additional Notes'}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t?.booking?.notesPlaceholder || 'Any special requirements, allergies, or additional information...'}
                className="w-full py-3"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              {/* Accompanying Person - Only for child age group */}
              {ageGroup === 'child' && (
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                  <Form.Check
                    type="checkbox"
                    id="accompanyingPerson"
                    checked={accompanyingPerson}
                    onChange={
                      isCreditMode
                        ? undefined
                        : () => setAccompanyingPerson(!accompanyingPerson)
                    }
                    disabled={isCreditMode || (useSeasonTicket && selectedSeasonTicket)}
                    label={
                      <div>
                        <span className="font-bold text-gray-800">
                          {t?.booking?.accompanyingPerson || 'Participation of Accompanying Person'} (3€)
                        </span>
                        {accompanyingPerson && (
                          <div className="text-gray-600 text-sm mt-1">
                            <i className="bi bi-info-circle"></i> {t?.booking?.accompanyingPersonHelp || 'An accompanying person is someone other than the parent who accompanies the child.'}
                          </div>
                        )}
                        {isCreditMode && (
                          <div className="text-blue-600 text-sm mt-1">
                            <i className="bi bi-info-circle"></i> {t?.booking?.creditModeReadOnly || 'Set from original booking - read only'}
                          </div>
                        )}
                        {useSeasonTicket && selectedSeasonTicket && !isCreditMode && (
                          <div className="text-yellow-600 text-sm mt-1">
                            <i className="bi bi-exclamation-triangle"></i> {t?.booking?.notCoveredBySeasonTicket || 'Not covered by season ticket'}
                          </div>
                        )}
                      </div>
                    }
                  />
                </div>
              )}
            </Form.Group>

            {/* Season Ticket Section - For both child and adult age groups */}
            {!isCreditMode && seasonTickets.length > 0 && (
              <Form.Group className="mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Form.Check
                    type="checkbox"
                    id="useSeasonTicket"
                    checked={useSeasonTicket}
                    onChange={() => {
                      setUseSeasonTicket(!useSeasonTicket);
                      setSelectedSeasonTicket('');
                    }}
                    disabled={availableSeasonTickets.length === 0}
                    label={
                      <span className="font-bold text-gray-800">
                        <i className="bi bi-ticket-perforated me-2"></i>
                        {t?.booking?.useSeasonTicket || 'Use Season Ticket'}
                      </span>
                    }
                  />
                  {availableSeasonTickets.length === 0 && (
                    <div className="text-sm text-gray-600 mt-2">
                      {t?.booking?.noSeasonTicketForType || 'Pre tento tréning nemáte žiadnu permanentku.'}
                    </div>
                  )}
                  {useSeasonTicket && (
                    <div className="mt-4">
                      <Form.Label className="font-medium text-gray-700">
                        {t?.booking?.selectSeasonTicket || 'Select Season Ticket'} <span className="text-red-500">*</span>
                      </Form.Label>
                      <Form.Select
                        value={selectedSeasonTicket}
                        onChange={(e) => setSelectedSeasonTicket(e.target.value)}
                        required={useSeasonTicket}
                        className="w-full text-xs sm:text-sm md:text-base py-3"
                        style={{ whiteSpace: 'normal' }}
                      >
                        <option value="">{t?.booking?.selectSeasonTicket || 'Choose a Season Ticket'}</option>
                        {availableSeasonTickets.map((ticket) => (
                          <option key={ticket.id} value={ticket.id}>
                            {t?.booking?.seasonTicketOption || 'Season Ticket'} #{ticket.id}
                            {ticket.product_name || ticket.product_code ? ` - ${ticket.product_name || ticket.product_code}` : ''}
                            ({t?.booking?.seasonTicketEntries?.replace('{count}', ticket.entries_remaining) || `Entries: ${ticket.entries_remaining}`})
                            {ticket.entries_remaining < (ageGroup === 'adult' ? 1 : childrenCount) && (
                              ` - ${(t?.booking?.notEnoughEntries || 'Nedostatok vstupov vo vašej permanentke. Potrebujete: {needed}, Dostupné: {available}').replace('{needed}', ageGroup === 'adult' ? 1 : childrenCount).replace('{available}', ticket.entries_remaining)}`
                            )}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  )}
                </div>
              </Form.Group>
            )}
          </div>
        </div>

        {/* Consents and Agreements Card */}
        <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200">
          <div className="bg-gray-100 bg-opacity-50 border-b border-gray-300 px-6 py-4">
            <h5 className="text-lg font-bold text-gray-800">
              {t?.booking?.consents || 'Consents and Agreements'}
            </h5>
          </div>
          <div className="p-6">
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="photoConsent"
                checked={photoConsent === true}
                onChange={e => setPhotoConsent(e.target.checked ? true : null)}
                label={
                  <span className="text-sm text-gray-700 leading-relaxed">
                    {ageGroup === 'child' ? (
                      <>
                        Ako zákonní zástupcovia dieťaťa udeľujeme občianske združenie Nitráčik o.z. súhlas na spracúvanie fotografií, videí nášho dieťaťa. Informáciu o podmienkach spracúvania osobných údajov nájdete{' '}
                        <a
                          href="/photo-consent-info"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-bold underline hover:no-underline transition-colors"
                        >
                          TU
                        </a>
                      </>
                    ) : (
                      <>
                        Udeľujem súhlas so spracúvaním fotografií a videí môjej osoby počas tréningu. Informáciu o podmienkach spracúvania osobných údajov nájdete{' '}
                        <a
                          href="/photo-consent-info"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-bold underline hover:no-underline transition-colors"
                        >
                          TU
                        </a>
                      </>
                    )}
                  </span>
                }
              />
            </Form.Group>


            {/* Checkbox - Service Consent (only for card payments) */}
            {!useSeasonTicket && !isCreditMode && (
              <Form.Group className="mb-4">
                <Form.Check
                  type="checkbox"
                  id="serviceConsent"
                  checked={serviceConsent}
                  onChange={() => setServiceConsent(!serviceConsent)}
                  required
                  label={
                    <span className="text-sm text-gray-700 leading-relaxed font-semibold">
                      Súhlasím so{' '}
                      <button
                        type="button"
                        onClick={() => setShowServiceConsentModal(true)}
                        className="text-primary-600 hover:text-primary-700 underline font-medium px-0 inline"
                        style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
                      >
                        začatím poskytovania služby
                      </button>
                      {' '}pred uplynutím lehoty na odstúpenie od zmluvy. (povinné)
                    </span>
                  }
                />
              </Form.Group>
            )}

            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={() => setConsent(!consent)}
                required
                  label={
                    <span className="text-sm text-gray-700 leading-relaxed font-semibold">
                      Vyjadrujem súhlas so{' '}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 underline font-medium"
                      >
                        Všeobecnými obchodnými podmienkami
                      </a>
                      {' '}a beriem na vedomie, že Informáciu o spracúvaní osobných údajov nájdem{' '}
                      <a
                        href="/gdpr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 underline font-medium"
                      >
                        TU
                      </a>.
                      {' '}<span className="font-semibold">(povinné)</span>
                    </span>
                  }
                style={{ marginBottom: '24px' }}
              />
            </Form.Group>
          </div>
        </div>

        {/* Pricing and Submission Card */}
        <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200 mb-8">
          <div className="p-6 text-center">
            {!useSeasonTicket && !isCreditMode && (
              <div className="mb-6">
                <h4 className="text-2xl font-bold text-primary-600">
                  {t?.booking?.totalPrice || 'Total Price'}:
                  {/* ZMENA: Tu voláme tvoju novú funkciu */}
                  <span className="ml-2">€{calculateTotalPrice().toFixed(2)}</span>
                </h4>
                <div className="text-gray-600 text-sm mt-1">
                  {ageGroup === 'adult'
                    ? (t?.booking?.adultParticipantShort || 'adult participant')
                    : (
                      <>
                        {childrenCount} {childrenCount === 1 ? t?.booking?.child || 'child' : t?.booking?.children || 'children'}
                        {accompanyingPerson ? ` + ${t?.booking?.accompanyingPersonShort || 'accompanying person'}` : ''}
                      </>
                    )}
                </div>
              </div>
            )}

            {warningMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {warningMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-4 font-bold text-lg bg-green-500 border-green-500 hover:bg-green-600"
              disabled={!consent || loading || !availability.isAvailable || (useSeasonTicket && !selectedSeasonTicket) || (isCreditMode && (!selectedDate || !selectedTime)) || (!useSeasonTicket && !isCreditMode && !serviceConsent)}
              data-tooltip-id="booking-tooltip"
              data-tooltip-content={
                !availability.isAvailable
                  ? formatAvailabilityMessage()
                  : !consent
                    ? t?.booking?.consentRequired || 'You must agree to the rules to complete the booking.'
                    : useSeasonTicket && !selectedSeasonTicket
                      ? t?.booking?.selectSeasonTicketRequired || 'Please select a season ticket.'
                      : isCreditMode && (!selectedDate || !selectedTime)
                        ? t?.booking?.selectDateTimeRequired || 'Please select date and time for your credit booking.'
                        : ''
              }
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                  {t?.booking?.processing || 'Processing...'}
                </>
              ) : (
                <div>
                  {isCreditMode ? (
                    <>
                      <i className="bi bi-ticket-perforated me-2"></i>
                      {t?.booking?.bookWithCredit || 'Book with Credit'}
                    </>
                  ) : useSeasonTicket ? (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      {t?.booking?.bookWithSeasonTicket || 'Book with Season Ticket'}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-credit-card me-2"></i>
                      {t?.booking?.bookWithPayment || 'Confirm reservation'}
                    </>
                  )}
                </div>
              )}
            </Button>
            <Tooltip id="booking-tooltip" />

            {!isCreditMode && !useSeasonTicket && (
              <div className="mt-2">
                <div className="text-gray-800 text-base font-semibold">
                  {'| '}{t?.booking?.paymentObligation || 'with payment obligation'}{' |'}
                </div>
              </div>
            )}

            <div className="mt-4">

              <div className="text-gray-600 text-sm mt-8">
                {'🔒 '}{t?.booking?.secureBooking || 'Your booking is secure and protected'}
              </div>
            </div>
          </div>
        </div>
      </Form>

      <Modal show={showDuplicateBookingModal} onHide={handleDuplicateBookingCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t?.booking?.duplicateBookingTitle || 'Duplicate booking confirmation'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0 text-gray-700">
            {duplicateBookingModalContext?.source === 'pending'
              ? 'Na tento termín už máte rozpracovanú rezerváciu. Dokončite platbu.'
              : duplicateBookingModalContext?.source === 'activity' || duplicateBookingModalContext?.source === 'backend' || duplicateBookingModalContext?.source === 'selection'
              ? t?.booking?.duplicateBookingSessionMessage || 'You already have a booking for this session. Do you really want to create another one?'
              : t?.booking?.duplicateBookingDateMessage || 'You already have a booking on this date. Do you really want to continue and create another one?'}
          </p>
          {duplicateBookingModalContext?.source === 'pending' && pendingExistingBookingId && (
            <p className="mt-2 mb-0 text-sm text-gray-500">ID rezervácie: {pendingExistingBookingId}</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDuplicateBookingCancel}>
            {duplicateBookingModalContext?.source === 'pending'
              ? 'Zrušiť'
              : duplicateBookingModalContext?.source === 'activity'
              ? t?.booking?.duplicateBookingBackToActivities || t?.activities?.backToActivities || 'Back to activities'
              : t?.booking?.duplicateBookingCancel || t?.booking?.cancel || 'No'}
          </Button>
          <Button variant="primary" onClick={handleDuplicateBookingConfirm}>
            {duplicateBookingModalContext?.source === 'pending'
              ? 'Dokončiť platbu'
              : t?.booking?.duplicateBookingConfirm || 'Yes, continue'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Credit Selection Modal */}
      {(ageGroup === 'child' || ageGroup === 'adult') && (
        <Modal show={showCreditModal} onHide={() => {
          setShowCreditModal(false);
          setFillFormPreference({});
        }}>
          <Modal.Header closeButton>
            <Modal.Title>{t?.booking?.chooseCredit || 'Choose Your Credit'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {(ageGroup === 'child' ? childCredits : adultCredits).length === 0 ? (
              <p>{t?.booking?.noCredits || 'No credits available.'}</p>
            ) : (
              (ageGroup === 'child' ? childCredits : adultCredits).map((credit) => (
                <div key={credit.id} className="mb-4 p-4 border border-gray-300 rounded-lg">
                  <p><strong>{t?.booking?.originalDate || 'Original Date'}:</strong> {new Date(credit.original_date).toLocaleString()}</p>
                  <p><strong>{t?.booking?.children || 'Children'}:</strong> {credit.child_count} | <strong>{t?.booking?.accompanyingPerson || 'Accompanying Person'}:</strong> {credit.accompanying_person ? 'Yes' : 'No'}</p>
                  <p><strong>{t?.booking?.trainingType?.label || 'Training Type'}:</strong> {credit.training_type}</p>
                  {isMiniMidiMaxiCredit(credit) && (
                    <p className="text-amber-700 font-semibold">Tento kredit mozete vyuzivat na hodiny MINI, MIDI alebo MAXI.</p>
                  )}
                  <p><strong>{t?.booking?.photoConsent || 'Photo Consent'}:</strong> {credit.photo_consent ? 'Agreed' : 'Disagreed'}</p>
                  {credit.mobile && <p><strong>{t?.booking?.mobile || 'Mobile'}:</strong> {credit.mobile}</p>}
                  {credit.note && <p><strong>{t?.booking?.notes || 'Notes'}:</strong> {credit.note}</p>}

                  <Form.Check
                    type="checkbox"
                    id={`fill-form-${credit.id}`}
                    label={t?.booking?.fillFormFromOriginal || 'Fill in the form based on the original booking'}
                    className="mb-3 mt-3"
                    checked={fillFormPreference[credit.id] || false}
                    onChange={(e) => {
                      setFillFormPreference(prev => ({
                        ...prev,
                        [credit.id]: e.target.checked
                      }));
                    }}
                  />

                  <Button
                    variant="primary"
                    onClick={() => selectCredit(credit, fillFormPreference[credit.id] || false)}
                    className="w-full"
                  >
                    {t?.booking?.useThisCredit || 'Use this credit'}
                  </Button>
                </div>
              ))
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowCreditModal(false);
              setFillFormPreference({});
            }}>
              {t?.booking?.cancel || 'Cancel'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Service Consent Modal */}
      {showServiceConsentModal && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{t?.booking?.serviceConsentTitle || 'Súhlas so začatím poskytovania služby'}</h2>
              <button
                onClick={closeServiceConsentModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 text-gray-700 leading-relaxed text-sm">
              <p>
                Podľa zákona č. 108/2024 Z.z. o ochrane spotrebiteľa týmto žiadam a udeľujem prevádzkovateľovi Nitráčik, o.z., IČO: 56374453 výslovný súhlas so začatím poskytovania služby pred uplynutím lehoty na odstúpenie od zmluvy a súčasne vyhlasujem, že som bol riadne poučený, že udelením tohto súhlasu strácam ako spotrebiteľ právo na odstúpenie od zmluvy po úplnom poskytnutí služby podľa § 19 ods. 1 písm. a) zákona č. 108/2024 Z.z. o ochrane spotrebiteľa v platnom znení.
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={closeServiceConsentModal}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Rozumiem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;