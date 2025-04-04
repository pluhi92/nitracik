import React, { useState, useEffect } from 'react';
import './Booking.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import Login from './Login';
import { useNavigate } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import { Tooltip } from 'react-tooltip';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from '../contexts/LanguageContext';

const api = axios.create({
  baseURL: 'http://localhost:5000', // Directly point to backend
  withCredentials: true,
});

const Booking = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [userData, setUserData] = useState(null);
  const [trainingType, setTrainingType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [childrenCount, setChildrenCount] = useState(1);
  const [childrenAge, setChildrenAge] = useState('');
  const [note, setNote] = useState('');
  const [mobile, setMobile] = useState('');
  const [accompanyingPerson, setAccompanyingPerson] = useState(false);
  const [consent, setConsent] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trainingDates, setTrainingDates] = useState({}); // Stores fetched training dates
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [newTrainingDate, setNewTrainingDate] = useState('');
  const [newTrainingType, setNewTrainingType] = useState('MIDI');
  const [maxParticipants, setMaxParticipants] = useState(10);

  const [warningMessage, setWarningMessage] = useState('');
  const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
  const [availability, setAvailability] = useState({
    isAvailable: true,
    remainingSpots: 0,
    requestedChildren: 0
  });
  const { t } = useTranslation();


  const pricing = {
    1: 15,
    2: 28,
    3: 39,
  };

  // console.log('Admin email from env:', process.env.REACT_APP_ADMIN_EMAIL);
  // console.log('API URL:', process.env.REACT_APP_API_URL);

  // Fetch training dates from the backend
  useEffect(() => {
    const fetchTrainingDates = async () => {
      try {
        const response = await api.get('/api/training-dates');
        console.log('Fetched Training Dates:', response.data);
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

    if (isLoggedIn) {
      fetchTrainingDates();
    }
  }, [isLoggedIn]);

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      fetchUserData();
    }
  }, [isLoggedIn, navigate]);

  // Admin check 
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await api.get(`/api/users/${localStorage.getItem('userId')}`);
        console.log('Admin check response:', response.data);
        console.log('Comparing:', response.data.email, 'vs', process.env.REACT_APP_ADMIN_EMAIL);
        // Method 1: Check email against ADMIN_EMAIL
        setIsAdmin(response.data.email === process.env.REACT_APP_ADMIN_EMAIL);

        // Method 2: Check role if you added a "role" column
        // setIsAdmin(response.data.role === 'admin');
      } catch (error) {
        console.error('Admin check failed:', error);
      }
    };

    if (isLoggedIn) checkAdmin();
  }, [isLoggedIn]);


  // Fetch user data
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
      console.log('Submitting training date:', {
        trainingType: newTrainingType,
        trainingDate: newTrainingDate,
        maxParticipants
      });

      const addResponse = await api.post('/api/set-training', {
        trainingType: newTrainingType,
        trainingDate: newTrainingDate,
        maxParticipants: parseInt(maxParticipants)
      });

      console.log('Training date added:', addResponse.data);

      // Refresh training dates
      const fetchResponse = await api.get('/api/training-dates');
      const updatedDates = processTrainingDates(fetchResponse.data);
      setTrainingDates(updatedDates);

      // Clear form
      setNewTrainingDate('');
      setMaxParticipants(10);

      alert('Training date added successfully!');
    } catch (error) {
      console.error('Error adding training date:', error);
      alert(`Failed to add training date: ${error.response?.data?.error || error.message}`);
    }
  };

  // Add this helper function
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
            params: {
              trainingType,
              selectedDate,
              selectedTime,
              childrenCount  // Now includes childrenCount in the check
            }
          });

          setAvailability({
            isAvailable: response.data.available,
            remainingSpots: response.data.remainingSpots,
            requestedChildren: childrenCount
          });

        } catch (error) {
          console.error('Error checking availability:', error);
        }
      } else {
        // Reset availability when selections are incomplete
        setAvailability({
          isAvailable: true,
          remainingSpots: 0,
          requestedChildren: 0
        });
      }
    };

    checkAvailability();
  }, [trainingType, selectedDate, selectedTime, childrenCount]); // Added childrenCount to dependencies

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create payment session
      const paymentSession = await api.post('/api/create-payment-session', {
        userId: userData.id,
        trainingType,
        selectedDate,
        selectedTime,
        childrenCount,
        childrenAge,
        totalPrice: pricing[childrenCount] + (accompanyingPerson ? 3 : 0),
        photoConsent,
        mobile,
        note,
        accompanyingPerson
      });

      // Redirect to Stripe payment page
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: paymentSession.data.sessionId
      });

      if (error) throw error;

    } catch (error) {
      console.error('Payment error:', error);
      setWarningMessage('Error initiating payment. Please try again.');
      setLoading(false);
    }
  };

  // Highlight available dates on the calendar
  const tileClassName = ({ date, view }) => {
    if (!trainingType || view !== 'month') return null;

    const formattedDate = date.toLocaleDateString('en-CA'); // YYYY-MM-DD

    // console.log('Checking date:', formattedDate, 'Available:', trainingDates[trainingType]?.[formattedDate]);

    if (trainingDates[trainingType]?.[formattedDate]) {
      return 'available-date'; // Apply custom class for available dates
    }

    return null;
  };

  // Handle date selection
  const handleDateChange = (date) => {
    const formattedDate = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
    setSelectedDate(formattedDate);
    setSelectedTime('');
  };

  // Render available time slots for the selected date
  const renderTimeSlots = () => {
    if (!selectedDate || !trainingType) return null;

    const timeSlots = trainingDates[trainingType][selectedDate];
    if (!timeSlots) {
      console.log('No time slots for:', selectedDate);
      return null;
    }

    console.log('Time Slots:', timeSlots);

    return (
      <div className="mb-3">
        <label htmlFor="timeSlots">Select Time:</label>
        <select
          id="timeSlots"
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          className="form-select"
        >
          <option value="">-- Choose a Time Slot --</option>
          {timeSlots.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
    );
  };

 // If the user is not logged in, show the login form
 if (!isLoggedIn) {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-center">{t?.booking?.title || 'Book Your Training'}</h2>
              <Login onLoginSuccess={() => {
                localStorage.setItem('isLoggedIn', 'true');
                setIsLoggedIn(true);
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format availability messages
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

return (
  <div className="container mt-5">
    <h2 className="text-center text-primary">{t?.booking?.title || 'Book Your Training'}</h2>
    <button
      className="btn btn-danger mb-3"
      onClick={() => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userId');
        window.location.reload();
      }}
    >
      {t?.booking?.logout || 'Logout'}
    </button>

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
      {/* Training Type */}
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
        </select>
      </div>

      {/* User Name */}
      <div className="mb-3">
        <label className="form-label">{t?.booking?.name || 'Your Name'}</label>
        <input
          type="text"
          className="form-control"
          value={userData ? `${userData.first_name} ${userData.last_name}` : ''}
          readOnly
        />
      </div>

      {/* User Email */}
      <div className="mb-3">
        <label className="form-label">{t?.booking?.email || 'Your Email'}</label>
        <input
          type="email"
          className="form-control"
          value={userData ? userData.email : ''}
          readOnly
        />
      </div>

      {/* Mobile Number */}
      <div className="mb-3">
        <label className="form-label">{t?.booking?.mobile || 'Your Mobile Number'}</label>
        <IMaskInput
          mask="+421 000 000 000"
          definitions={{
            '0': /[0-9]/,
          }}
          className="form-control"
          value={mobile}
          onAccept={(value) => setMobile(value)}
          placeholder={t?.booking?.mobile || '+421 xxx xxx xxx'}
        />
      </div>

      {/* Address */}
      <div className="mb-3">
        <label className="form-label">{t?.booking?.address || 'Address'}</label>
        <input
          type="text"
          className="form-control"
          value={userData ? userData.address : ''}
          readOnly
        />
      </div>

      {/* Select Available Date */}
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

      {/* Time Slots */}
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

      {/* Session Full Warning */}
      {!availability.isAvailable && (
        <div className="alert alert-danger mt-3">
          {formatAvailabilityMessage()}
        </div>
      )}

      {/* Number of Children */}
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

      {/* Age of Children */}
      <div className="mb-3">
        <label className="form-label">{t?.booking?.childrenAge || 'Age of Children'} <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          value={childrenAge}
          onChange={(e) => setChildrenAge(e.target.value)}
          required
        />
      </div>

      {/* Additional Notes */}
      <div className="mb-3">
        <label className="form-label">{t?.booking?.notes || 'Additional Notes'}</label>
        <textarea
          className="form-control"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Accompanying Person */}
      <div className="mb-3">
        <input
          type="checkbox"
          id="accompanyingPerson"
          checked={accompanyingPerson}
          onChange={() => setAccompanyingPerson(!accompanyingPerson)}
        />
        <label htmlFor="accompanyingPerson" className="ms-2">
          {t?.booking?.accompanyingPerson || 'Participation of Accompanying Person (€3)'}
        </label>
      </div>

      {/* Warning Message */}
      {warningMessage && (
        <div className="alert alert-danger mt-3">
          {warningMessage}
        </div>
      )}

      {/* Photo Consent */}
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

      {/* Consent Checkbox */}
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

      {/* Total Price */}
      <h4>{t?.booking?.totalPrice || 'Total Price'}: €{pricing[childrenCount] + (accompanyingPerson ? 3 : 0)}</h4>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-success w-100"
        disabled={!consent || loading || !availability.isAvailable}
        data-tooltip-id="booking-tooltip"
        data-tooltip-content={
          !availability.isAvailable
            ? formatAvailabilityMessage()
            : !consent
              ? t?.booking?.consent || 'You must agree to the rules to complete the payment.'
              : ''
        }
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
            <span className="ms-2">{t?.booking?.redirecting || 'Redirecting to Payment...'}</span>
          </>
        ) : (
          t?.booking?.bookButton || 'Book Training with Payment Obligation'
        )}
      </button>
      <Tooltip id="booking-tooltip" />
    </form>
  </div>
);
};

export default Booking;