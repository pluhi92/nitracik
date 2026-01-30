// Booking.js
import React, { useState, useEffect, useRef } from 'react';
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

const Booking = () => {
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
  const [fillFormPreference, setFillFormPreference] = useState({});
  const [userBookings, setUserBookings] = useState([]);
  const [isAlreadyBooked, setIsAlreadyBooked] = useState(false);
  const [trainingId, setTrainingId] = useState(null);
  const [newTypeDuration, setNewTypeDuration] = useState(60); // Default 60 min
  const [pricingMode, setPricingMode] = useState('tiered'); // 'fixed' alebo 'tiered'
  const [fixedPricePerChild, setFixedPricePerChild] = useState(15); // Pre fixný režim

  const calculateTotalPrice = () => {
    if (!selectedTypeObj || !childrenCount) return 0;

    const priceObj = selectedTypeObj.prices.find(p => p.child_count === childrenCount);
    let basePrice = priceObj ? parseFloat(priceObj.price) : 0;

    if (accompanyingPerson) {
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

  const timeSelectRef = useRef(null);

  useEffect(() => {
    if (useSeasonTicket && selectedSeasonTicket) {
      setAccompanyingPerson(false);
    }
  }, [useSeasonTicket, selectedSeasonTicket]);

  useEffect(() => {
    const allowedTypes = ['MIDI', 'MAXI'];

    // Ak je vybratý tréning, ktorý NIE JE MIDI/MAXI, a zároveň máš zaškrtnutú permanentku:
    if (!allowedTypes.includes(trainingType) && useSeasonTicket) {
      setUseSeasonTicket(false);      // Odškrtni checkbox
      setSelectedSeasonTicket('');    // Vynuluj výber konkrétnej permanentky
    }
  }, [trainingType, useSeasonTicket]); // Sleduje zmeny typu tréningu a checkboxu

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

  useEffect(() => {
    const fetchTrainingDates = async () => {
      try {
        const response = await api.get('/api/training-dates');
        const dates = response.data.reduce((acc, training) => {
          const date = new Date(training.training_date).toLocaleDateString('en-CA');
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

    const fetchTypes = async () => {
      const response = await api.get(
        `/api/training-types?admin=${isAdmin}`
      );
      setTrainingTypes(response.data);
    };

    if (isLoggedIn) {
      fetchTrainingDates();
      fetchSeasonTickets();
      fetchCredits();
      fetchUserBookings();
      fetchTypes();
    }
  }, [isLoggedIn, isAdmin]);

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
      await api.post('/api/set-training', {
        trainingType: newTrainingType,
        trainingDate: newTrainingDate,
        maxParticipants: parseInt(maxParticipants),
      });

      const fetchResponse = await api.get('/api/training-dates');
      const updatedDates = processTrainingDates(fetchResponse.data);
      setTrainingDates(updatedDates);

      setNewTrainingDate('');
      setMaxParticipants(10);

      alert('Training date added successfully!');
    } catch (error) {
      console.error('Error adding training date:', error);
      alert(`Failed to add training date: ${error.response?.data?.error || error.message}`);
    }
  };

  const processTrainingDates = (data) => {
    return data.reduce((acc, training) => {
      const date = new Date(training.training_date).toLocaleDateString('en-CA');
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
      acc[training.training_type][date].push({ time, id: training.id });
      return acc;
    }, {});
  };

  const handleCreateType = async (e) => {
    e.preventDefault();

    // Príprava cien podľa zvoleného režimu
    let calculatedPrices = [];

    if (pricingMode === 'fixed') {
      // Ak je fixná cena, vypočítame násobky
      const price = parseFloat(fixedPricePerChild);
      calculatedPrices = [
        { child_count: 1, price: price },
        { child_count: 2, price: price * 2 },
        { child_count: 3, price: price * 3 },
      ];
    } else {
      // Ak sú množstevné zľavy, berieme manuálne vstupy
      calculatedPrices = [
        { child_count: 1, price: newTypePrice1 },
        { child_count: 2, price: newTypePrice2 },
        { child_count: 3, price: newTypePrice3 },
      ];
    }

    try {
      await api.post('/api/admin/training-types', {
        name: newTypeName,
        description: newTypeDesc,
        durationMinutes: parseInt(newTypeDuration), // Posielame dĺžku trvania
        accompanyingPrice: parseFloat(newAccompanyingPrice),
        colorHex: newTypeColor,
        prices: calculatedPrices
      });

      alert("New Training Type Created!");
      setShowCreateTypeModal(false);

      // Reset formulára na defaulty
      setNewTypeName('');
      setNewTypeDesc('');
      setNewTypeDuration(60);
      setNewTypeColor('#3b82f6');
      setPricingMode('tiered');

      const response = await api.get(`/api/training-types?admin=true`);
      setTrainingTypes(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to create type");
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
    const newId = e.target.value; // Teraz to bude ID (číslo/string)
    setTrainingTypeId(newId);     // Nastavíme ID -> useEffect hore sa postará o zvyšok

    // Reset výberov
    setSelectedDate('');
    setSelectedTime('');
  };

  useEffect(() => {
    // Resetujeme stav pri zmene
    setIsAlreadyBooked(false);

    // Ak je zobrazená hláška o duplicite, vymažeme ju
    if (warningMessage === (t?.booking?.alreadyBooked || 'You are already booked for this session. Please check your profile.')) {
      setWarningMessage('');
    }

    if (trainingType && selectedDate && selectedTime && userBookings.length > 0) {
      const alreadyBooked = userBookings.some(booking => {
        if (booking.active === false) return false;

        const bookingDateObj = new Date(booking.training_date);
        const bDate = bookingDateObj.toLocaleDateString('en-CA');
        const bTime = bookingDateObj.toLocaleTimeString('sk-SK', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        return booking.training_type === trainingType &&
          bDate === selectedDate &&
          bTime === selectedTime;
      });

      if (alreadyBooked) {
        setIsAlreadyBooked(true);
        setWarningMessage(t?.booking?.alreadyBooked || 'You are already booked for this session. Please check your profile.');
      }
    }
    // eslint-disable-next-line
  }, [trainingType, selectedDate, selectedTime, userBookings, t]);

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
    if (location.state) {
      const {
        incomingId,
        incomingTypeId, // NOVÉ
        incomingType,
        incomingDate,
        incomingTime
      } = location.state;

      if (incomingDate) setSelectedDate(incomingDate);
      if (incomingTime) setSelectedTime(incomingTime);
      if (incomingId) setTrainingId(incomingId);

      // LOGIKA PRE TYP TRÉNINGU
      if (incomingTypeId) {
        // Ak máme ID (ideálna situácia), nastavíme ID
        setTrainingTypeId(incomingTypeId);
      } else if (incomingType && trainingTypes.length > 0) {
        // Fallback: Ak máme len názov (napr. starý odkaz), nájdeme ID
        const found = trainingTypes.find(t => t.name === incomingType);
        if (found) setTrainingTypeId(found.id);
      }

      // Vyčistenie history
      window.history.replaceState({}, document.title);
    }
  }, [location, trainingTypes]); // Pridané trainingTypes do závislosti

  const handleAgeChange = (index, age) => {
    const newAges = [...childrenAges];
    newAges[index] = age === '' ? '' : parseInt(age);
    setChildrenAges(newAges);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWarningMessage('');

    if (isCreditMode) {
      if (childrenAges.some(age => age === '')) {
        setWarningMessage(t?.booking?.selectAllAges || 'Please select an age for all children.');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/get-session-id', {
          params: {
            training_type: trainingType,
            date: selectedDate,
            time: selectedTime,
          },
        });
        const newSessionId = response.data.id;

        await api.post('/api/bookings/use-credit', {
          creditId: selectedCredit.id,
          trainingId: newSessionId,
          childrenAges: childrenAges.join(', '),
          photoConsent: photoConsent,
          mobile: mobile,
          note: note,
          accompanyingPerson: accompanyingPerson
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

    if (childrenAges.some(age => age === '')) {
      setWarningMessage(t?.booking?.selectAllAges || 'Please select an age for all children.');
      setLoading(false);
      return;
    }

    const childrenAgeString = childrenAges.join(', ');

    try {
      if (useSeasonTicket && selectedSeasonTicket) {
        const selectedTicket = seasonTickets.find(ticket => ticket.id === parseInt(selectedSeasonTicket));

        if (!selectedTicket) {
          setWarningMessage(t?.booking?.seasonTicketNotFound || 'Selected season ticket not found');
          setLoading(false);
          return;
        }

        if (selectedTicket.entries_remaining < childrenCount) {
          setWarningMessage(
            t?.booking?.notEnoughEntries?.replace('{needed}', childrenCount)?.replace('{available}', selectedTicket.entries_remaining) ||
            `Not enough entries in your season ticket. Needed: ${childrenCount}, Available: ${selectedTicket.entries_remaining}`
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
          trainingId,
          trainingType,
          selectedDate,
          selectedTime,
          childrenCount,
          childrenAge: childrenAgeString,
          photoConsent,
          mobile,
          note,
          accompanyingPerson: false,
        });

        if (response.data.success) {
          alert(t?.booking?.seasonTicketSuccess || 'Booking created using season ticket!');
          navigate('/profile');
        }
      } else {
        const paymentSession = await api.post('/api/create-payment-session', {
          userId: userData.id,
          trainingId,
          trainingType,
          selectedDate,
          selectedTime,
          childrenCount,
          childrenAge: childrenAgeString,
          totalPrice: calculateTotalPrice(),
          photoConsent,
          mobile,
          note,
          accompanyingPerson,
        });

        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: paymentSession.data.sessionId,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Booking error:', error);

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
    setSelectedDate(formattedDate);
    setSelectedTime('');

    // Scroll to time select after state update
    setTimeout(() => {
      if (timeSelectRef.current) {
        timeSelectRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
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

  const currentType = trainingTypes.find(t => t.name === trainingType);

  const selectCredit = (credit, fillForm = false) => {
    setSelectedCredit(credit);
    setTrainingType(credit.training_type);
    setChildrenCount(credit.child_count);
    setAccompanyingPerson(credit.accompanying_person === true);

    let parsedAges = [];
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

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4 sm:px-6">
      <h2 className="text-3xl font-bold text-center text-primary-600 mb-8">
        {t?.booking?.title || 'Book Your Training'}
      </h2>

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
          onClick={() => navigate('/season-tickets')}
        >
          {t?.booking?.seasonTickets || 'Purchase Season Ticket'}
        </button>
      </div>

      {credits.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-6">
          <strong className="text-blue-800 text-lg">
            {t?.booking?.youHaveCredit || 'You have'} {credits.length}{' '}
            {credits.length === 1 ? 'credit' : 'credits'}!
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <Form.Label className="font-medium text-gray-700">
                  {t?.admin?.trainingType || 'Training Type'}
                </Form.Label>
                <Form.Select
                  value={newTrainingType}
                  onChange={(e) => setNewTrainingType(e.target.value)}
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

              <div className="md:col-span-1 flex items-end gap-2">
                <div className="flex-grow">
                  <Form.Label className="font-medium text-gray-700 text-xs">Max Part.</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                  />
                </div>
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
                <span>{type.name}</span>
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
          <Modal.Title>Create New Training Type</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleCreateType}>
          <Modal.Body>
            {/* 1. Základné info */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <Form.Group className="col-span-2">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  required
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  placeholder="e.g. Painting, MIDI, Yoga"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Duration (min)</Form.Label>
                <Form.Control
                  type="number"
                  required
                  value={newTypeDuration}
                  onChange={e => setNewTypeDuration(e.target.value)}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Accompanying Person (€)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={newAccompanyingPrice}
                  onChange={e => setNewAccompanyingPrice(e.target.value)}
                />
              </Form.Group>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={newTypeDesc}
                onChange={e => setNewTypeDesc(e.target.value)}
              />
            </Form.Group>

            {/* --- NOVO PRIDANÁ ČASŤ: COLOR PICKER --- */}
            <Form.Group className="mb-4 relative">
              <Form.Label className="block font-bold mb-2 text-gray-700">Calendar Color</Form.Label>
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
                    {showColorPicker ? 'Close Picker' : 'Choose Color'}
                  </button>
                </div>

                {/* Malý náhľad ako to bude vyzerať v Schedule */}
                <div className="ml-auto hidden sm:block">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Schedule Preview</div>
                  <div
                    className="px-3 py-1 rounded text-[11px] font-black uppercase border-l-4"
                    style={{
                      backgroundColor: `${newTypeColor}25`,
                      borderColor: newTypeColor,
                      color: '#1f2937'
                    }}
                  >
                    {newTypeName || 'Training'}
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
                    Confirm
                  </button>
                </div>
              )}
            </Form.Group>

            <hr className="my-4" />

            {/* 2. Stratégia cien */}
            <h6 className="font-bold mb-3">Pricing Strategy</h6>
            <div className="flex gap-4 mb-4">
              <Form.Check
                type="radio"
                label="Fixed Price per Child"
                name="pricingMode"
                id="modeFixed"
                checked={pricingMode === 'fixed'}
                onChange={() => setPricingMode('fixed')}
              />
              <Form.Check
                type="radio"
                label="Custom / Tiered Discounts"
                name="pricingMode"
                id="modeTiered"
                checked={pricingMode === 'tiered'}
                onChange={() => setPricingMode('tiered')}
              />
            </div>

            {/* 3. Vstupy pre ceny podľa stratégie */}
            <div className="bg-gray-50 p-3 rounded border">
              {pricingMode === 'fixed' ? (
                <Form.Group>
                  <Form.Label className="font-bold text-primary-600">Price per 1 Child (€)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={fixedPricePerChild}
                    onChange={e => setFixedPricePerChild(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    System will automatically calculate:
                    2 Children = €{(fixedPricePerChild * 2).toFixed(2)},
                    3 Children = €{(fixedPricePerChild * 3).toFixed(2)}
                  </Form.Text>
                </Form.Group>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <Form.Group>
                    <Form.Label>1 Child (€)</Form.Label>
                    <Form.Control
                      type="number"
                      value={newTypePrice1}
                      onChange={e => setNewTypePrice1(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>2 Children (€)</Form.Label>
                    <Form.Control
                      type="number"
                      value={newTypePrice2}
                      onChange={e => setNewTypePrice2(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>3 Children (€)</Form.Label>
                    <Form.Control
                      type="number"
                      value={newTypePrice3}
                      onChange={e => setNewTypePrice3(e.target.value)}
                    />
                  </Form.Group>
                  <div className="col-span-3">
                    <Form.Text className="text-muted">Set specific prices to offer discounts for siblings.</Form.Text>
                  </div>
                </div>
              )}
            </div>

          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateTypeModal(false)}>
              Close
            </Button>
            <Button type="submit" variant="primary">
              Create Type
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>


      {/* 2. USER BOOKING FORM */}
      <Form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={isCreditMode}
                className="w-full text-lg py-3"
              >
                <option value="">{t?.booking?.trainingType?.placeholder || 'Choose training type...'}</option>
                {trainingTypes
                  .filter(t => isAdmin ? true : t.active)
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
                  onChange={(e) => {
                    const id = e.target.value;
                    setTrainingId(id); // Nastavíme ID okamžite

                    // Čas si dohľadáme len kvôli vizuálnemu zobrazeniu (napr. do sumáru objednávky)
                    const sessionObj = trainingDates[trainingType][selectedDate]
                      .find(s => String(s.id) === String(id));
                    setSelectedTime(sessionObj?.time || '');
                  }}
                  className="w-full text-lg py-3"
                >
                  <option value="">-- {t?.booking?.selectTime || 'Choose a Time Slot'} --</option>
                  {trainingDates[trainingType][selectedDate].map((session) => (
                    <option key={session.id} value={session.id}> {/* Value je ID */}
                      {session.time} {/* User vidí ČAS */}
                    </option>
                  ))}
                </Form.Select>
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
                      {num} {childLabel} - €{displayPrice}
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
                        {t?.booking?.accompanyingPerson || 'Participation of Accompanying Person'}
                      </span>
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
            </Form.Group>

            {!isCreditMode && seasonTickets.length > 0 && ['MIDI', 'MAXI'].includes(trainingType) && (
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
                    label={
                      <span className="font-bold text-gray-800">
                        <i className="bi bi-ticket-perforated me-2"></i>
                        {t?.booking?.useSeasonTicket || 'Use Season Ticket'}
                      </span>
                    }
                  />
                  {useSeasonTicket && (
                    <div className="mt-4">
                      <Form.Label className="font-medium text-gray-700">
                        {t?.booking?.selectSeasonTicket || 'Select Season Ticket'} <span className="text-red-500">*</span>
                      </Form.Label>
                      <Form.Select
                        value={selectedSeasonTicket}
                        onChange={(e) => setSelectedSeasonTicket(e.target.value)}
                        required={useSeasonTicket}
                        className="w-full text-lg py-3"
                      >
                        <option value="">{t?.booking?.selectSeasonTicket || 'Choose a Season Ticket'}</option>
                        {seasonTickets.map((ticket) => (
                          <option key={ticket.id} value={ticket.id}>
                            {t?.booking?.seasonTicketOption || 'Season Ticket'} #{ticket.id}
                            ({t?.booking?.seasonTicketEntries?.replace('{count}', ticket.entries_remaining) || `Entries: ${ticket.entries_remaining}`})
                            {ticket.entries_remaining < childrenCount && (
                              <span className="text-red-500"> - {t?.booking?.notEnoughEntries || 'Not enough entries'}</span>
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
            <Form.Group className="mb-6">
              <Form.Label className="font-bold text-gray-800">
                {t?.booking?.photoConsent || 'Photo Publication Consent'} <span className="text-red-500">*</span>
              </Form.Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`border rounded-lg p-4 h-full transition-all duration-200 ${photoConsent === true
                  ? "border-green-500 bg-green-50 shadow-sm"
                  : "border-gray-300 hover:border-gray-400"
                  }`}>
                  <Form.Check
                    type="radio"
                    name="photoConsent"
                    id="photoConsentAgree"
                    checked={photoConsent === true}
                    onChange={() => setPhotoConsent(true)}
                    required
                    label={
                      <span className={photoConsent === true ? "font-bold text-green-600" : "text-gray-700"}>
                        <i className="bi bi-check-circle me-2"></i>
                        {t?.booking?.agree || 'AGREE to publish photos of my children'}
                      </span>
                    }
                  />
                </div>
                <div className={`border rounded-lg p-4 h-full transition-all duration-200 ${photoConsent === false
                  ? "border-secondary-600 bg-secondary-50 shadow-sm"
                  : "border-gray-300 hover:border-gray-400"
                  }`}>
                  <Form.Check
                    type="radio"
                    name="photoConsent"
                    id="photoConsentDisagree"
                    checked={photoConsent === false}
                    onChange={() => setPhotoConsent(false)}
                    required
                    label={
                      <span className={photoConsent === false ? "font-bold text-secondary-600" : "text-gray-700"}>
                        <i className="bi bi-x-circle me-2"></i>
                        {t?.booking?.disagree || 'DISAGREE to publish photos of my children'}
                      </span>
                    }
                  />
                </div>
              </div>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={() => setConsent(!consent)}
                required
                label={
                  <span className="text-sm text-gray-700 leading-relaxed">
                    {t.booking.consentText
                      .split('{terms}')
                      .map((part, index) => (
                        /* ZMENA: Použitie React.Fragment s kľúčom namiesto <> */
                        <React.Fragment key={index}>
                          {index === 0 ? (
                            <>
                              {part}
                              <a
                                href="/terms"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 underline font-medium"
                              >
                                {t.booking.terms}
                              </a>
                            </>
                          ) : (
                            <>
                              {part.split('{privacy}')[0]}
                              <a
                                href="/gdpr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 underline font-medium"
                              >
                                {t.booking.privacy}
                              </a>
                              {part.split('{privacy}')[1]}
                            </>
                          )}
                        </React.Fragment>
                      ))}
                  </span>
                }
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
                  {childrenCount} {childrenCount === 1 ? t?.booking?.child || 'child' : t?.booking?.children || 'children'}
                  {accompanyingPerson ? ` + ${t?.booking?.accompanyingPersonShort || 'accompanying person'}` : ''}
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
              disabled={!consent || loading || !availability.isAvailable || isAlreadyBooked || (useSeasonTicket && !selectedSeasonTicket) || (isCreditMode && (!selectedDate || !selectedTime))}
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

      {/* Credit Selection Modal */}
      <Modal show={showCreditModal} onHide={() => {
        setShowCreditModal(false);
        setFillFormPreference({});
      }}>
        <Modal.Header closeButton>
          <Modal.Title>{t?.booking?.chooseCredit || 'Choose Your Credit'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {credits.length === 0 ? (
            <p>{t?.booking?.noCredits || 'No credits available.'}</p>
          ) : (
            credits.map((credit) => (
              <div key={credit.id} className="mb-4 p-4 border border-gray-300 rounded-lg">
                <p><strong>{t?.booking?.originalDate || 'Original Date'}:</strong> {new Date(credit.original_date).toLocaleString()}</p>
                <p><strong>{t?.booking?.children || 'Children'}:</strong> {credit.child_count} | <strong>{t?.booking?.accompanyingPerson || 'Accompanying Person'}:</strong> {credit.accompanying_person ? 'Yes' : 'No'}</p>
                <p><strong>{t?.booking?.trainingType?.label || 'Training Type'}:</strong> {credit.training_type}</p>
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
    </div>
  );
};

export default Booking;