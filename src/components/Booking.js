// Booking.js
import React, { useState, useEffect } from 'react';
import '../styles/components/Booking.css';
import CustomCalendar from './CustomCalendar';
import axios from 'axios';
import Login from './Login';
import { useNavigate, useLocation } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import { Tooltip } from 'react-tooltip';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from '../contexts/LanguageContext';
import { Modal, Button, Form } from 'react-bootstrap'; // Added react-bootstrap Modal and Button

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
});

const Booking = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [userData, setUserData] = useState(null);
  const [trainingType, setTrainingType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [childrenCount, setChildrenCount] = useState(1);
  const [childrenAges, setChildrenAges] = useState([]); // Changed from childrenAge string to childrenAges array
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
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [warningMessage, setWarningMessage] = useState('');
  const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
  const [availability, setAvailability] = useState({
    isAvailable: true,
    remainingSpots: 0,
    requestedChildren: 0,
  });
  const { t } = useTranslation();
  const [credits, setCredits] = useState([]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [isCreditMode, setIsCreditMode] = useState(false);
  const [fillFormPreference, setFillFormPreference] = useState({});

  const pricing = {
    1: 15,
    2: 28,
    3: 39,
  };

  // Helper function for ordinal numbers (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (number) => {
    if (number > 3 && number < 21) return 'th';
    switch (number % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Helper function to get the correct year label based on age and language
  const getYearLabel = (age) => {
    const isSlovak = t?.booking?.childrenCount?.includes('Počet');
    if (isSlovak) {
      if (age === 1) return t?.booking?.yearSingular || 'rok';
      if (age >= 2 && age <= 4) return t?.booking?.yearPlural2to4 || 'roky';
      return t?.booking?.yearPlural5Plus || 'rokov';
    }
    return age === 1 ? t?.booking?.yearSingular || 'year' : t?.booking?.yearPlural || 'years';
  };

  useEffect(() => {
    if (useSeasonTicket && selectedSeasonTicket) {
      setAccompanyingPerson(false);
    }
  }, [useSeasonTicket, selectedSeasonTicket]);

  // Update childrenAges when childrenCount changes
  useEffect(() => {
    const newAges = [];
    for (let i = 0; i < childrenCount; i++) {
      // Preserve existing ages or set default to empty string
      newAges.push(childrenAges[i] || '');
    }
    setChildrenAges(newAges);
  }, [childrenCount]);

  useEffect(() => {
    const fetchTrainingDates = async () => {
      try {
        const response = await api.get('/api/training-dates');
        const dates = response.data.reduce((acc, training) => {
          const date = new Date(training.training_date).toLocaleDateString('en-CA');
          const time = new Date(training.training_date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });
          if (!acc[training.training_type]) {
            acc[training.training_type] = {};
          }
          if (!acc[training.training_type][date]) {
            acc[training.training_type][date] = [];
          }
          acc[training.training_type][date].push(time);
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
        const response = await api.get(`/api/season-tickets/${userId}`);
        setSeasonTickets(response.data.filter(ticket => ticket.entries_remaining > 0 && new Date(ticket.expiry_date) > new Date()));
      } catch (error) {
        console.error('Error fetching season tickets:', error);
      }
    };

    // ✅ FIXED: proper credit loading
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

    if (isLoggedIn) {
      fetchTrainingDates();
      fetchSeasonTickets();
      fetchCredits();
    }
  }, [isLoggedIn]);

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
        setIsAdmin(response.data.email === process.env.REACT_APP_ADMIN_EMAIL);
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
      const time = new Date(training.training_date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      if (!acc[training.training_type]) {
        acc[training.training_type] = {};
      }
      if (!acc[training.training_type][date]) {
        acc[training.training_type][date] = [];
      }
      acc[training.training_type][date].push(time);
      return acc;
    }, {});
  };

  useEffect(() => {
    const checkAvailability = async () => {
      if (trainingType && selectedDate && selectedTime && childrenCount) {
        try {
          const response = await api.get('/api/check-availability', {
            params: { trainingType, selectedDate, selectedTime, childrenCount },
          });

          setAvailability({
            isAvailable: response.data.available,
            remainingSpots: response.data.remainingSpots,
            requestedChildren: childrenCount,
          });
        } catch (error) {
          console.error('Error checking availability:', error);
        }
      } else {
        setAvailability({
          isAvailable: true,
          remainingSpots: 0,
          requestedChildren: 0,
        });
      }
    };

    checkAvailability();
  }, [trainingType, selectedDate, selectedTime, childrenCount]);

  // Handle age change for a specific child
  const handleAgeChange = (index, age) => {
    const newAges = [...childrenAges];
    newAges[index] = age === '' ? '' : parseInt(age);
    setChildrenAges(newAges);
  };

  // Update the handleSubmit function to properly format ages for credit booking
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWarningMessage('');

    if (isCreditMode) {
      // Credit mode booking
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

        // ✅ FIXED: Remove the duplicate childrenAgeString declaration and send childrenAges as string
        await api.post('/api/bookings/use-credit', {
          creditId: selectedCredit.id,
          trainingId: newSessionId,
          childrenAges: childrenAges.join(', '),  // Send as comma-separated string
          photoConsent: photoConsent,
          mobile: mobile,
          note: note,
          accompanyingPerson: accompanyingPerson
        });

        alert(t?.booking?.creditSuccess || 'Booked with credit!');
        setIsCreditMode(false);
        setSelectedCredit(null);
        navigate('/profile');

        // Refresh credits
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

    // Validate that all ages are selected
    if (childrenAges.some(age => age === '')) {
      setWarningMessage(t?.booking?.selectAllAges || 'Please select an age for all children.');
      setLoading(false);
      return;
    }

    // Convert ages array to string for the API (same format as before)
    const childrenAgeString = childrenAges.join(', ');

    try {
      if (useSeasonTicket && selectedSeasonTicket) {
        // Pre-validation: Check if selected season ticket has enough entries
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

        // Check if season ticket is expired
        if (new Date(selectedTicket.expiry_date) < new Date()) {
          setWarningMessage(t?.booking?.seasonTicketExpired || 'Your season ticket has expired');
          setLoading(false);
          return;
        }

        const response = await api.post('/api/use-season-ticket', {
          userId: userData.id,
          seasonTicketId: selectedSeasonTicket,
          trainingType,
          selectedDate,
          selectedTime,
          childrenCount,
          childrenAge: childrenAgeString, // Use the converted string
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
          trainingType,
          selectedDate,
          selectedTime,
          childrenCount,
          childrenAge: childrenAgeString, // Use the converted string
          totalPrice: pricing[childrenCount] + (accompanyingPerson ? 3 : 0),
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

      // Handle season ticket specific errors from server
      if (error.response?.data?.error) {
        setWarningMessage(error.response.data.error);
      } else {
        setWarningMessage(t?.booking?.error || 'Error processing booking. Please try again.');
      }

      setLoading(false);
    }
  };

  // Handle success redirect
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

  const selectCredit = (credit, fillForm = false) => {
    setSelectedCredit(credit);
    setTrainingType(credit.training_type);

    // ✅ Set children count from credit
    setChildrenCount(credit.child_count);

    // ✅ Handle accompanying_person - always set from original booking and read-only
    setAccompanyingPerson(credit.accompanying_person === true);

    // ✅ FIXED: Parse ages from credit - handle the "4, 3" format correctly
    let parsedAges = [];
    if (credit.children_ages) {
      console.log('[DEBUG] Original children_ages:', credit.children_ages);

      if (typeof credit.children_ages === 'string') {
        // Handle "4, 3" format - split by comma and clean up
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

    // If no ages found or count doesn't match, create empty array
    if (parsedAges.length !== credit.child_count) {
      parsedAges = Array(credit.child_count).fill('');
    }

    setChildrenAges(parsedAges);

    // ✅ CONDITIONAL: Fill mobile, notes, and photo consent based on checkbox
    if (fillForm) {
      console.log('[DEBUG] Filling form with original data:', {
        photoConsent: credit.photo_consent,
        mobile: credit.mobile,
        note: credit.note,
        childrenAges: parsedAges
      });

      // Fill with original booking data
      setPhotoConsent(credit.photo_consent);
      setMobile(credit.mobile || '');
      setNote(credit.note || '');
    } else {
      console.log('[DEBUG] Leaving form empty for user input');
      // Leave empty for user to fill
      setPhotoConsent(null);
      setMobile('');
      setNote('');
    }

    // ✅ ALWAYS reset consent to false (user must agree again)
    setConsent(false);

    // ✅ Reset the fill form preferences for this credit
    setFillFormPreference(prev => ({
      ...prev,
      [credit.id]: false // Reset this credit's preference
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
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-center">{t?.booking?.title || 'Book Your Training'}</h2>
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
    <div className="container mt-5">
      <h2 className="text-center text-primary">{t?.booking?.title || 'Book Your Training'}</h2>
      <div className="d-flex justify-content-between mb-3">
        <button
          className="btn btn-danger"
          onClick={() => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userId');
            window.location.reload();
          }}
        >
          {t?.booking?.logout || 'Logout'}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/season-tickets')}
        >
          {t?.booking?.seasonTickets || 'Purchase Season Ticket'}
        </button>
      </div>

      {credits.length > 0 && (
        <div className="alert alert-info text-center mb-3">
          <strong>
            {t?.booking?.youHaveCredit || 'You have'} {credits.length}{' '}
            {credits.length === 1 ? 'credit' : 'credits'}!
          </strong>
          <br />
          <button
            className="btn btn-success mt-2"
            onClick={() => setShowCreditModal(true)}
          >
            🎫 {t?.booking?.useCredit || 'Use Credit'}
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="admin-panel mb-5">
          <h3 className="text-success">{t?.admin?.title || 'Admin Controls'}</h3>
          <Form onSubmit={handleAddTrainingDate}>
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Label>{t?.admin?.trainingType || 'Training Type'}</Form.Label>
                <Form.Select
                  value={newTrainingType}
                  onChange={(e) => setNewTrainingType(e.target.value)}
                >
                  <option value="MIDI">{t?.booking?.trainingType?.midi || 'MIDI'}</option>
                  <option value="MINI">{t?.booking?.trainingType?.mini || 'MINI'}</option>
                  <option value="MAXI">{t?.booking?.trainingType?.maxi || 'MAXI'}</option>
                </Form.Select>
              </div>
              <div className="col-md-4">
                <Form.Label>{t?.admin?.dateTime || 'Date & Time'}</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={newTrainingDate}
                  onChange={(e) => setNewTrainingDate(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <Form.Label>{t?.admin?.maxParticipants || 'Max Participants'}</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <Button type="submit" className="w-100">
                  {t?.admin?.addSession || 'Add Session'}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}

      {isAdmin && <div className="alert alert-success mb-3">{t?.admin?.title || 'ADMIN MODE ACTIVE'}</div>}

      <Form onSubmit={handleSubmit} className="mt-4">
        {/* Training Details Card */}
        <div className="card mb-4 border-2">
          <div className="card-header bg-light bg-opacity-50 border-bottom">
            <h5 className="mb-0 fw-bold text-dark">{t?.booking?.trainingDetails || 'Training Details'}</h5>
          </div>
          <div className="card-body">
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">{t?.booking?.trainingType?.label || 'Select Training Type'} <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={trainingType}
                onChange={(e) => {
                  setTrainingType(e.target.value);
                  setSelectedDate('');
                  setSelectedTime('');
                }}
                disabled={isCreditMode}
                className="form-select-lg"
              >
                <option value="">{t?.booking?.trainingType?.placeholder || 'Choose training type...'}</option>
                <option value="MINI">{t?.booking?.trainingType?.mini || 'MINI'} (2-4 years)</option>
                <option value="MIDI">{t?.booking?.trainingType?.midi || 'MIDI'} (4-6 years)</option>
                <option value="MAXI">{t?.booking?.trainingType?.maxi || 'MAXI'} (6+ years)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">{t?.booking?.selectDate || 'Select Available Date'} <span className="text-danger">*</span></Form.Label>
              <div className="calendar-container d-flex justify-content-center">
                <div style={{ maxWidth: '400px', width: '100%' }}>
                  <CustomCalendar
                    trainingDates={trainingDates}
                    trainingType={trainingType}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    minDate={new Date()}
                    weekendClassName="bg-light" // Added for darker weekends
                  />
                </div>
              </div>
            </Form.Group>

            {selectedDate && trainingType && trainingDates[trainingType]?.[selectedDate] && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">{t?.booking?.selectTime || 'Select Time Slot'} <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="form-select-lg"
                >
                  <option value="">-- {t?.booking?.selectTime || 'Choose a Time Slot'} --</option>
                  {trainingDates[trainingType][selectedDate].map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {!availability.isAvailable && (
              <div className="alert alert-warning mt-3 d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>
                  <strong>{t?.booking?.availability?.warning || 'Availability Warning'}:</strong>
                  <div className="mt-1">{formatAvailabilityMessage()}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="card mb-4 border-2">
          <div className="card-header bg-light bg-opacity-50 border-bottom">
            <h5 className="mb-0 fw-bold text-dark">{t?.booking?.personalInfo || 'Personal Information'}</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t?.booking?.name || 'Your Name'}</Form.Label>
                  <Form.Control
                    type="text"
                    value={userData ? `${userData.first_name} ${userData.last_name}` : ''}
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t?.booking?.email || 'Your Email'}</Form.Label>
                  <Form.Control
                    type="email"
                    value={userData ? userData.email : ''}
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t?.booking?.mobile || 'Mobile Number'} <span className="text-danger">*</span></Form.Label>
                  <IMaskInput
                    mask="+421 000 000 000"
                    definitions={{ '0': /[0-9]/ }}
                    className="form-control form-control-lg"
                    value={mobile}
                    onAccept={(value) => setMobile(value)}
                    placeholder={t?.booking?.mobilePlaceholder || '+421 xxx xxx xxx'}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t?.booking?.address || 'Address'}</Form.Label>
                  <Form.Control
                    type="text"
                    value={userData ? userData.address : ''}
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </div>
            </div>
          </div>
        </div>

        {/* Children Information Card */}
        <div className="card mb-4 border-2">
          <div className="card-header bg-light bg-opacity-50 border-bottom">
            <h5 className="mb-0 fw-bold text-dark">{t?.booking?.childrenInfo || 'Children Information'}</h5>
          </div>
          <div className="card-body">
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">{t?.booking?.childrenCount || 'Number of Children'} <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={childrenCount}
                onChange={(e) => setChildrenCount(parseInt(e.target.value))}
                required
                disabled={isCreditMode}
                className="form-select-lg"
              >
                <option value="1">1 {t?.booking?.child || 'Child'} - €15</option>
                <option value="2">2 {t?.booking?.children || 'Children'} - €28</option>
                <option value="3">3 {t?.booking?.children || 'Children'} - €39</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t?.booking?.childrenAge || 'Age of Children'} <span className="text-danger">*</span></Form.Label>
              <div className="row g-3">
                {childrenAges.map((age, index) => (
                  <div key={index} className="col-md-4">
                    <div className="age-selector-card p-3 border rounded">
                      <Form.Label className="fw-medium text-primary mb-2">
                        {t?.booking?.childAge?.replace('{number}', index + 1) || `${index + 1}${getOrdinalSuffix(index + 1)} Child`}
                      </Form.Label>
                      <Form.Select
                        value={age}
                        onChange={(e) => handleAgeChange(index, e.target.value)}
                        required
                        className="form-select"
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
                  </div>
                ))}
              </div>
            </Form.Group>
          </div>
        </div>

        {/* Additional Options Card */}
        <div className="card mb-4 border-2">
          <div className="card-header bg-light bg-opacity-50 border-bottom">
            <h5 className="mb-0 fw-bold text-dark">{t?.booking?.additionalOptions || 'Additional Options'}</h5>
          </div>
          <div className="card-body">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t?.booking?.notes || 'Additional Notes'}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t?.booking?.notesPlaceholder || 'Any special requirements, allergies, or additional information...'}
                className="form-control-lg"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <div className="accompanying-person-card p-3 border rounded bg-light">
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
                      <span className="fw-bold">{t?.booking?.accompanyingPerson || 'Participation of Accompanying Person'} (+€3)</span>
                      {isCreditMode && (
                        <div className="text-info small mt-1">
                          <i className="bi bi-info-circle"></i> {t?.booking?.creditModeReadOnly || 'Set from original booking - read only'}
                        </div>
                      )}
                      {useSeasonTicket && selectedSeasonTicket && !isCreditMode && (
                        <div className="text-warning small mt-1">
                          <i className="bi bi-exclamation-triangle"></i> {t?.booking?.notCoveredBySeasonTicket || 'Not covered by season ticket'}
                        </div>
                      )}
                    </div>
                  }
                />
              </div>
            </Form.Group>

            {/* Season Ticket Section */}
            {!isCreditMode && seasonTickets.length > 0 && (
              <Form.Group className="mb-3">
                <div className="season-ticket-card p-3 border rounded bg-info bg-opacity-10">
                  <Form.Check
                    type="checkbox"
                    id="useSeasonTicket"
                    checked={useSeasonTicket}
                    onChange={() => {
                      setUseSeasonTicket(!useSeasonTicket);
                      setSelectedSeasonTicket('');
                    }}
                    label={
                      <span className="fw-bold">
                        <i className="bi bi-ticket-perforated me-2"></i>
                        {t?.booking?.useSeasonTicket || 'Use Season Ticket'}
                      </span>
                    }
                  />
                  {useSeasonTicket && (
                    <div className="mt-3">
                      <Form.Label className="fw-medium">{t?.booking?.selectSeasonTicket || 'Select Season Ticket'} <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={selectedSeasonTicket}
                        onChange={(e) => setSelectedSeasonTicket(e.target.value)}
                        required={useSeasonTicket}
                        className="form-select-lg"
                      >
                        <option value="">{t?.booking?.selectSeasonTicket || 'Choose a Season Ticket'}</option>
                        {seasonTickets.map((ticket) => (
                          <option key={ticket.id} value={ticket.id}>
                            {t?.booking?.seasonTicketOption || 'Season Ticket'} #{ticket.id} 
                            ({t?.booking?.seasonTicketEntries?.replace('{count}', ticket.entries_remaining) || `Entries: ${ticket.entries_remaining}`})
                            {ticket.entries_remaining < childrenCount && (
                              <span className="text-danger"> - {t?.booking?.notEnoughEntries || 'Not enough entries'}</span>
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
        <div className="card mb-4 border-2">
          <div className="card-header bg-light bg-opacity-50 border-bottom">
            <h5 className="mb-0 fw-bold text-dark">{t?.booking?.consents || 'Consents and Agreements'}</h5>
          </div>
          <div className="card-body">
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">{t?.booking?.photoConsent || 'Photo Publication Consent'} <span className="text-danger">*</span></Form.Label>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="consent-option p-3 border rounded h-100">
                    <Form.Check
                      type="radio"
                      name="photoConsent"
                      id="photoConsentAgree"
                      checked={photoConsent === true}
                      onChange={() => setPhotoConsent(true)}
                      required
                      label={
                        <span className={photoConsent === true ? "fw-bold text-success" : ""}>
                          <i className="bi bi-check-circle me-2"></i>
                          {t?.booking?.agree || 'AGREE to publish photos of my children'}
                        </span>
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="consent-option p-3 border rounded h-100">
                    <Form.Check
                      type="radio"
                      name="photoConsent"
                      id="photoConsentDisagree"
                      checked={photoConsent === false}
                      onChange={() => setPhotoConsent(false)}
                      required
                      label={
                        <span className={photoConsent === false ? "fw-bold text-primary" : ""}>
                          <i className="bi bi-x-circle me-2"></i>
                          {t?.booking?.disagree || 'DISAGREE to publish photos of my children'}
                        </span>
                      }
                    />
                  </div>
                </div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <div className="terms-section">
                <div className="mb-2">
                  <a
                    href="/terms-and-conditions.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-decoration-none fw-medium"
                  >
                    <i className="bi bi-file-text me-1"></i>
                    {t?.booking?.terms || 'General Terms and Conditions'}
                  </a>
                </div>
                <Form.Check
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={() => setConsent(!consent)}
                  required
                  label={
                    <span className="fw-bold">
                      {t?.booking?.consent || 'I agree to the rules (Required)'}
                    </span>
                  }
                />
              </div>
            </Form.Group>
          </div>
        </div>

        {/* Pricing and Submission Card */}
        <div className="card mb-4 border-2">
          <div className="card-body text-center">
            {!useSeasonTicket && !isCreditMode && (
              <div className="pricing-display mb-4">
                <h4 className="text-primary">
                  {t?.booking?.totalPrice || 'Total Price'}: 
                  <span className="ms-2">€{pricing[childrenCount] + (accompanyingPerson ? 3 : 0)}</span>
                </h4>
                <div className="text-muted small">
                  {childrenCount} {childrenCount === 1 ? t?.booking?.child || 'child' : t?.booking?.children || 'children'} 
                  {accompanyingPerson ? ` + ${t?.booking?.accompanyingPersonShort || 'accompanying person'}` : ''}
                </div>
              </div>
            )}

            {warningMessage && (
              <div className="alert alert-danger mb-4">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {warningMessage}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-100 py-3 fw-bold"
              variant="success"
              disabled={!consent || loading || !availability.isAvailable || (useSeasonTicket && !selectedSeasonTicket) || (isCreditMode && (!selectedDate || !selectedTime))}
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
                      {t?.booking?.bookWithPayment || 'Book Training with Payment Obligation'}
                    </>
                  )}
                </div>
              )}
            </Button>
            <Tooltip id="booking-tooltip" />

            <div className="mt-3 text-muted small">
              {t?.booking?.secureBooking || 'Your booking is secure and protected'}
            </div>
          </div>
        </div>
      </Form>

      {/* Credit Selection Modal */}
      <Modal show={showCreditModal} onHide={() => {
        setShowCreditModal(false);
        setFillFormPreference({}); // ✅ Reset preferences when modal closes
      }}>
        <Modal.Header closeButton>
          <Modal.Title>{t?.booking?.chooseCredit || 'Choose Your Credit'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {credits.length === 0 ? (
            <p>{t?.booking?.noCredits || 'No credits available.'}</p>
          ) : (
            credits.map((credit) => (
              <div key={credit.id} className="mb-3 p-3 border rounded">
                <p><strong>{t?.booking?.originalDate || 'Original Date'}:</strong> {new Date(credit.original_date).toLocaleString()}</p>
                <p><strong>{t?.booking?.children || 'Children'}:</strong> {credit.child_count} | <strong>{t?.booking?.accompanyingPerson || 'Accompanying Person'}:</strong> {credit.accompanying_person ? 'Yes' : 'No'}</p>
                <p><strong>{t?.booking?.trainingType?.label || 'Training Type'}:</strong> {credit.training_type}</p>
                <p><strong>{t?.booking?.photoConsent || 'Photo Consent'}:</strong> {credit.photo_consent ? 'Agreed' : 'Disagreed'}</p>
                {credit.mobile && <p><strong>{t?.booking?.mobile || 'Mobile'}:</strong> {credit.mobile}</p>}
                {credit.note && <p><strong>{t?.booking?.notes || 'Notes'}:</strong> {credit.note}</p>}

                {/* ✅ Fill form checkbox */}
                <Form.Check
                  type="checkbox"
                  id={`fill-form-${credit.id}`}
                  label={t?.booking?.fillFormFromOriginal || 'Fill in the form based on the original booking'}
                  className="mb-2 mt-2"
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
            setFillFormPreference({}); // ✅ Reset preferences when modal closes
          }}>
            {t?.booking?.cancel || 'Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Booking;