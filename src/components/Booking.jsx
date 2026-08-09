// Booking.jsx
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import Login from './Login';
import { useNavigate, useLocation } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import { Tooltip } from 'react-tooltip';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from '../contexts/LanguageContext';
import { Modal, Form, Spinner } from 'react-bootstrap';
import api from '../api/api';
import { HexColorPicker } from "react-colorful";
import { getAvailableSeasonTickets } from '../tests/bookingSeasonTicketUtils';
import { 
  ChevronUp, 
  ChevronDown,
  Calendar as CalIcon, 
  Clock, 
  User, 
  Users, 
  Info, 
  CheckCircle2, 
  Ticket, 
  CreditCard, 
  AlertCircle,
  Plus,
  Settings,
  X,
  FileText,
  Gift,
  Pencil,
  Trash2,
  Link
} from 'lucide-react';

const FlakPink = ({ className, style }) => (
  <svg viewBox="0 0 170.079 170.658" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,102.0004,33.3618)" fill="#F4A5A5" d="M0 0C-.049 .001-.084 .006-.122 .01-.182 .023-.241 .037-.301 .049-.28 .054-.187 .045 0 0M19.592-55.855C20.281-56.109 20.126-56.34 19.592-55.855M59.411-29.461C57.428-26.123 53.616-24.284 50.208-22.771 45.813-20.82 41.283-19.202 36.756-17.587 34.934-16.937 33.322-16.418 31.946-15.898 33.149-13.263 34.563-10.35 35.803-7.743 38.635-1.79 44.262 6.585 43.568 13.498L43.497 13.469C43.477 15.353 42.864 17.163 41.371 18.802 37.474 23.079 28.987 20.373 28.555 14.604 28.445 14.402 28.336 14.198 28.223 14.009 27.353 12.55 26.389 11.142 25.433 9.738 23.773 7.298 22.062 4.894 20.341 2.496 17.561 3.718 13.969 3.659 11.099 3.032 9.233 2.625 7.411 2.02 5.587 1.448 4.969 4.959 2.515 8.404-1.587 7.855-4.99 7.4-8.385 6.912-11.775 6.385-12.271 11.193-13.235 15.956-14.62 20.562-16.34 26.288-22.863 27.479-27.155 23.872-29.653 21.772-31.991 19.435-34.568 17.453-34.618 17.567-34.663 17.681-34.714 17.794-38.307 25.869-50.188 19.92-48.422 12.015-47.755 9.033-46.907 6.076-45.887 3.176-46.502 3.008-47.126 2.762-47.758 2.406-57.967-3.36-68.755-7.401-80.21-9.896-84.776-10.891-86.216-14.818-85.362-18.369-86.023-18.416-86.685-18.451-87.347-18.501-96.907-19.233-97.085-33.067-87.347-33.501-81.613-33.757-75.879-34.013-70.144-34.269-70.426-35.257-70.513-36.288-70.372-37.299-71.676-36.835-73.11-36.745-74.61-37.174-77.526-38.008-80.49-41.163-80.116-44.406-79.648-48.474-77.55-52.006-74.602-54.375-73.368-56.077-72.13-57.775-70.894-59.475-73.925-59.862-76.894-62.027-77.429-64.966-77.515-65.437-77.579-65.903-77.632-66.367-77.665-66.302-77.709-66.233-77.74-66.169-77.842-65.96-78.057-65.256-78.171-64.792-78.171-64.779-78.171-64.766-78.17-64.753-78.013-65.121-77.933-63.415-78.146-64.399-76.112-55.002-90.455-50.97-92.61-60.411-94.585-69.06-90.861-78.252-87.146-85.912-83.522-93.383-78.368-102.026-71.043-106.413-70.899-106.499-70.752-106.575-70.607-106.655-71.385-107.292-72.087-107.977-72.681-108.716-75.51-112.236-75.857-118.087-71.163-120.496-66.359-122.962-59.616-121.749-53.963-118.957-52.734-120.363-51.239-121.576-49.448-122.532-45.554-124.61-40.944-124.631-36.98-122.994-32.924-124.98-28.867-126.966-24.81-128.953-21.445-130.6-16.346-130.152-14.549-126.262-12.801-122.479-12.278-118.361-12.835-114.457-12.433-114.495-12.031-114.533-11.629-114.57-7.965-114.914-4.666-111.455-4.263-108.067-4.142-107.049-4.209-106.096-4.432-105.218-3.22-104.77-2.05-104.177-.94-103.467 1.423-105.279 3.805-107.066 6.221-108.806 12.385-113.244 19.072-118.602 26.383-121.019 31.118-122.584 36.677-121.152 38.264-115.886 39.425-112.034 37.477-108.294 35.327-105.21 31.237-99.345 26.243-94.192 21.555-88.821 21.454-88.705 21.354-88.587 21.253-88.471 25.425-87.677 28.671-85.208 31.348-81.712 33.784-78.532 31.874-73.606 28.881-71.604 29.147-71.392 29.404-71.181 29.645-70.975 34.107-67.15 37.25-61.703 36.609-55.69 35.893-48.969 30.618-45.112 25.644-41.229 34.669-43.988 45.652-46.496 54.535-42.159 59.491-39.739 62.499-34.66 59.411-29.461" />
  </svg>
);

const FlakCream = ({ className, style }) => (
  <svg viewBox="0 0 170.079 186.77" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,48.2144,165.57071)" fill="#EFE4C8" d="M0 0C-.168-.194-.238-.269 0 0M-26.05 53.518C-26.131 53.517-26.214 53.524-26.295 53.521-26.528 53.513-26.826 53.628-27.052 53.58-26.742 53.646-26.402 53.614-26.05 53.518M-21.47 47.527C-21.498 47.541-21.521 47.552-21.534 47.559-21.638 47.617-21.705 47.635-21.758 47.641-21.758 47.645-21.757 47.646-21.757 47.65-21.734 48.081-21.613 47.898-21.47 47.527M110.15 62.303C107.116 63.184 104.727 64.781 102.823 66.842 103.529 68.373 103.864 69.987 103.89 71.627 107.735 73.614 110.494 77.248 110.025 82.154 109.638 86.21 106.903 89.629 102.525 89.654 100.286 89.667 98.047 89.68 95.808 89.693 95.791 89.776 95.772 89.859 95.755 89.942 96.096 90.51 96.433 91.081 96.746 91.661 102.128 101.644 101.602 115.764 91.484 122.235 87.426 127.948 80.504 130.605 73.631 130.344 71.238 131.943 68.231 132.319 65.794 131.33 65.44 132.156 65.044 132.975 64.57 133.777 62.624 137.073 59.423 137.949 56.571 137.17 53.53 142.418 50.094 147.541 46.219 152.177 44.129 154.678 41.587 157.301 38.336 158.187 33.582 159.483 29.055 156.611 27.626 152.049 25.506 145.277 27.868 136.599 29.08 129.88 29.306 128.625 29.59 127.328 29.898 126.01 29.882 125.982 29.865 125.955 29.849 125.928 28.135 124.055 26.418 122.185 24.71 120.308 23.918 119.437 22.939 118.469 21.906 117.431 21.381 117.615 20.844 117.777 20.293 117.908 16.407 124.779 12.204 132.099 11.117 139.561 10.307 145.122 2.057 146.775-1.419 142.871-7.775 135.73-6.737 125.805-4.314 117.219-4.223 116.895-4.111 116.574-4.015 116.251-7.819 115.72-11.541 114.236-14.5 111.961-21.762 114.214-29.373 114.816-36.422 113.282-43.959 111.641-43.148 100.885-36.422 98.818-29.578 96.714-23.759 92.901-18.416 88.34-20.759 88.357-23.047 87.64-24.772 85.878-28.055 82.525-27.219 78.105-25.606 74.209-22.098 65.735-14.95 59.381-7.67 54.053-10.925 53.889-14.181 53.732-17.439 53.612-19.622 53.532-21.81 53.451-23.995 53.466-24.472 53.469-24.953 53.493-25.433 53.509-29.306 54.641-34.412 52.786-35.444 48.477-37.939 38.061-28.156 33.128-19.643 31.287-12.564 29.757-5.314 29.111 1.923 28.51 .46 22.217-.966 15.912-2.183 9.568-3.345 3.505-4.649-2.693-3.781-8.86-3.037-14.148 3.398-15.053 7.236-13.342 12.229-11.117 15.582-4.028 18.151 .638 18.69-.342 19.373-1.294 20.226-2.201 25.939-8.272 35.783-8.166 42.419-3.696 46.618-.867 48.926 3.22 50.119 7.756 57.704 3.858 66.779 2.626 74.906 4.709 80.686 6.19 88.654 10.306 92.058 15.338 97.075 22.757 91.471 28.464 84.373 30.439 84.335 30.449 84.258 30.473 84.159 30.504 85.116 32.223 85.851 34.067 86.308 35.971 87.099 39.259 87.17 43.268 86.072 46.52 86.044 46.603 86.006 46.683 85.976 46.765 86.932 46.624 87.894 46.427 88.868 46.138 91.649 45.314 94.118 46.242 95.839 47.967 97.975 47.722 99.924 48.397 101.384 49.651 102.872 48.948 104.456 48.334 106.162 47.839 115.451 45.143 119.417 59.614 110.15 62.303" />
  </svg>
);

const NativeSelect = React.memo(({ value, onChange, disabled, required, className, children, style, ...props }) => {
  const isPlaceholderValue = value === '' || value === null || typeof value === 'undefined';
  const styledChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    const isPlaceholderOption = child.props.value === '';

    return React.cloneElement(child, {
      style: {
        color: isPlaceholderOption ? '#a3a3a3' : '#171717',
        ...(child.props.style || {}),
      },
    });
  });

  return (
    <div
      className="relative"
      style={{ opacity: disabled ? 0.7 : 1, transition: 'opacity 0.18s ease-out' }}
    >
      <select
        value={value}
        onChange={(event) => {
          onChange?.(event);
        }}
        disabled={disabled}
        required={required}
        style={{
          color: isPlaceholderValue ? '#a3a3a3' : '#404040',
          ...style,
        }}
        onMouseDown={props.onMouseDown}
        onKeyDown={props.onKeyDown}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        className={`appearance-none pl-4 pr-10 transition-colors duration-200 ${className}`}
        {...props}
      >
        {styledChildren}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <ChevronDown className="w-4 h-4 text-neutral-400" />
      </div>
    </div>
  );
});

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

  const formatSessionOptionLabel = (dateKey, timeValue) => {
    const [year, month, day] = (dateKey || '').split('-').map(Number);

    if (!year || !month || !day) {
      return `${dateKey} | ${timeValue}`;
    }

    const weekdays = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];
    const weekday = weekdays[new Date(year, month - 1, day).getDay()];

    return `${day}. ${month}. ${year} - ${weekday} | ${timeValue}`;
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
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollButton(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Force top position when entering Booking, even if browser restores previous scroll.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);

    const rafId = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });

    const timeoutId = window.setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [location.key]);

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
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
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
  const [newTypeDuration, setNewTypeDuration] = useState(60); 
  const [pricingMode, setPricingMode] = useState('tiered'); 
  const [fixedPricePerChild, setFixedPricePerChild] = useState(15); 
  const [ageGroup, setAgeGroup] = useState('child'); 
  const [newAudienceType, setNewAudienceType] = useState('children'); 
  
  // Admin - téma pre detské tréningy
  const [sessionTheme, setSessionTheme] = useState('');
  const [useSessionTheme, setUseSessionTheme] = useState(false);
  const [lockedReservation, setLockedReservation] = useState(null);
  const [isLockedSelectionApplied, setIsLockedSelectionApplied] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardData, setGiftCardData] = useState(null);
  const [giftCardError, setGiftCardError] = useState('');
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [giftCardApplied, setGiftCardApplied] = useState(false);
  const [newTypeLink, setNewTypeLink] = useState('');
  const newTypeDescRef = useRef(null);

  // Edit type modal state
  const [showEditTypeModal, setShowEditTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null); // { id, name, description }
  const [editTypeDesc, setEditTypeDesc] = useState('');
  const [editTypeLink, setEditTypeLink] = useState('');
  const editTypeDescRef = useRef(null);

  // Delete type modal state
  const [showDeleteTypeModal, setShowDeleteTypeModal] = useState(false);
  const [deletingType, setDeletingType] = useState(null); // { id, name }
  const [deleteTypeLoading, setDeleteTypeLoading] = useState(false);
  const [deleteTypeError, setDeleteTypeError] = useState('');

  // Type detail modal state
  const [showTypeDetailModal, setShowTypeDetailModal] = useState(false);
  const [detailType, setDetailType] = useState(null);

  const calculateTotalPrice = () => {
    if (!selectedTypeObj) return 0;

    const childCount = ageGroup === 'adult' ? 1 : childrenCount;
    const priceObj = selectedTypeObj.prices.find(p => p.child_count === childCount);
    let basePrice = priceObj ? parseFloat(priceObj.price) : 0;

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
  };


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
      return; 
    }
    const newAges = [];
    for (let i = 0; i < childrenCount; i++) {
      newAges.push(childrenAges[i] || '');
    }
    setChildrenAges(newAges);
  }, [childrenCount, childrenAges]);

  useEffect(() => {
    setWarningMessage('');
    setDuplicateBookingConfirmedKey('');
    closeDuplicateBookingModal();

    setIsCreditMode(false);
    setSelectedCredit(null);
    setUseSeasonTicket(false);
    setSelectedSeasonTicket('');
    setServiceConsent(false);

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
          if (!acc[training.training_type]) acc[training.training_type] = {};
          if (!acc[training.training_type][date]) acc[training.training_type][date] = [];
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

    if (isLoggedIn) {
      Promise.all([
        fetchTrainingDates(),
        fetchSeasonTickets(),
        fetchCredits(),
        fetchUserBookings(),
      ]).catch(err => console.error('Init fetch error:', err));
    }
  }, [isLoggedIn, isAdmin]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setTypesLoading(true);
        const params = new URLSearchParams();
        if (isAdmin) params.set('admin', 'true');
        const targetAudience = (lockedReservation?.incomingAgeGroup || ageGroup) === 'adult' ? 'adults' : 'children';
        params.set('audience', targetAudience);
        const qs = params.toString();
        const response = await api.get(`/api/training-types${qs ? `?${qs}` : ''}`);
        setTrainingTypes(response.data);
      } catch (error) {
        console.error('Error fetching training types:', error);
      } finally {
        setTypesLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchTypes();
    }
  }, [isLoggedIn, isAdmin, ageGroup, lockedReservation]);

  // Helper: znovu načíta training types s aktuálnym audience filtrom
  const refetchTrainingTypes = useCallback(async () => {
    const params = new URLSearchParams();
    if (isAdmin) params.set('admin', 'true');
    const targetAudience = (lockedReservation?.incomingAgeGroup || ageGroup) === 'adult' ? 'adults' : 'children';
    params.set('audience', targetAudience);
    const qs = params.toString();
    const response = await api.get(`/api/training-types${qs ? `?${qs}` : ''}`);
    setTrainingTypes(response.data);
  }, [isAdmin, ageGroup, lockedReservation]);

  useEffect(() => {
    if (!trainingTypeId || trainingTypes.length === 0) return;

    const typeObj = trainingTypes.find(t => t.id === Number(trainingTypeId));
    setSelectedTypeObj(typeObj || null);

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
      acc[training.training_type][date].push({ time, id: training.id, theme: training.theme });
      return acc;
    }, {});
  };

  const handleCreateType = async (e) => {
    e.preventDefault();

    let calculatedPrices = [];
    const price = parseFloat(fixedPricePerChild);

    if (newAudienceType === 'adults') {
      calculatedPrices = [
        { child_count: 1, price: price }
      ];
    } else if (newAudienceType === 'both') {
      calculatedPrices = [
        { child_count: 1, price: price },
        { child_count: 2, price: price * 2 },
        { child_count: 3, price: price * 3 }
      ];
    } else {
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

      setNewTypeName('');
      setNewTypeDesc('');
      setNewTypeLink('');
      setNewTypeDuration(60);
      setNewTypeColor('#3b82f6');
      setPricingMode('tiered');
      setNewAudienceType('children');
      setFixedPricePerChild(15);

      await refetchTrainingTypes();
    } catch (error) {
      console.error(error);
      alert("Nepodarilo sa vytvoriť typ tréningu");
    }
  };

  const toggleTypeStatus = async (typeId, currentStatus) => {
    try {
      await api.put(`/api/admin/training-types/${typeId}/toggle`, { active: !currentStatus });
      // Optimistic update — zmeň len daný typ v existujúcom poli, bez nového API callu
      setTrainingTypes(prev =>
        prev.map(t => t.id === typeId ? { ...t, active: !currentStatus } : t)
      );
    } catch (error) {
      console.error(error);
      alert('Nepodarilo sa zmeniť stav typu tréningu');
    }
  };

  // Vloží link na pozíciu kurzora v textarea (Create modal)
  const insertLinkIntoDesc = () => {
    if (!newTypeLink.trim()) return;
    const textarea = newTypeDescRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = newTypeDesc.substring(0, start);
    const after = newTypeDesc.substring(end);
    const inserted = before + newTypeLink + after;
    setNewTypeDesc(inserted);
    // Obnov focus a pozíciu kurzora za vloženým linkom
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newTypeLink.length, start + newTypeLink.length);
    }, 0);
  };

  // Vloží link na pozíciu kurzora v Edit modal textarea
  const insertLinkIntoEditDesc = () => {
    if (!editTypeLink.trim()) return;
    const textarea = editTypeDescRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = editTypeDesc.substring(0, start);
    const after = editTypeDesc.substring(end);
    const inserted = before + editTypeLink + after;
    setEditTypeDesc(inserted);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + editTypeLink.length, start + editTypeLink.length);
    }, 0);
  };

  // Otvor Edit modal pre daný typ
  const openEditTypeModal = (type) => {
    setEditingType(type);
    setEditTypeDesc(type.description || '');
    setEditTypeLink('');
    setShowEditTypeModal(true);
  };

  // Ulož popis (a príp. nový link v texte)
  const handleSaveEditType = async () => {
    if (!editingType) return;
    try {
      await api.put(`/api/admin/training-types/${editingType.id}/description`, {
        description: editTypeDesc
      });
      await refetchTrainingTypes();
      setShowEditTypeModal(false);
      setEditingType(null);
    } catch (error) {
      console.error(error);
      alert('Nepodarilo sa uložiť popis');
    }
  };

  // Otvor Delete confirm modal
  const openDeleteTypeModal = (type) => {
    setDeletingType(type);
    setDeleteTypeError('');
    setShowDeleteTypeModal(true);
  };

  // Vymaž typ tréningu
  const handleDeleteType = async () => {
    if (!deletingType) return;
    setDeleteTypeLoading(true);
    setDeleteTypeError('');
    try {
      await api.delete(`/api/admin/training-types/${deletingType.id}`);
      await refetchTrainingTypes();
      setShowDeleteTypeModal(false);
      setDeletingType(null);
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.error || 'Nepodarilo sa vymazať typ tréningu';
      setDeleteTypeError(msg);
    } finally {
      setDeleteTypeLoading(false);
    }
  };

  const handleTypeChange = (e) => {
    const newId = e.target.value; 
    setTrainingTypeId(newId);     
    setDuplicateBookingConfirmedKey('');
    closeDuplicateBookingModal();

    if (!newId) {
      setTrainingType('');
      setSelectedTypeObj(null);
    }

    setSelectedDate('');
    setSelectedTime('');
    setTrainingId(null);
  };

  useEffect(() => {
    const checkAvailability = async () => {
      if (!trainingId || !childrenCount) {
        setAvailability({ isAvailable: true, remainingSpots: 0, requestedChildren: 0 });
        return;
      }

      try {
        const response = await api.get('/api/check-availability', {
          params: {
            trainingId,
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
        giftCardCode: giftCardApplied ? giftCardCode.trim().toUpperCase() : null,
        giftCardDiscount: giftCardApplied ? giftCardDiscount() : 0,
      });

      // Handle free gift card booking
      if (paymentSession.data.free) {
        // Reset gift card state
        setGiftCardApplied(false);
        setGiftCardData(null);
        setGiftCardCode('');
        // Navigate to success page — same as after Stripe payment
        navigate('/payment-success?gift_card=true&booking_id=' + (paymentSession.data.bookingId || ''));
        return;
      }

      const stripe = await stripePromise;

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
      totalPrice: calculateFinalPrice(),
      photoConsent: photoConsent === true ? true : null,
      mobile,
      note,
      accompanyingPerson,
      allowDuplicate,
      giftCardCode: giftCardApplied ? giftCardCode.trim().toUpperCase() : null,
      giftCardDiscount: giftCardApplied ? giftCardDiscount() : 0,
    });

    // Handle free gift card booking
    if (paymentSession.data.free) {
      // Reset gift card state
      setGiftCardApplied(false);
      setGiftCardData(null);
      setGiftCardCode('');
      // Navigate to success page — same as after Stripe payment
      navigate('/payment-success?gift_card=true&booking_id=' + (paymentSession.data.bookingId || ''));
      return;
    }

    const stripe = await stripePromise;

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

    if (!trainingId || !selectedDate || !selectedTime) {
      setWarningMessage(t?.booking?.selectDateTimeRequired || 'Prosím, vyberte termín tréningu.');
      setLoading(false);
      return;
    }

    if (isCreditMode) {
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

  const handleSessionSelect = async (e) => {
    const id = e.target.value;
    if (!id) {
      setTrainingId(null);
      setSelectedDate('');
      setSelectedTime('');
      return;
    }

    // Find which date this session belongs to
    const typeSessions = trainingDates[trainingType] || {};
    let foundDate = '';
    let foundSession = null;

    for (const [dateKey, sessions] of Object.entries(typeSessions)) {
      const match = sessions.find((s) => String(s.id) === String(id));
      if (match) {
        foundDate = dateKey;
        foundSession = match;
        break;
      }
    }

    if (!foundDate || !foundSession) return;

    // Ensure UI state is set before any duplicate-check logic runs
    setSelectedDate(foundDate);
    setSelectedTime(foundSession.time);
    setTrainingId(String(id));

    // Duplicate check (reuse existing logic)
    const duplicateDateKey = createDuplicateDateKey(trainingType, foundDate);
    if (
      hasDuplicateBookingForDate(trainingType, foundDate) &&
      duplicateBookingConfirmedKey !== duplicateDateKey &&
      duplicateBookingConfirmedKey !== createDuplicateSessionKey(trainingType, foundDate, foundSession.time)
    ) {
      setDuplicateBookingModalContext({
        source: 'calendar',
        typeName: trainingType,
        date: foundDate,
      });
      setShowDuplicateBookingModal(true);
      return;
    }

    const sessionKey = createDuplicateSessionKey(trainingType, foundDate, foundSession.time);
    if (duplicateBookingConfirmedKey !== sessionKey) {
      await checkDuplicateStatusForTraining({
        selectedTrainingId: id,
        typeName: trainingType,
        date: foundDate,
        time: foundSession.time,
        source: 'selection',
      });
    }
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

        if (pendingExistingSessionId) {
          try {
            const { error } = await stripe.redirectToCheckout({
              sessionId: pendingExistingSessionId,
            });

            if (!error) {
              return;
            }
          } catch (redirectError) {
            console.warn('Pending booking redirect failed, falling back to new checkout:', redirectError);
          }
        }

        if (pendingExistingBookingId) {
          try {
            await api.post('/api/bookings/cancel-pending', {
              bookingId: pendingExistingBookingId,
            });
          } catch (cancelErr) {
            console.warn('[PENDING] Could not cancel old pending booking:', cancelErr.message);
          }
        }

        await startPaidBookingCheckout({ forceAllowDuplicate: true });
        return;
      } catch (error) {
        console.error('Pending booking redirect error:', error);

        if (error.response?.status === 409) {
          const code = error.response?.data?.code;
          if (code === 'DUPLICATE_BOOKING' || code === 'ACTIVE_DUPLICATE') {
            openBackendDuplicateBookingModal();
            setWarningMessage('');
          } else if (code === 'PENDING_BOOKING') {
            openPendingDuplicateBookingModal(
              error.response?.data?.existingSessionId,
              error.response?.data?.existingBookingId
            );
            setWarningMessage('');
          }
        } else if (error.response?.data?.error) {
          setWarningMessage(error.response.data.error);
        } else {
          setWarningMessage('Nepodarilo sa presmerovať na platbu. Skúste to prosím znova.');
        }

        setLoading(false);
      }
      return;
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

  const handleValidateGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    setGiftCardLoading(true);
    setGiftCardError('');
    setGiftCardData(null);
    setGiftCardApplied(false);
    try {
      const res = await api.post('/api/validate-gift-card', { code: giftCardCode.trim().toUpperCase() });
      setGiftCardData(res.data);
      setGiftCardApplied(true);
    } catch (err) {
      setGiftCardError(err.response?.data?.error || 'Neplatný kód');
    } finally {
      setGiftCardLoading(false);
    }
  };

  const giftCardDiscount = () => {
    if (!giftCardApplied || !giftCardData) return 0;
    return Math.min(giftCardData.balance, calculateTotalPrice());
  };

  const calculateFinalPrice = () => {
    return Math.max(0, calculateTotalPrice() - giftCardDiscount());
  };

  const COMPATIBLE_CHILD_CREDIT_TYPES = new Set(['MINI', 'MIDI', 'MAXI']);
  const normalizeTrainingTypeName = (value) => (value || '').toString().trim().toUpperCase();

  const currentType = trainingTypes.find(t => t.name === trainingType);

  const getCreditsForAudience = (audience) => {
    return credits.filter(credit => {
      const creditType = trainingTypes.find(t => t.name === credit.training_type);
      if (!creditType) return false;
      return creditType.audience_type === audience || creditType.audience_type === 'both';
    });
  };

  const childCredits = useMemo(() => getCreditsForAudience('children'), [credits, trainingTypes]);
  const adultCredits = useMemo(() => getCreditsForAudience('adults'), [credits, trainingTypes]);

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

    const creditType = trainingTypes.find(t => t.name === credit.training_type);
    if (creditType) {
      setTrainingTypeId(String(creditType.id));
      setTrainingType(credit.training_type);
    }

    const isAdultCredit = creditType?.audience_type === 'adults';
    
    let parsedAges = [];
    
    if (isAdultCredit) {
      setChildrenCount(1);
      setChildrenAges([]);
      setAccompanyingPerson(false);
    } else {
      setChildrenCount(credit.child_count);
      setAccompanyingPerson(credit.accompanying_person === true);

      if (credit.children_ages) {
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

      if (parsedAges.length !== credit.child_count) {
        parsedAges = Array(credit.child_count).fill('');
      }

      setChildrenAges(parsedAges);
    }

    if (fillForm) {
      setPhotoConsent(credit.photo_consent);
      setMobile(credit.mobile || '');
      setNote(credit.note || '');
    } else {
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
  };

  if (!isLoggedIn) {
    return (
      <section className="section-wrapper container-custom max-w-lg mx-auto px-4">
        <div className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md p-6 sm:p-10">
          <h2 className="text-2xl font-extrabold text-center text-foreground mb-8">
            {t?.booking?.title || 'Book Your Training'}
          </h2>
          <Login
            onLoginSuccess={() => {
              localStorage.setItem('isLoggedIn', 'true');
              setIsLoggedIn(true);
            }}
          />
        </div>
      </section>
    );
  }

  const sortedSessions = useMemo(() => {
    if (!trainingType || !trainingDates[trainingType]) return [];
    return Object.entries(trainingDates[trainingType])
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([dateKey, sessions]) =>
        sessions.map((session) => ({
          date: dateKey,
          ...session,
        }))
      );
  }, [trainingType, trainingDates]);

  const availableSeasonTickets = getAvailableSeasonTickets(seasonTickets, selectedTypeObj);

  return (
    <div className="relative w-full bg-white">
    <section className="section-wrapper container-custom max-w-5xl mx-auto px-4 sm:px-6 relative">
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-elevated border border-neutral-200 text-foreground transition-all hover:bg-neutral-50 hover:-translate-y-1"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}

      <h2 className="text-3xl sm:text-5xl font-extrabold text-center text-foreground tracking-tight mb-8">
        {t?.booking?.title || 'Book Your Training'}
      </h2>

      {/* Age Group Toggle */}
      <div className="flex justify-center mb-6">
        <div className="relative bg-neutral-100 rounded-full p-1.5 flex shadow-2xs">
          <div
            className="absolute top-1.5 bottom-1.5 rounded-full bg-white shadow-sm"
            style={{
              width: 'calc(50% - 6px)',
              transition: 'transform 0.1s ease',
              transform: ageGroup === 'child' ? 'translateX(0)' : 'translateX(100%)',
            }}
          />
          <button
            type="button"
            className={`relative z-10 flex-1 flex items-center justify-center px-6 py-2.5 rounded-full font-bold text-sm transition-colors duration-200 ${
              ageGroup === 'child' ? 'text-primary' : 'text-neutral-500 hover:text-neutral-700'
            }`}
            disabled={Boolean(lockedReservation)}
            onClick={() => setAgeGroup('child')}
          >
            Tréning pre deti
          </button>
          <button
            type="button"
            className={`relative z-10 flex-1 flex items-center justify-center px-6 py-2.5 rounded-full font-bold text-sm transition-colors duration-200 ${
              ageGroup === 'adult' ? 'text-primary' : 'text-neutral-500 hover:text-neutral-700'
            }`}
            disabled={Boolean(lockedReservation)}
            onClick={() => setAgeGroup('adult')}
          >
            Tréning pre dospelých
          </button>
        </div>
      </div>

      {lockedReservation && (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Vybraný termín je predvyplnený z aktivít a v tomto formulári je uzamknutý.</span>
        </div>
      )}

      
      <div className="flex justify-center gap-3 mb-4">
        <button
          type="button"
          className="bg-primary hover:bg-primary-600 text-white px-6 py-3 rounded-full font-bold transition-all text-sm shadow-sm flex items-center justify-center gap-2"
          onClick={() => navigate(`/season-tickets?audience=${ageGroup}`)}
        >
          <Ticket className="w-4 h-4" />
          <span>{t?.booking?.seasonTickets || 'Zakúpiť permanentku'}</span>
        </button>
        <button
          type="button"
          className="bg-amber-400 hover:bg-amber-500 text-white px-6 py-3 rounded-full font-bold transition-all text-sm shadow-sm flex items-center justify-center gap-2"
          onClick={() => navigate('/gift-card')}
        >
          <Gift className="w-4 h-4" />
          <span>Darčekový poukaz 🎁</span>
        </button>
      </div>

      {/* Credit notifications */}
      {(ageGroup === 'child' && childCredits.length > 0) && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center mb-8 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Ticket className="w-6 h-6" />
          </div>
          <strong className="text-primary-700 text-lg">
            {t?.booking?.youHaveCredit || 'You have'} {childCredits.length}{' '}
            {childCredits.length === 1 ? 'credit' : 'credits'}!
          </strong>
          <button
            type="button"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-sm text-sm"
            onClick={() => setShowCreditModal(true)}
          >
            {t?.booking?.useCredit || 'Use Credit'}
          </button>
        </div>
      )}

      {(ageGroup === 'adult' && adultCredits.length > 0) && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center mb-8 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Ticket className="w-6 h-6" />
          </div>
          <strong className="text-primary-700 text-lg">
            {t?.booking?.youHaveCredit || 'You have'} {adultCredits.length}{' '}
            {adultCredits.length === 1 ? 'credit' : 'credits'}!
          </strong>
          <button
            type="button"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-sm text-sm"
            onClick={() => setShowCreditModal(true)}
          >
            {t?.booking?.useCredit || 'Use Credit'}
          </button>
        </div>
      )}

      {/* ADMIN PANEL */}
      {isAdmin && (
        <div className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] p-6 sm:p-8 mb-10 shadow-md relative overflow-hidden">
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 200, top: -45, left: -30, opacity: 0.22, transform: 'rotate(-20deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 190, top: '35%', right: -25, opacity: 0.20, transform: 'rotate(25deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 180, bottom: -35, left: '40%', opacity: 0.18, transform: 'rotate(50deg)' }} />
          <div className="relative z-10">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-100 pb-5 mb-6 gap-4">
            <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              <span>{t?.admin?.title || 'Admin Controls'}</span>
            </h3>
            <button 
              type="button"
              className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-full font-bold text-xs hover:bg-emerald-600 transition-all shadow-sm"
              onClick={() => setShowCreateTypeModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Vytvoriť nový typ tréningu</span>
            </button>
          </div>

          <form onSubmit={handleAddTrainingDate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-1">
                <label className="font-bold text-xs text-neutral-700 mb-1.5">
                  {t?.admin?.trainingType || 'Training Type'}
                </label>
                <NativeSelect
                  value={newTrainingType}
                  onChange={(e) => {
                    setNewTrainingType(e.target.value);
                    setUseSessionTheme(false);
                    setSessionTheme('');
                  }}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm font-medium py-2.5 w-full font-sans"
                >
                  <option value="">-- Select Type --</option>
                  {trainingTypes
                    .filter(type => type.active)
                    .map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                </NativeSelect>
              </div>

              <div>
                <label className="font-bold text-xs text-neutral-700 mb-1.5">{t?.admin?.date || "Date"}</label>
                <Form.Control
                  type="date"
                  value={newTrainingDate.split("T")[0] || ""}
                  onChange={(e) => {
                    const date = e.target.value;
                    const time = newTrainingDate.split("T")[1]?.substring(0, 5) || "00:00";
                    setNewTrainingDate(`${date}T${time}`);
                  }}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm font-medium py-2.5 w-full"
                />
              </div>

              <div>
                <label className="font-bold text-xs text-neutral-700 mb-1.5">{t?.admin?.time || "Time"}</label>
                <Form.Control
                  type="time"
                  value={newTrainingDate.split("T")[1]?.substring(0, 5) || ""}
                  onChange={(e) => {
                    const time = e.target.value;
                    const date = newTrainingDate.split("T")[0] || "";
                    setNewTrainingDate(`${date}T${time}`);
                  }}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm font-medium py-2.5 w-full"
                />
              </div>

              <div>
                <label className="font-bold text-xs text-neutral-700 mb-1.5">Max Part.</label>
                <Form.Control
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm font-medium py-2.5 w-full"
                />
              </div>

              {(() => {
                const selectedType = trainingTypes.find(t => t.id === parseInt(newTrainingType));
                const isChildrenType = selectedType?.audience_type === 'children';
                
                if (!isChildrenType) return null;
                
                return (
                  <div className="lg:col-span-1 h-full flex flex-col justify-end">
                    <Form.Check
                      type="checkbox"
                      id="useTheme"
                      checked={useSessionTheme}
                      onChange={(e) => {
                        setUseSessionTheme(e.target.checked);
                        if (!e.target.checked) setSessionTheme('');
                      }}
                      label={<span className="font-bold text-neutral-700 text-xs">Pridať tému</span>}
                      className="mb-1.5"
                    />
                    <Form.Control
                      type="text"
                      placeholder="napr. VIANOCE"
                      value={sessionTheme}
                      onChange={(e) => setSessionTheme(e.target.value)}
                      disabled={!useSessionTheme}
                      className={`rounded-xl border border-neutral-200 text-sm font-medium py-2.5 w-full ${!useSessionTheme ? 'bg-neutral-100' : 'bg-neutral-50/50'}`}
                    />
                  </div>
                );
              })()}

              <div className="flex items-end lg:col-span-5 sm:justify-end mt-2">
                <button 
                  type="submit" 
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm"
                >
                  {t?.admin?.addSession || 'Pridať tréning'}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 border-t border-neutral-100 pt-6">
            <h4 className="text-base font-extrabold mb-4 text-foreground">Správa kategórií (Aktívne/Neaktívne)</h4>
            {typesLoading ? (
              <div
                className="flex items-center justify-center py-8 gap-3"
              >
                <Spinner animation="border" size="sm" className="text-primary" />
                <span className="text-sm font-medium text-neutral-500">Načítavam hodiny...</span>
              </div>
            ) : (
              <div
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trainingTypes.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => { setDetailType(type); setShowTypeDetailModal(true); }}
                      className="flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 p-3 rounded-2xl border border-neutral-200 transition-colors w-full text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-sm text-foreground truncate">{type.name}</span>
                        {type.audience_type && (
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            type.audience_type === 'children' ? 'bg-blue-100 text-blue-700' :
                            type.audience_type === 'adults' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {type.audience_type === 'children' ? 'Deti' :
                             type.audience_type === 'adults' ? 'Dospelí' : 'Oboje'}
                          </span>
                        )}
                      </div>
                      <div className={`shrink-0 w-2 h-2 rounded-full ml-2 ${type.active ? 'bg-emerald-400' : 'bg-neutral-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
          </div>
      )}

      {/* USER BOOKING FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {isCreditMode && selectedCredit && isMiniMidiMaxiCredit(selectedCredit) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <strong className="text-sm">Tento kredit môžete využívať na hodiny MINI, MIDI alebo MAXI.</strong>
          </div>
        )}

        {/* 1. Training Details */}
        <div className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md overflow-hidden relative">
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 195, top: -45, left: '30%', opacity: 0.20, transform: 'rotate(-30deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 175, top: '40%', right: -25, opacity: 0.18, transform: 'rotate(20deg)' }} />
          <div className="relative z-10">
          <div className="relative z-10 bg-neutral-50 border-b border-neutral-100 px-6 sm:px-8 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <CalIcon className="w-4 h-4" />
            </div>
            <h5 className="text-lg font-extrabold text-foreground m-0">
              {t?.booking?.trainingDetails || 'Training Details'}
            </h5>
          </div>

          <div className="p-6 sm:p-8 relative z-10">
            <div className="mb-8">
              <label className="font-bold text-sm text-neutral-700 mb-2">
                {t?.booking?.trainingType?.label || 'Select Training Type'} <span className="text-red-500">*</span>
                {trainingTypeId && (
                  <span
                    className="ml-2 inline-flex items-center"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </span>
                )}
              </label>
              {typesLoading ? (
                <div
                  className="flex items-center justify-center py-4 gap-3"
                >
                  <Spinner animation="border" size="sm" className="text-primary" />
                  <span className="text-sm font-medium text-neutral-500">Načítavam hodiny...</span>
                </div>
              ) : (
                <div
                >
                  <NativeSelect
                    value={trainingTypeId}
                    onChange={handleTypeChange}
                    disabled={Boolean(lockedReservation)}
                    className="w-full text-base sm:text-lg py-3 rounded-xl border border-neutral-200 bg-neutral-50/50 font-medium font-sans focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">{t?.booking?.trainingType?.placeholder || 'Choose training type...'}</option>
                    {selectableTrainingTypes
                      .map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name} {type.duration_minutes ? `(${type.duration_minutes} min)` : ''} {!type.active ? '(Inactive)' : ''}
                        </option>
                      ))}
                  </NativeSelect>
                </div>
              )}
            </div>

            {trainingType && (
              <div
                className="mb-8 px-1"
              >
                <div>
                  <label className="font-bold text-sm text-neutral-700 mb-2">
                    {t?.booking?.selectDate || 'Select Available Date & Time'} <span className="text-red-500">*</span>
                    {trainingId && (
                      <span
                        className="ml-2 inline-flex items-center"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </span>
                    )}
                  </label>
                    <NativeSelect
                      value={trainingId || ''}
                      onChange={handleSessionSelect}
                      disabled={!trainingType || Boolean(lockedReservation)}
                      className="w-full text-base sm:text-lg py-3 rounded-xl border border-neutral-200 bg-neutral-50/50 font-medium font-sans focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">-- {t?.booking?.selectDate || 'Choose a date and time'} --</option>
                      {sortedSessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {formatSessionOptionLabel(session.date, session.time)}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>
              )}

            {!availability.isAvailable && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-red-800 text-sm">
                  <div className="font-bold mb-1">
                    {t?.booking?.availability?.warning || 'Availability Warning'}:
                  </div>
                  <div>{formatAvailabilityMessage()}</div>
                </div>
              </div>
            )}
          </div>
        </div>
          </div>

        {/* 2. Personal Information */}
        <div
          className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md overflow-hidden relative"
        >
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 185, top: -40, right: -28, opacity: 0.20, transform: 'rotate(40deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 170, bottom: -35, left: '25%', opacity: 0.18, transform: 'rotate(-20deg)' }} />
          <div className="relative z-10">
          <div className="relative z-10 bg-neutral-50 border-b border-neutral-100 px-6 sm:px-8 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-4 h-4" />
            </div>
            <h5 className="text-lg font-extrabold text-foreground m-0">
              {t?.booking?.personalInfo || 'Personal Information'}
            </h5>
          </div>
          <div className="p-6 sm:p-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="font-bold text-sm text-neutral-700 mb-2">
                  {t?.booking?.name || 'Your Name'}
                </label>
                <Form.Control
                  type="text"
                  value={userData ? `${userData.first_name} ${userData.last_name}` : ''}
                  readOnly
                  className="bg-neutral-100 border-transparent rounded-xl py-3 text-sm font-medium text-neutral-600"
                />
              </div>
              <div>
                <label className="font-bold text-sm text-neutral-700 mb-2">
                  {t?.booking?.email || 'Your Email'}
                </label>
                <Form.Control
                  type="email"
                  value={userData ? userData.email : ''}
                  readOnly
                  className="bg-neutral-100 border-transparent rounded-xl py-3 text-sm font-medium text-neutral-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="font-bold text-sm text-neutral-700 mb-2">
                  {t?.booking?.mobile || 'Mobile Number'}
                </label>
                <IMaskInput
                  mask="+421 000 000 000"
                  definitions={{ '0': /[0-9]/ }}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl bg-neutral-50/50 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={mobile}
                  onAccept={(value) => setMobile(value)}
                  placeholder={t?.booking?.mobilePlaceholder || '+421 xxx xxx xxx'}
                />
              </div>
              <div>
                <label className="font-bold text-sm text-neutral-700 mb-2">
                  {t?.booking?.address || 'Address'}
                </label>
                <Form.Control
                  type="text"
                  value={userData ? userData.address : ''}
                  readOnly
                  className="bg-neutral-100 border-transparent rounded-xl py-3 text-sm font-medium text-neutral-600"
                />
              </div>
            </div>
          </div>
        </div>
          </div>

        {/* 3. Children Information */}
        {ageGroup === 'child' && (
          <div
            className="overflow-hidden"
          >
            <div
              className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md overflow-hidden relative"
            >
              <FlakCream className="absolute pointer-events-none z-0" style={{ width: 200, top: -42, left: -28, opacity: 0.18, transform: 'rotate(15deg)' }} />
              <FlakPink className="absolute pointer-events-none z-0" style={{ width: 165, top: '50%', right: -22, opacity: 0.16, transform: 'rotate(-35deg)' }} />
              <div className="relative z-10">
                <div className="relative z-10 bg-neutral-50 border-b border-neutral-100 px-6 sm:px-8 py-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="w-4 h-4" />
                  </div>
                  <h5 className="text-lg font-extrabold text-foreground m-0">
                    {t?.booking?.childrenInfo || 'Children Information'}
                  </h5>
                </div>
                <div className="p-6 sm:p-8 relative z-10">
                  <div className="mb-8">
                    <label className="font-bold text-sm text-neutral-700 mb-2">
                      {t?.booking?.childrenCount || 'Number of Children'} <span className="text-red-500">*</span>
                    </label>
                    <NativeSelect
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(parseInt(e.target.value))}
                      required
                      disabled={isCreditMode}
                      className="w-full text-base sm:text-lg py-3 rounded-xl border border-neutral-200 bg-neutral-50/50 font-medium font-sans focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {[1, 2, 3].map(num => {
                        const priceObj = currentType?.prices?.find(p => p.child_count === num);
                        const displayPrice = priceObj ? priceObj.price : 0;
                        const childLabel = num === 1
                          ? (t?.booking?.child || 'Child')
                          : (t?.booking?.children || 'Children');

                        return (
                          <option key={num} value={num}>
                            {num} {childLabel}{!useSeasonTicket && ` - €${displayPrice}`}
                          </option>
                        );
                      })}
                    </NativeSelect>
                  </div>

                  <div className="mb-2">
                    <label className="font-bold text-sm text-neutral-700 mb-4 block">
                      {t?.booking?.childrenAge || 'Age of Children'} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {childrenAges.map((age, index) => (
                        <div key={index} className="border border-neutral-200 rounded-2xl p-5 bg-neutral-50/30">
                          <label className="font-extrabold text-sm text-foreground mb-3 block">
                            {t?.booking?.childAge?.replace('{number}', index + 1) || `${index + 1}${getOrdinalSuffix(index + 1)} Child`}
                          </label>
                          <NativeSelect
                            value={age}
                            onChange={(e) => handleAgeChange(index, e.target.value)}
                            required
                            className="w-full rounded-xl border border-neutral-200 py-3 text-sm font-medium font-sans bg-neutral-50/50 focus:ring-2 focus:ring-primary focus:border-primary"
                          >
                            <option value="" disabled>
                              {t?.booking?.chooseAge || 'Vyberte vek'}
                            </option>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((ageOption) => (
                              <option key={ageOption} value={ageOption}>
                                {ageOption} {getYearLabel(ageOption)}
                              </option>
                            ))}
                          </NativeSelect>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

        {/* 4. Additional Options */}
        <div
          className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md overflow-hidden relative"
        >
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 190, top: -38, left: '40%', opacity: 0.20, transform: 'rotate(25deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 180, bottom: -32, right: -24, opacity: 0.17, transform: 'rotate(-40deg)' }} />
          <div className="relative z-10">
          <div className="relative z-10 bg-neutral-50 border-b border-neutral-100 px-6 sm:px-8 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Settings className="w-4 h-4" />
            </div>
            <h5 className="text-lg font-extrabold text-foreground m-0">
              {t?.booking?.additionalOptions || 'Additional Options'}
            </h5>
          </div>
          <div className="p-6 sm:p-8 relative z-10">
            <div className="mb-6">
              <label className="font-bold text-sm text-neutral-700 mb-2">
                {t?.booking?.notes || 'Additional Notes'}
              </label>
              <Form.Control
                as="textarea"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t?.booking?.notesPlaceholder || 'Any special requirements, allergies, or additional information...'}
                className="w-full py-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {ageGroup === 'child' && (
              <div className="mb-6">
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5">
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
                    className="m-0"
                    label={
                      <div className="ml-2">
                        <span className="font-extrabold text-sm text-foreground flex items-center gap-2">
                          {t?.booking?.accompanyingPerson || 'Participation of Accompanying Person'} (3€)
                          <button
                            type="button"
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 text-[11px] font-black leading-none text-neutral-500 hover:border-primary hover:text-primary transition-colors"
                            data-tooltip-id="accompanying-person-tooltip"
                            data-tooltip-content={t?.booking?.accompanyingPersonHelp || 'An accompanying person is someone other than the parent who accompanies the child.'}
                            onClick={(event) => event.preventDefault()}
                            aria-label="Show accompanying person help"
                          >
                            ?
                          </button>
                        </span>
                        {isCreditMode && (
                          <div className="text-primary text-xs mt-1.5 flex items-start gap-1">
                            <Info className="w-3.5 h-3.5 flex-shrink-0" /> 
                            <span>{t?.booking?.creditModeReadOnly || 'Set from original booking - read only'}</span>
                          </div>
                        )}
                        {useSeasonTicket && selectedSeasonTicket && !isCreditMode && (
                          <div className="text-amber-600 text-xs mt-1.5 flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> 
                            <span>{t?.booking?.notCoveredBySeasonTicket || 'Not covered by season ticket'}</span>
                          </div>
                        )}
                      </div>
                    }
                  />
                  <Tooltip
                    id="accompanying-person-tooltip"
                    className="z-[9999] max-w-xs px-3 py-2 text-sm font-medium text-neutral-900 shadow-sm"
                    opacity={1}
                    place="bottom"
                    offset={12}
                    style={{
                      backgroundColor: '#171717',
                      color: '#ffffff',
                      border: '5px solid #171717',
                      borderRadius: '1rem',
                      opacity: 3,
                    }}
                  />
                </div>
              </div>
            )}

            {!isCreditMode && seasonTickets.length > 0 && (
              <div className="mb-2">
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                  <Form.Check
                    type="checkbox"
                    id="useSeasonTicket"
                    checked={useSeasonTicket}
                    onChange={() => {
                      setUseSeasonTicket(!useSeasonTicket);
                      setSelectedSeasonTicket('');
                    }}
                    disabled={availableSeasonTickets.length === 0}
                    className="m-0"
                    label={
                      <span className="font-extrabold text-sm text-primary-700 ml-2 flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        {t?.booking?.useSeasonTicket || 'Use Season Ticket'}
                      </span>
                    }
                  />
                  {availableSeasonTickets.length === 0 && (
                    <div className="text-xs text-primary-600 mt-2 ml-7 font-medium">
                      {t?.booking?.noSeasonTicketForType || 'Pre tento tréning nemáte žiadnu permanentku.'}
                    </div>
                  )}
                  {useSeasonTicket && (
                    <div className="mt-5 ml-7">
                      <label className="font-bold text-xs text-primary-800 mb-2 block">
                        {t?.booking?.selectSeasonTicket || 'Select Season Ticket'} <span className="text-red-500">*</span>
                      </label>
                      <NativeSelect
                        value={selectedSeasonTicket}
                        onChange={(e) => setSelectedSeasonTicket(e.target.value)}
                        required={useSeasonTicket}
                        className="w-full text-xs sm:text-sm py-2.5 rounded-xl border border-primary/20 bg-white font-medium font-sans focus:ring-2 focus:ring-primary focus:border-primary"
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
                      </NativeSelect>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
          </div>

        {/* Gift Card Section */}
        <div
          className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md overflow-hidden relative"
        >
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 185, top: -40, right: '35%', opacity: 0.18, transform: 'rotate(-25deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 175, bottom: -30, left: -22, opacity: 0.16, transform: 'rotate(30deg)' }} />
          <div className="relative z-10">
          <div className="relative z-10 bg-neutral-50 border-b border-neutral-100 px-6 sm:px-8 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-500">
              <Gift className="w-4 h-4" />
            </div>
            <h5 className="text-lg font-extrabold text-foreground m-0">Máte darčekový poukaz?</h5>
          </div>
          <div className="p-6 sm:p-8 relative z-10">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={giftCardCode}
                onChange={e => {
                  setGiftCardCode(e.target.value.toUpperCase());
                  setGiftCardApplied(false);
                  setGiftCardData(null);
                  setGiftCardError('');
                }}
                placeholder="Zadajte kód poukazu"
                maxLength={12}
                className="w-full sm:flex-1 px-4 py-3 border border-neutral-200 rounded-xl bg-neutral-50/50 text-sm font-mono font-bold tracking-widest uppercase focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
                disabled={giftCardApplied}
              />
              {giftCardApplied ? (
                <button
                  type="button"
                  onClick={() => { setGiftCardApplied(false); setGiftCardData(null); setGiftCardCode(''); setGiftCardError(''); }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-sm hover:bg-neutral-100 transition-all"
                >
                  Zrušiť
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleValidateGiftCard}
                  disabled={!giftCardCode.trim() || giftCardLoading}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-400 text-white font-bold text-sm hover:bg-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {giftCardLoading ? <Spinner animation="border" size="sm" /> : 'Uplatniť'}
                </button>
              )}
            </div>

            {giftCardError && (
              <div
                className="mt-3 text-sm text-red-600 font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {giftCardError}
              </div>
            )}
            {giftCardApplied && giftCardData && (() => {
              const discount = giftCardDiscount();
              const totalPrice = calculateTotalPrice();
              const remainingOnCard = parseFloat((giftCardData.balance - discount).toFixed(2));
              const remainingToPay = parseFloat((totalPrice - discount).toFixed(2));
              const coversAll = discount >= totalPrice;

              return (
                <div
                  className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800"
                >
                    <div className="flex items-center gap-2 font-bold mb-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      Poukaz uplatnený
                    </div>
                    <div className="flex flex-col gap-1 pl-6">
                      <span>
                        💳 Uhradené poukazom: <strong>{discount.toFixed(2)} €</strong>
                      </span>
                      {coversAll ? (
                        <span className="text-green-700">
                          ✅ Rezervácia plne uhradená · zostatok na poukaze: <strong>{remainingOnCard.toFixed(2)} €</strong>
                          {remainingOnCard > 0 && (
                            <span className="text-xs font-normal ml-1">(môžete uplatniť na ďalšiu rezerváciu)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-amber-700">
                          💰 Zostáva doplatiť kartou: <strong>{remainingToPay.toFixed(2)} €</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
          </div>

        {/* 5. Consents and Agreements */}
        <div
          className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md overflow-hidden relative"
        >
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 200, top: -44, left: -30, opacity: 0.18, transform: 'rotate(-15deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 170, top: '45%', right: -22, opacity: 0.16, transform: 'rotate(45deg)' }} />
          <div className="relative z-10">
          <div className="relative z-10 bg-neutral-50 border-b border-neutral-100 px-6 sm:px-8 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-4 h-4" />
            </div>
            <h5 className="text-lg font-extrabold text-foreground m-0">
              {t?.booking?.consents || 'Consents and Agreements'}
            </h5>
          </div>
          <div className="p-6 sm:p-8 space-y-4 relative z-10">
            <div>
              <div className="flex items-start">
                <Form.Check
                  type="checkbox"
                  id="photoConsent"
                  checked={photoConsent === true}
                  onChange={e => setPhotoConsent(e.target.checked ? true : null)}
                  className="mt-1"
                />
                <label htmlFor="photoConsent" className="ml-3 text-sm text-neutral-600 leading-relaxed font-medium cursor-pointer">
                  {ageGroup === 'child' ? (
                    <>
                      Ako zákonní zástupcovia dieťaťa udeľujeme občianske združenie Nitráčik o.z. súhlas na spracúvanie fotografií, videí nášho dieťaťa. Informáciu o podmienkach spracúvania osobných údajov nájdete{' '}
                      <a href="/photo-consent-info" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">TU</a>
                    </>
                  ) : (
                    <>
                      Udeľujem súhlas so spracúvaním fotografií a videí môjej osoby počas tréningu. Informáciu o podmienkach spracúvania osobných údajov nájdete{' '}
                      <a href="/photo-consent-info" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">TU</a>
                    </>
                  )}
                </label>
              </div>
            </div>

            {!useSeasonTicket && !isCreditMode && (
              <div>
                <div className="flex items-start">
                  <Form.Check
                    type="checkbox"
                    id="serviceConsent"
                    checked={serviceConsent}
                    onChange={() => setServiceConsent(!serviceConsent)}
                    required
                    className="mt-1"
                  />
                  <label htmlFor="serviceConsent" className="ml-3 text-sm text-neutral-700 leading-relaxed font-bold cursor-pointer">
                    Súhlasím so{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setShowServiceConsentModal(true); }}
                      className="text-primary hover:text-primary-600 underline font-extrabold px-0 inline bg-transparent border-none p-0 m-0 cursor-pointer"
                    >
                      začatím poskytovania služby
                    </button>
                    {' '}pred uplynutím lehoty na odstúpenie od zmluvy. <span className="text-red-500">(povinné)</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-start">
                <Form.Check
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={() => setConsent(!consent)}
                  required
                  className="mt-1"
                />
                <label htmlFor="consent" className="ml-3 text-sm text-neutral-700 leading-relaxed font-bold cursor-pointer">
                  Vyjadrujem súhlas so{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 underline font-extrabold">Všeobecnými obchodnými podmienkami</a>
                  {' '}a beriem na vedomie, že Informáciu o spracúvaní osobných údajov nájdem{' '}
                  <a href="/gdpr" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 underline font-extrabold">TU</a>.
                  {' '}<span className="text-red-500">(povinné)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
          </div>

        {/* 6. Pricing and Submission */}

        <div
          className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md overflow-hidden mb-8 relative"
        >
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 210, top: -45, right: -35, opacity: 0.22, transform: 'rotate(35deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 180, bottom: -35, left: -25, opacity: 0.20, transform: 'rotate(-15deg)' }} />
          <div className="relative z-10">
          <div className="relative z-10 bg-neutral-50 border-b border-neutral-100 px-6 sm:px-8 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
            <h5 className="text-lg font-extrabold text-foreground m-0">
              {t?.booking?.summary || 'Zhrnutie a platba'}
            </h5>
          </div>
          <div className="p-8 sm:p-10 text-center relative z-10">
            {!useSeasonTicket && !isCreditMode && (
              <div className="mb-8">
                {giftCardApplied && giftCardDiscount() > 0 && (
                  <div className="text-neutral-400 text-lg line-through mb-1">
                    €{calculateTotalPrice().toFixed(2)}
                  </div>
                )}
                <h4 className="text-3xl sm:text-4xl font-black text-foreground mb-1">
                  Celková cena: <span className="text-primary">€{calculateFinalPrice().toFixed(2)}</span>
                </h4>
                {giftCardApplied && giftCardDiscount() > 0 && (
                  <div className="text-amber-600 text-sm font-bold mt-1">
                    Darčekový poukaz: −€{giftCardDiscount().toFixed(2)}
                  </div>
                )}
                <div className="text-neutral-500 text-sm font-medium">
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
              <div 
                className="overflow-hidden mb-6"
              >
                <div className="bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-2xl flex items-center gap-3 font-bold text-sm text-left">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                  <span>{warningMessage}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 px-8 rounded-full font-extrabold text-base sm:text-lg bg-gradient-to-r from-emerald-500 to-emerald-400 text-white hover:from-emerald-600 hover:to-emerald-500 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              disabled={
                !consent ||
                loading ||
                !availability.isAvailable ||
                (useSeasonTicket && !selectedSeasonTicket) ||
                (isCreditMode && (!selectedDate || !selectedTime)) ||
                (!useSeasonTicket && !isCreditMode && !serviceConsent) ||
                (!isCreditMode && !trainingId)
              }
              data-tooltip-id="booking-tooltip"
              data-tooltip-content={
                !availability.isAvailable
                  ? formatAvailabilityMessage()
                  : !consent
                    ? t?.booking?.consentRequired || 'You must agree to the rules to complete the booking.'
                    : useSeasonTicket && !selectedSeasonTicket
                      ? t?.booking?.selectSeasonTicketRequired || 'Please select a season ticket.'
                      : !isCreditMode && !trainingId
                        ? t?.booking?.selectDateTimeRequired || 'Prosím, vyberte termín.'
                        : isCreditMode && (!selectedDate || !selectedTime)
                          ? t?.booking?.selectDateTimeRequired || 'Prosím, vyberte dátum a čas pre rezerváciu s kreditom.'
                        : ''
              }
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>{t?.booking?.processing || 'Processing...'}</span>
                </>
              ) : (
                <>
                  {isCreditMode ? (
                    <>
                      <Ticket className="w-5 h-5" />
                      <span>{t?.booking?.bookWithCredit || 'Book with Credit'}</span>
                    </>
                  ) : useSeasonTicket ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t?.booking?.bookWithSeasonTicket || 'Book with Season Ticket'}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>{t?.booking?.bookWithPayment || 'Confirm reservation'}</span>
                    </>
                  )}
                </>
              )}
            </button>
            <Tooltip id="booking-tooltip" className="z-[9999]" />

            {!isCreditMode && !useSeasonTicket && (
              <div className="mt-4">
                <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  {t?.booking?.paymentObligation || 'with payment obligation'}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center items-center gap-2 text-neutral-400 text-xs font-bold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              <span>{t?.booking?.secureBooking || 'Your booking is secure and protected'}</span>
            </div>
          </div>
          </div>
        </div>
      </form>

      {/* Duplicate Booking Modal */}
      <Modal show={showDuplicateBookingModal} onHide={handleDuplicateBookingCancel} centered>
        <Modal.Header closeButton className="border-neutral-200">
          <Modal.Title className="font-extrabold text-xl text-foreground">
            {t?.booking?.duplicateBookingTitle || 'Duplicate booking confirmation'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6">
          <p className="mb-0 text-neutral-700 font-medium leading-relaxed">
            {duplicateBookingModalContext?.source === 'pending'
              ? 'Na tento termín už máte rozpracovanú rezerváciu. Dokončite platbu.'
              : duplicateBookingModalContext?.source === 'activity' || duplicateBookingModalContext?.source === 'backend' || duplicateBookingModalContext?.source === 'selection'
              ? t?.booking?.duplicateBookingSessionMessage || 'You already have a booking for this session. Do you really want to create another one?'
              : t?.booking?.duplicateBookingDateMessage || 'You already have a booking on this date. Do you really want to continue and create another one?'}
          </p>
          {duplicateBookingModalContext?.source === 'pending' && pendingExistingBookingId && (
            <p className="mt-3 mb-0 text-xs font-bold text-neutral-400">ID rezervácie: {pendingExistingBookingId}</p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-neutral-200 p-6">
          <button 
            type="button" 
            onClick={handleDuplicateBookingCancel}
            className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 transition-all text-sm"
          >
            {duplicateBookingModalContext?.source === 'pending'
              ? 'Zrušiť'
              : duplicateBookingModalContext?.source === 'activity'
              ? t?.booking?.duplicateBookingBackToActivities || t?.activities?.backToActivities || 'Back to activities'
              : t?.booking?.duplicateBookingCancel || t?.booking?.cancel || 'No'}
          </button>
          <button 
            type="button" 
            onClick={handleDuplicateBookingConfirm}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-600 transition-all text-sm shadow-sm"
          >
            {duplicateBookingModalContext?.source === 'pending'
              ? 'Dokončiť platbu'
              : t?.booking?.duplicateBookingConfirm || 'Yes, continue'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Credit Selection Modal */}
      {(ageGroup === 'child' || ageGroup === 'adult') && (
        <Modal show={showCreditModal} onHide={() => {
          setShowCreditModal(false);
          setFillFormPreference({});
        }} centered size="lg">
          <Modal.Header closeButton className="border-neutral-200">
            <Modal.Title className="font-extrabold text-xl text-foreground">
              {t?.booking?.chooseCredit || 'Choose Your Credit'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-6">
            {(ageGroup === 'child' ? childCredits : adultCredits).length === 0 ? (
              <p className="text-neutral-500 font-medium text-center py-8">{t?.booking?.noCredits || 'No credits available.'}</p>
            ) : (
              <div className="space-y-4">
                {(ageGroup === 'child' ? childCredits : adultCredits).map((credit) => (
                  <div key={credit.id} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 transition-all hover:border-primary/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-neutral-700 mb-4">
                      <div><strong className="text-foreground">{t?.booking?.originalDate || 'Original Date'}:</strong> {new Date(credit.original_date).toLocaleString('sk-SK')}</div>
                      <div><strong className="text-foreground">{t?.booking?.trainingType?.label || 'Training Type'}:</strong> {credit.training_type}</div>
                      <div><strong className="text-foreground">{t?.booking?.children || 'Children'}:</strong> {credit.child_count}</div>
                      <div><strong className="text-foreground">{t?.booking?.accompanyingPerson || 'Accompanying Person'}:</strong> {credit.accompanying_person ? 'Áno' : 'Nie'}</div>
                      <div><strong className="text-foreground">{t?.booking?.photoConsent || 'Photo Consent'}:</strong> {credit.photo_consent ? 'Súhlas' : 'Nesúhlas'}</div>
                      {credit.mobile && <div className="sm:col-span-2"><strong className="text-foreground">{t?.booking?.mobile || 'Mobile'}:</strong> {credit.mobile}</div>}
                      {credit.note && <div className="sm:col-span-2"><strong className="text-foreground">{t?.booking?.notes || 'Notes'}:</strong> {credit.note}</div>}
                    </div>

                    {isMiniMidiMaxiCredit(credit) && (
                      <div className="bg-amber-50 text-amber-800 px-3 py-2 rounded-xl text-xs font-bold mb-4 border border-amber-200">
                        Tento kredit môžete využívať na hodiny MINI, MIDI alebo MAXI.
                      </div>
                    )}

                    <Form.Check
                      type="checkbox"
                      id={`fill-form-${credit.id}`}
                      label={<span className="font-bold text-sm text-neutral-700">Predvyplniť formulár podľa pôvodnej rezervácie</span>}
                      className="mb-4"
                      checked={fillFormPreference[credit.id] || false}
                      onChange={(e) => {
                        setFillFormPreference(prev => ({
                          ...prev,
                          [credit.id]: e.target.checked
                        }));
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => selectCredit(credit, fillFormPreference[credit.id] || false)}
                      className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm text-sm flex items-center justify-center gap-2"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>{t?.booking?.useThisCredit || 'Použiť tento kredit'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-neutral-200 p-6">
            <button 
              type="button" 
              onClick={() => { setShowCreditModal(false); setFillFormPreference({}); }}
              className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 transition-all text-sm"
            >
              {t?.booking?.cancel || 'Cancel'}
            </button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Admin Create Type Modal */}
      <Modal show={showCreateTypeModal} onHide={() => setShowCreateTypeModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-neutral-200">
          <Modal.Title className="font-extrabold text-xl text-foreground">Vytvoriť nový typ tréningu</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleCreateType}>
          <Modal.Body className="p-6 space-y-6">
            <div>
              <label className="block font-bold mb-3 text-sm text-neutral-700">Cieľová skupina *</label>
              <div className="flex flex-wrap gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <Form.Check
                  type="radio"
                  label={<span className="font-bold text-sm text-foreground">Deti</span>}
                  name="audienceType"
                  value="children"
                  checked={newAudienceType === 'children'}
                  onChange={(e) => setNewAudienceType(e.target.value)}
                  className="m-0"
                />
                <Form.Check
                  type="radio"
                  label={<span className="font-bold text-sm text-foreground">Dospelí</span>}
                  name="audienceType"
                  value="adults"
                  checked={newAudienceType === 'adults'}
                  onChange={(e) => setNewAudienceType(e.target.value)}
                  className="m-0"
                />
                <Form.Check
                  type="radio"
                  label={<span className="font-bold text-sm text-foreground">Oboje</span>}
                  name="audienceType"
                  value="both"
                  checked={newAudienceType === 'both'}
                  onChange={(e) => setNewAudienceType(e.target.value)}
                  className="m-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="font-bold text-sm text-neutral-700 mb-1.5">Názov *</label>
                <Form.Control
                  required
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  placeholder="napr. Maľovanie, MIDI, Yoga"
                  className="rounded-xl border-neutral-200 bg-neutral-50/50 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-sm text-neutral-700 mb-1.5">Trvanie (min) *</label>
                <Form.Control
                  type="number"
                  required
                  value={newTypeDuration}
                  onChange={e => setNewTypeDuration(e.target.value)}
                  className="rounded-xl border-neutral-200 bg-neutral-50/50 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {newAudienceType === 'children' && (
                <div>
                  <label className="font-bold text-sm text-neutral-700 mb-1.5">Sprevádzajúca osoba (€)</label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={newAccompanyingPrice}
                    onChange={e => setNewAccompanyingPrice(e.target.value)}
                    className="rounded-xl border-neutral-200 bg-neutral-50/50 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Link helper */}
              <div>
                <label className="font-bold text-sm text-neutral-700 mb-1.5 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-neutral-400" />
                  Link (voliteľný)
                </label>
                <div className="flex gap-2">
                  <Form.Control
                    type="url"
                    value={newTypeLink}
                    onChange={e => setNewTypeLink(e.target.value)}
                    placeholder="https://..."
                    className="rounded-xl border-neutral-200 bg-neutral-50/50 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={insertLinkIntoDesc}
                    disabled={!newTypeLink.trim()}
                    title="Vložiť link do popisu na pozíciu kurzora"
                    className="px-4 py-2 rounded-xl bg-primary text-white font-extrabold text-base hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    #
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 font-medium">
                  Klikni do poľa Popis, umiestni kurzor, potom stlač <strong>#</strong> pre vloženie linku.
                </p>
              </div>

              {/* Popis textarea */}
              <div>
                <label className="font-bold text-sm text-neutral-700 mb-1.5">Popis</label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  ref={newTypeDescRef}
                  value={newTypeDesc}
                  onChange={e => setNewTypeDesc(e.target.value)}
                  className="rounded-xl border-neutral-200 bg-neutral-50/50 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block font-bold mb-2 text-sm text-neutral-700">Farba v kalendári</label>
              <div className="flex items-center gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-12 h-12 rounded-xl border border-neutral-200 cursor-pointer shadow-sm hover:scale-105 transition-transform"
                  style={{ backgroundColor: newTypeColor }}
                />
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-bold uppercase text-foreground">{newTypeColor}</span>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="text-xs text-primary font-bold hover:underline text-left mt-0.5"
                  >
                    {showColorPicker ? 'Zavrieť výber' : 'Vybrať farbu'}
                  </button>
                </div>

                <div className="ml-auto hidden sm:block">
                  <div className="text-[10px] text-neutral-400 uppercase font-bold mb-1.5">Náhľad v rozvrhu</div>
                  <div
                    className="px-3 py-1.5 rounded-lg text-xs font-black uppercase border-l-4"
                    style={{
                      backgroundColor: `${newTypeColor}15`,
                      borderColor: newTypeColor,
                      color: '#1f2937'
                    }}
                  >
                    {newTypeName || 'Tréning'}
                  </div>
                </div>
              </div>

              {showColorPicker && (
                <div 
                  className="absolute z-50 mt-2 bg-white p-4 rounded-2xl shadow-xl border border-neutral-100"
                >
                  <HexColorPicker color={newTypeColor} onChange={setNewTypeColor} />
                  <button
                    type="button"
                    className="w-full mt-4 bg-foreground text-white text-xs py-2.5 rounded-xl font-bold transition-all hover:bg-neutral-800"
                    onClick={() => setShowColorPicker(false)}
                  >
                    Potvrdiť farbu
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 pt-6">
              <h6 className="font-extrabold text-foreground mb-4 text-base">Cenová stratégia</h6>
              
              {(newAudienceType === 'adults' || newAudienceType === 'both') ? (
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200">
                  <div>
                    <label className="font-bold text-sm text-primary-700 mb-2">
                      {newAudienceType === 'adults' ? 'Cena za osobu (€)' : 'Fixná cena (€)'}
                    </label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={fixedPricePerChild}
                      onChange={e => setFixedPricePerChild(e.target.value)}
                      className="rounded-xl border-neutral-200 bg-white py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary max-w-[200px]"
                    />
                    <div className="text-xs text-neutral-500 font-medium mt-2">
                      {newAudienceType === 'adults' 
                        ? 'Jednotná cena pre dospelých.' 
                        : 'Jednotná fixná cena pre všetkých účastníkov.'}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-4 mb-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                    <Form.Check
                      type="radio"
                      label={<span className="font-bold text-sm text-foreground">Fixná cena za dieťa</span>}
                      name="pricingMode"
                      id="modeFixed"
                      checked={pricingMode === 'fixed'}
                      onChange={() => setPricingMode('fixed')}
                      className="m-0"
                    />
                    <Form.Check
                      type="radio"
                      label={<span className="font-bold text-sm text-foreground">Vlastné / stupňované zľavy</span>}
                      name="pricingMode"
                      id="modeTiered"
                      checked={pricingMode === 'tiered'}
                      onChange={() => setPricingMode('tiered')}
                      className="m-0"
                    />
                  </div>

                  <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200">
                    {pricingMode === 'fixed' ? (
                      <div>
                        <label className="font-bold text-sm text-primary-700 mb-2">Cena za 1 dieťa (€)</label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={fixedPricePerChild}
                          onChange={e => setFixedPricePerChild(e.target.value)}
                          className="rounded-xl border-neutral-200 bg-white py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary max-w-[200px]"
                        />
                        <div className="text-xs text-neutral-500 font-medium mt-2">
                          Systém automaticky vypočíta: 2 deti = €{(fixedPricePerChild * 2).toFixed(2)}, 3 deti = €{(fixedPricePerChild * 3).toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                        <div>
                          <label className="font-bold text-sm text-neutral-700 mb-1.5">1 dieťa (€)</label>
                          <Form.Control
                            type="number"
                            value={newTypePrice1}
                            onChange={e => setNewTypePrice1(e.target.value)}
                            className="rounded-xl border-neutral-200 bg-white py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary w-full"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-sm text-neutral-700 mb-1.5">2 deti (€)</label>
                          <Form.Control
                            type="number"
                            value={newTypePrice2}
                            onChange={e => setNewTypePrice2(e.target.value)}
                            className="rounded-xl border-neutral-200 bg-white py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary w-full"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-sm text-neutral-700 mb-1.5">3 deti (€)</label>
                          <Form.Control
                            type="number"
                            value={newTypePrice3}
                            onChange={e => setNewTypePrice3(e.target.value)}
                            className="rounded-xl border-neutral-200 bg-white py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary w-full"
                          />
                        </div>
                        <div className="sm:col-span-3 text-xs text-neutral-500 font-medium mt-1">
                          Nastavte konkrétne ceny pre zľavu súrodencov.
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer className="border-neutral-200 p-6">
            <button 
              type="button" 
              onClick={() => setShowCreateTypeModal(false)}
              className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 transition-all text-sm"
            >
              Zavrieť
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all text-sm shadow-sm"
            >
              Vytvoriť typ
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Type Detail Modal */}
      <Modal
        show={showTypeDetailModal}
        onHide={() => setShowTypeDetailModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-neutral-200">
          <Modal.Title className="font-extrabold text-lg text-foreground">
            {detailType?.name}
            {detailType?.audience_type && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider align-middle ${
                detailType.audience_type === 'children' ? 'bg-blue-100 text-blue-700' :
                detailType.audience_type === 'adults' ? 'bg-emerald-100 text-emerald-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {detailType.audience_type === 'children' ? 'Deti' :
                 detailType.audience_type === 'adults' ? 'Dospelí' : 'Oboje'}
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6">
          {/* Switch */}
          <div className="flex items-center justify-between bg-neutral-50 rounded-2xl border border-neutral-200 px-5 py-4 mb-4">
            <div>
              <div className="font-bold text-sm text-foreground">Viditeľnosť pre používateľov</div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {detailType?.active ? 'Hodina je aktívna a viditeľná' : 'Hodina je skrytá'}
              </div>
            </div>
            <Form.Check
              type="switch"
              id={`detail-active-switch-${detailType?.id}`}
              checked={detailType?.active ?? false}
              onChange={() => {
                toggleTypeStatus(detailType.id, detailType.active);
                setDetailType(prev => ({ ...prev, active: !prev.active }));
              }}
              className="m-0"
            />
          </div>

          {/* Edit + Delete */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowTypeDetailModal(false);
                openEditTypeModal(detailType);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-neutral-200 bg-white hover:bg-primary/5 hover:border-primary/30 text-neutral-700 hover:text-primary font-bold text-sm transition-all"
            >
              <Pencil className="w-4 h-4" />
              Upraviť popis
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTypeDetailModal(false);
                openDeleteTypeModal(detailType);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-100 bg-white hover:bg-red-50 hover:border-red-200 text-neutral-500 hover:text-red-600 font-bold text-sm transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Vymazať
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Edit Training Type Modal */}
      <Modal show={showEditTypeModal} onHide={() => setShowEditTypeModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-neutral-200">
          <Modal.Title className="font-extrabold text-xl text-foreground">
            Upraviť popis: {editingType?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6 space-y-4">
          {/* Link helper */}
          <div>
            <label className="font-bold text-sm text-neutral-700 mb-1.5 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-neutral-400" />
              Link (voliteľný)
            </label>
            <div className="flex gap-2">
              <Form.Control
                type="url"
                value={editTypeLink}
                onChange={e => setEditTypeLink(e.target.value)}
                placeholder="https://..."
                className="rounded-xl border-neutral-200 bg-neutral-50/50 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                type="button"
                onClick={insertLinkIntoEditDesc}
                disabled={!editTypeLink.trim()}
                title="Vložiť link do popisu na pozíciu kurzora"
                className="px-4 py-2 rounded-xl bg-primary text-white font-extrabold text-base hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                #
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 font-medium">
              Klikni do poľa Popis, umiestni kurzor, potom stlač <strong>#</strong> pre vloženie linku.
            </p>
          </div>

          {/* Popis */}
          <div>
            <label className="font-bold text-sm text-neutral-700 mb-1.5">Popis</label>
            <Form.Control
              as="textarea"
              rows={5}
              ref={editTypeDescRef}
              value={editTypeDesc}
              onChange={e => setEditTypeDesc(e.target.value)}
              className="rounded-xl border-neutral-200 bg-neutral-50/50 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="border-neutral-200 p-6">
          <button
            type="button"
            onClick={() => setShowEditTypeModal(false)}
            className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 transition-all text-sm"
          >
            Zrušiť
          </button>
          <button
            type="button"
            onClick={handleSaveEditType}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-all text-sm shadow-sm"
          >
            Uložiť popis
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete Training Type Confirm Modal */}
      <Modal show={showDeleteTypeModal} onHide={() => { setShowDeleteTypeModal(false); setDeleteTypeError(''); }} centered>
        <Modal.Header closeButton className="border-neutral-200">
          <Modal.Title className="font-extrabold text-xl text-foreground text-red-600">
            Vymazať typ tréningu
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6">
          <p className="text-sm text-neutral-700 font-medium mb-2">
            Naozaj chceš vymazať typ <strong>{deletingType?.name}</strong>?
          </p>
          <p className="text-sm text-neutral-500">
            Táto akcia je nevratná. Ak je k tomuto typu priradená existujúca hodina alebo rezervácia, server vráti chybu.
          </p>
          {deleteTypeError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
              {deleteTypeError}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-neutral-200 p-6">
          <button
            type="button"
            onClick={() => { setShowDeleteTypeModal(false); setDeleteTypeError(''); }}
            className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 transition-all text-sm"
          >
            Zrušiť
          </button>
          <button
            type="button"
            onClick={handleDeleteType}
            disabled={deleteTypeLoading}
            className="px-6 py-2.5 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-all text-sm shadow-sm disabled:opacity-50"
          >
            {deleteTypeLoading ? 'Mazanie...' : 'Vymazať'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Service Consent Modal */}
      {showServiceConsentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div 
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-neutral-200"
          >
              <div className="px-6 sm:px-8 py-5 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0">
                <h2 className="text-xl font-extrabold text-foreground m-0">{t?.booking?.serviceConsentTitle || 'Súhlas so začatím poskytovania služby'}</h2>
                <button
                  onClick={closeServiceConsentModal}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 sm:px-8 py-6 text-neutral-600 leading-relaxed text-sm font-medium overflow-y-auto">
                <p>
                  Podľa zákona č. 108/2024 Z.z. o ochrane spotrebiteľa týmto žiadam a udeľujem prevádzkovateľovi Nitráčik, o.z., IČO: 56374453 výslovný súhlas so začatím poskytovania služby pred uplynutím lehoty na odstúpenie od zmluvy a súčasne vyhlasujem, že som bol riadne poučený, že udelením tohto súhlasu strácam ako spotrebiteľ právo na odstúpenie od zmluvy po úplnom poskytnutí služby podľa § 19 ods. 1 písm. a) zákona č. 108/2024 Z.z. o ochrane spotrebiteľa v platnom znení.
                </p>
              </div>

              <div className="border-t border-neutral-100 px-6 sm:px-8 py-5 bg-neutral-50 flex justify-end shrink-0">
                <button
                  onClick={closeServiceConsentModal}
                  className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm shadow-sm hover:bg-primary-600 transition-all"
                >
                  Rozumiem
                </button>
              </div>
          </div>
        </div>
      )}

    </section>
    </div>
  );
};

export default Booking;

