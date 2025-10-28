// Booking.js
import React, { useState, useEffect } from 'react';
import './Booking.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
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

  const tileClassName = ({ date, view }) => {
    if (!trainingType || view !== 'month') return null;
    const formattedDate = date.toLocaleDateString('en-CA');
    if (trainingDates[trainingType]?.[formattedDate]) {
      return 'available-date';
    }
    return null;
  };

  const handleDateChange = (date) => {
    const formattedDate = date.toLocaleDateString('en-CA');
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

  const selectCredit = (credit) => {
    setSelectedCredit(credit);
    setTrainingType(credit.training_type);
    setChildrenCount(credit.child_count);

    // ✅ Handle potential null values for accompanying_person
    setAccompanyingPerson(credit.accompanying_person === true);

    // Parse ages from credit
    let parsedAges = [];
    if (credit.children_ages) {
      if (typeof credit.children_ages === 'string') {
        parsedAges = credit.children_ages
          .split(',')
          .map(age => age.trim())
          .map(age => parseInt(age))
          .filter(age => !isNaN(age) && age > 0);
      } else if (Array.isArray(credit.children_ages)) {
        parsedAges = credit.children_ages.map(age => parseInt(age)).filter(age => !isNaN(age));
      }
    }

    // If no ages found or count doesn't match, create empty array
    if (parsedAges.length !== credit.child_count) {
      parsedAges = Array(credit.child_count).fill('');
    }

    setChildrenAges(parsedAges);
    setPhotoConsent(credit.photo_consent);
    setMobile(credit.mobile || '');
    setNote(credit.note || '');
    setConsent(false); // Reset terms
    setSelectedDate('');
    setSelectedTime('');
    setShowCreditModal(false);
    setIsCreditMode(true);

    console.log('[DEBUG] Credit selected:', {
      creditId: credit.id,
      accompanyingPerson: credit.accompanying_person,
      child_count: credit.child_count
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
        <Form.Group className="mb-3">
          <Form.Label>{t?.booking?.trainingType?.label || 'Select Training Type'}</Form.Label>
          <Form.Select
            value={trainingType}
            onChange={(e) => {
              setTrainingType(e.target.value);
              setSelectedDate('');
              setSelectedTime('');
            }}
            disabled={isCreditMode}
          >
            <option value="">{t?.booking?.trainingType?.placeholder || 'Choose...'}</option>
            <option value="MINI">{t?.booking?.trainingType?.mini || 'MINI'}</option>
            <option value="MIDI">{t?.booking?.trainingType?.midi || 'MIDI'}</option>
            <option value="MAXI">{t?.booking?.trainingType?.maxi || 'MAXI'}</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{t?.booking?.name || 'Your Name'}</Form.Label>
          <Form.Control
            type="text"
            value={userData ? `${userData.first_name} ${userData.last_name}` : ''}
            readOnly
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{t?.booking?.email || 'Your Email'}</Form.Label>
          <Form.Control
            type="email"
            value={userData ? userData.email : ''}
            readOnly
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{t?.booking?.mobile || 'Your Mobile Number'}</Form.Label>
          <IMaskInput
            mask="+421 000 000 000"
            definitions={{ '0': /[0-9]/ }}
            className="form-control"
            value={mobile}
            onAccept={(value) => setMobile(value)}
            placeholder={t?.booking?.mobile || '+421 xxx xxx xxx'}
            disabled={isCreditMode}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{t?.booking?.address || 'Address'}</Form.Label>
          <Form.Control
            type="text"
            value={userData ? userData.address : ''}
            readOnly
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{t?.booking?.selectDate || 'Select Available Date'} <span className="text-danger">*</span></Form.Label>
          <Calendar
            onChange={handleDateChange}
            value={selectedDate ? new Date(selectedDate) : null}
            tileClassName={tileClassName}
            tileDisabled={({ date, view }) => {
              if (view !== 'month') return false;
              const formattedDate = date.toLocaleDateString('en-CA');
              return !trainingDates[trainingType]?.[formattedDate];
            }}
            minDate={new Date()}
            className="custom-calendar"
          />
        </Form.Group>

        {selectedDate && trainingType && trainingDates[trainingType]?.[selectedDate] && (
          <Form.Group className="mb-3">
            <Form.Label htmlFor="timeSlots">{t?.booking?.selectTime || 'Select Time'}:</Form.Label>
            <Form.Select
              id="timeSlots"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
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
          <div className="alert alert-danger mt-3">
            {formatAvailabilityMessage()}
          </div>
        )}

        <Form.Group className="mb-3">
          <Form.Label>{t?.booking?.childrenCount || 'Number of Children'} <span className="text-danger">*</span></Form.Label>
          <Form.Select
            value={childrenCount}
            onChange={(e) => setChildrenCount(parseInt(e.target.value))}
            required
            disabled={isCreditMode}
          >
            <option value="1">1 {t?.booking?.childrenCount?.includes('Počet') ? 'dieťa' : 'Child'} (€15)</option>
            <option value="2">2 {t?.booking?.childrenCount?.includes('Počet') ? 'deti' : 'Children'} (€28)</option>
            <option value="3">3 {t?.booking?.childrenCount?.includes('Počet') ? 'deti' : 'Children'} (€39)</option>
          </Form.Select>
        </Form.Group>


        <Form.Group className="mb-3">
          <Form.Label>{t?.booking?.childrenAge || 'Age of Children'} <span className="text-danger">*</span></Form.Label>
          <div className="row">
            {childrenAges.map((age, index) => (
              <div key={index} className="col-md-4 mb-2">
                <Form.Label className="small">
                  {t?.booking?.childAge?.replace('{number}', index + 1) || `Age of ${index + 1}${getOrdinalSuffix(index + 1)} child`}
                </Form.Label>
                <Form.Select
                  value={age}
                  onChange={(e) => handleAgeChange(index, e.target.value)}
                  required
                  // ✅ FIXED: Allow age selection in credit mode
                  disabled={false} // Always enabled since we need to allow changes
                >
                  <option value="" disabled>
                    {t?.booking?.chooseAge || 'Choose an age'}
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

        <Form.Group className="mb-3">
          <Form.Label>{t?.booking?.notes || 'Additional Notes'}</Form.Label>
          <Form.Control
            as="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isCreditMode}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="accompanyingPerson"
            checked={accompanyingPerson}
            onChange={() => setAccompanyingPerson(!accompanyingPerson)}
            disabled={useSeasonTicket && selectedSeasonTicket} // Only disable for season tickets
            label={
              <>
                {t?.booking?.accompanyingPerson || 'Participation of Accompanying Person (€3)'}
                {useSeasonTicket && selectedSeasonTicket && (
                  <span className="text-muted ms-2">
                    ({t?.booking?.notCoveredBySeasonTicket || 'Not covered by season ticket'})
                  </span>
                )}
              </>
            }
          />
        </Form.Group>

        {!isCreditMode && seasonTickets.length > 0 && (
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="useSeasonTicket"
              checked={useSeasonTicket}
              onChange={() => {
                setUseSeasonTicket(!useSeasonTicket);
                setSelectedSeasonTicket('');
              }}
              label={t?.booking?.useSeasonTicket || 'Use Season Ticket'}
            />
            {useSeasonTicket && (
              <div className="mt-2">
                <Form.Label>{t?.booking?.selectSeasonTicket || 'Select Season Ticket'}</Form.Label>
                <Form.Select
                  value={selectedSeasonTicket}
                  onChange={(e) => setSelectedSeasonTicket(e.target.value)}
                  required={useSeasonTicket}
                >
                  <option value="">{t?.booking?.selectSeasonTicket || 'Choose a Season Ticket'}</option>
                  {seasonTickets.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {t?.booking?.seasonTicketOption || 'Season Ticket'} (ID: {ticket.id}, {t?.booking?.seasonTicketEntries?.replace('{count}', ticket.entries_remaining) || `Remaining entries: ${ticket.entries_remaining}`})
                      {ticket.entries_remaining < childrenCount && (
                        <span className="text-danger"> - {t?.booking?.notEnoughEntries || 'Not enough entries'}</span>
                      )}
                    </option>
                  ))}
                </Form.Select>
              </div>
            )}
          </Form.Group>
        )}

        {warningMessage && (
          <div className="alert alert-danger mt-3">
            {warningMessage}
          </div>
        )}

        <Form.Group className="mb-3">
          <Form.Label>{t?.booking?.photoConsent || 'Photo Publication Consent'} <span className="text-danger">*</span></Form.Label>
          <div>
            <Form.Check
              type="radio"
              name="photoConsent"
              id="photoConsentAgree"
              checked={photoConsent === true}
              onChange={() => setPhotoConsent(true)}
              required
              disabled={isCreditMode}
              label={t?.booking?.agree || 'AGREE to publish photos of my children'}
            />
            <Form.Check
              type="radio"
              name="photoConsent"
              id="photoConsentDisagree"
              checked={photoConsent === false}
              onChange={() => setPhotoConsent(false)}
              required
              disabled={isCreditMode}
              label={t?.booking?.disagree || 'DISAGREE to publish photos of my children'}
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={() => setConsent(!consent)}
            required
            label={
              <>
                {t?.booking?.consent || 'I agree to the rules (Required)'}
                <span className="ms-2">
                  <a
                    href="/terms-and-conditions.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#007bff', textDecoration: 'underline' }}
                  >
                    {t?.booking?.terms || 'General Terms and Conditions'}
                  </a>
                </span>
              </>
            }
          />
        </Form.Group>

        {!useSeasonTicket && !isCreditMode && (
          <h4>{t?.booking?.totalPrice || 'Total Price'}: €{pricing[childrenCount] + (accompanyingPerson ? 3 : 0)}</h4>
        )}

        <Button
          type="submit"
          className="w-100"
          variant="success"
          disabled={!consent || loading || !availability.isAvailable || (useSeasonTicket && !selectedSeasonTicket) || (isCreditMode && (!selectedDate || !selectedTime))}
          data-tooltip-id="booking-tooltip"
          data-tooltip-content={
            !availability.isAvailable
              ? formatAvailabilityMessage()
              : !consent
                ? t?.booking?.consent || 'You must agree to the rules to complete the booking.'
                : useSeasonTicket && !selectedSeasonTicket
                  ? t?.booking?.selectSeasonTicket || 'Please select a season ticket.'
                  : ''
          }
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
              <span className="ms-2">{t?.booking?.redirecting || 'Processing...'}</span>
            </>
          ) : (
            isCreditMode ? (t?.booking?.bookWithCredit || 'Book with Credit') : (t?.booking?.bookButton || (useSeasonTicket ? 'Book with Season Ticket' : 'Book Training with Payment Obligation'))
          )}
        </Button>
        <Tooltip id="booking-tooltip" />
      </Form>

      {/* Credit Selection Modal */}
      <Modal show={showCreditModal} onHide={() => setShowCreditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{t?.booking?.chooseCredit || 'Choose Your Credit'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {credits.length === 0 ? (
            <p>{t?.booking?.noCredits || 'No credits available.'}</p>
          ) : (
            credits.map((credit) => (
              <div key={credit.id} className="mb-3">
                <p><strong>{t?.booking?.originalDate || 'Original Date'}:</strong> {new Date(credit.original_date).toLocaleString()}</p>
                <p><strong>{t?.booking?.children || 'Children'}:</strong> {credit.child_count} | <strong>{t?.booking?.accompanyingPerson || 'Accompanying Person'}:</strong> {credit.accompanying_person ? 'Yes' : 'No'}</p>
                <p><strong>{t?.booking?.trainingType?.label || 'Training Type'}:</strong> {credit.training_type}</p>
                <Button variant="primary" onClick={() => selectCredit(credit)}>
                  {t?.booking?.useThisCredit || 'Use this credit'}
                </Button>
              </div>
            ))
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreditModal(false)}>
            {t?.booking?.cancel || 'Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Booking;