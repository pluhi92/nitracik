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

    if (isLoggedIn) {
      fetchTrainingDates();
      fetchSeasonTickets();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWarningMessage('');

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

      {isAdmin && (
        <div className="admin-panel mb-5">
          <h3 className="text-success">{t?.admin?.title || 'Admin Controls'}</h3>
          <form onSubmit={handleAddTrainingDate}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">{t?.admin?.trainingType || 'Training Type'}</label>
                <select
                  className="form-select"
                  value={newTrainingType}
                  onChange={(e) => setNewTrainingType(e.target.value)}
                >
                  <option value="MIDI">{t?.booking?.trainingType?.midi || 'MIDI'}</option>
                  <option value="MINI">{t?.booking?.trainingType?.mini || 'MINI'}</option>
                  <option value="MAXI">{t?.booking?.trainingType?.maxi || 'MAXI'}</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">{t?.admin?.dateTime || 'Date & Time'}</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={newTrainingDate}
                  onChange={(e) => setNewTrainingDate(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">{t?.admin?.maxParticipants || 'Max Participants'}</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button type="submit" className="btn btn-success w-100">
                  {t?.admin?.addSession || 'Add Session'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isAdmin && <div className="alert alert-success mb-3">{t?.admin?.title || 'ADMIN MODE ACTIVE'}</div>}

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-3">
          <label className="form-label">{t?.booking?.trainingType?.label || 'Select Training Type'}</label>
          <select
            className="form-select"
            value={trainingType}
            onChange={(e) => {
              setTrainingType(e.target.value);
              setSelectedDate('');
              setSelectedTime('');
            }}
          >
            <option value="">{t?.booking?.trainingType?.placeholder || 'Choose...'}</option>
            <option value="MINI">{t?.booking?.trainingType?.mini || 'MINI'}</option>
            <option value="MIDI">{t?.booking?.trainingType?.midi || 'MIDI'}</option>
            <option value="MAXI">{t?.booking?.trainingType?.maxi || 'MAXI'}</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">{t?.booking?.name || 'Your Name'}</label>
          <input
            type="text"
            className="form-control"
            value={userData ? `${userData.first_name} ${userData.last_name}` : ''}
            readOnly
          />
        </div>

        <div className="mb-3">
          <label className="form-label">{t?.booking?.email || 'Your Email'}</label>
          <input
            type="email"
            className="form-control"
            value={userData ? userData.email : ''}
            readOnly
          />
        </div>

        <div className="mb-3">
          <label className="form-label">{t?.booking?.mobile || 'Your Mobile Number'}</label>
          <IMaskInput
            mask="+421 000 000 000"
            definitions={{ '0': /[0-9]/ }}
            className="form-control"
            value={mobile}
            onAccept={(value) => setMobile(value)}
            placeholder={t?.booking?.mobile || '+421 xxx xxx xxx'}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">{t?.booking?.address || 'Address'}</label>
          <input
            type="text"
            className="form-control"
            value={userData ? userData.address : ''}
            readOnly
          />
        </div>

        <div className="mb-3">
          <label className="form-label">{t?.booking?.selectDate || 'Select Available Date'} <span className="text-danger">*</span></label>
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
        </div>

        {selectedDate && trainingType && trainingDates[trainingType]?.[selectedDate] && (
          <div className="mb-3">
            <label htmlFor="timeSlots">{t?.booking?.selectTime || 'Select Time'}:</label>
            <select
              id="timeSlots"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="form-select"
            >
              <option value="">-- {t?.booking?.selectTime || 'Choose a Time Slot'} --</option>
              {trainingDates[trainingType][selectedDate].map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        )}

        {!availability.isAvailable && (
          <div className="alert alert-danger mt-3">
            {formatAvailabilityMessage()}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">{t?.booking?.childrenCount || 'Number of Children'} <span className="text-danger">*</span></label>
          <select
            className="form-select"
            value={childrenCount}
            onChange={(e) => setChildrenCount(parseInt(e.target.value))}
            required
          >
            <option value="1">1 {t?.booking?.childrenCount?.includes('Počet') ? 'dieťa' : 'Child'} (€15)</option>
            <option value="2">2 {t?.booking?.childrenCount?.includes('Počet') ? 'deti' : 'Children'} (€28)</option>
            <option value="3">3 {t?.booking?.childrenCount?.includes('Počet') ? 'deti' : 'Children'} (€39)</option>
          </select>
        </div>

        {/* Dynamic age selectors - REPLACES the old text input */}
        <div className="mb-3">
          <label className="form-label">{t?.booking?.childrenAge || 'Age of Children'} <span className="text-danger">*</span></label>
          <div className="row">
            {childrenAges.map((age, index) => (
              <div key={index} className="col-md-4 mb-2">
                <label className="form-label small">
                  {t?.booking?.childAge?.replace('{number}', index + 1) || `Age of ${index + 1}${getOrdinalSuffix(index + 1)} child`}
                </label>
                <select
                  className="form-select"
                  value={age}
                  onChange={(e) => handleAgeChange(index, e.target.value)}
                  required
                >
                  <option value="" disabled>
                    {t?.booking?.chooseAge || 'Choose an age'}
                  </option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((ageOption) => (
                    <option key={ageOption} value={ageOption}>
                      {ageOption} {getYearLabel(ageOption)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">{t?.booking?.notes || 'Additional Notes'}</label>
          <textarea
            className="form-control"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <input
            type="checkbox"
            id="accompanyingPerson"
            checked={accompanyingPerson}
            onChange={() => setAccompanyingPerson(!accompanyingPerson)}
            disabled={useSeasonTicket && selectedSeasonTicket}
          />
          <label htmlFor="accompanyingPerson" className="ms-2">
            {t?.booking?.accompanyingPerson || 'Participation of Accompanying Person (€3)'}
            {useSeasonTicket && selectedSeasonTicket && (
              <span className="text-muted ms-2">
                ({t?.booking?.notCoveredBySeasonTicket || 'Not covered by season ticket'})
              </span>
            )}
          </label>
        </div>

        {seasonTickets.length > 0 && (
          <div className="mb-3">
            <input
              type="checkbox"
              id="useSeasonTicket"
              checked={useSeasonTicket}
              onChange={() => {
                setUseSeasonTicket(!useSeasonTicket);
                setSelectedSeasonTicket('');
              }}
            />
            <label htmlFor="useSeasonTicket" className="ms-2">
              {t?.booking?.useSeasonTicket || 'Use Season Ticket'}
            </label>
            {useSeasonTicket && (
              <div className="mt-2">
                <label className="form-label">{t?.booking?.selectSeasonTicket || 'Select Season Ticket'}</label>
                <select
                  className="form-select"
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
                </select>
              </div>
            )}
          </div>
        )}

        {warningMessage && (
          <div className="alert alert-danger mt-3">
            {warningMessage}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">{t?.booking?.photoConsent || 'Photo Publication Consent'} <span className="text-danger">*</span></label>
          <div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="photoConsent"
                id="photoConsentAgree"
                checked={photoConsent === true}
                onChange={() => setPhotoConsent(true)}
                required
              />
              <label className="form-check-label" htmlFor="photoConsentAgree">
                {t?.booking?.agree || 'AGREE to publish photos of my children'}
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="photoConsent"
                id="photoConsentDisagree"
                checked={photoConsent === false}
                onChange={() => setPhotoConsent(false)}
                required
              />
              <label className="form-check-label" htmlFor="photoConsentDisagree">
                {t?.booking?.disagree || 'DISAGREE to publish photos of my children'}
              </label>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={() => setConsent(!consent)}
            required
          />
          <label htmlFor="consent" className="ms-2 text-danger">
            {t?.booking?.consent || 'I agree to the rules (Required)'}
          </label>
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
        </div>

        {!useSeasonTicket && (
          <h4>{t?.booking?.totalPrice || 'Total Price'}: €{pricing[childrenCount] + (accompanyingPerson ? 3 : 0)}</h4>
        )}

        <button
          type="submit"
          className="btn btn-success w-100"
          disabled={!consent || loading || !availability.isAvailable || (useSeasonTicket && !selectedSeasonTicket)}
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
            t?.booking?.bookButton || (useSeasonTicket ? 'Book with Season Ticket' : 'Book Training with Payment Obligation')
          )}
        </button>
        <Tooltip id="booking-tooltip" />
      </form>
    </div>
  );
};

export default Booking;