import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { useTranslation } from '../contexts/LanguageContext';
import { Tooltip } from 'react-tooltip';
import { 
  ClipboardCheck, XCircle, Zap, Trash2, Copy, Check, 
  MapPin, Phone, ShieldAlert, FileText, 
  Ticket, CalendarDays, History, Archive,
  AlertTriangle, ChevronDown, CheckCircle, CreditCard, RefreshCw, ChevronUp, Gift,
  Mail, ExternalLink, Clock, Edit2
} from 'lucide-react';
import api from '../api/api';
import GiftCertificate from './GiftCertificate';

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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkEmailSession, setBulkEmailSession] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [giftCards, setGiftCards] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [selectedGiftCard, setSelectedGiftCard] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [gcInputCode, setGcInputCode] = useState('');
  const [gcLookupLoading, setGcLookupLoading] = useState(false);
  const [gcLookupError, setGcLookupError] = useState('');
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [capacitySession, setCapacitySession] = useState(null);
  const [newCapacity, setNewCapacity] = useState('');
  const [isUpdatingCapacity, setIsUpdatingCapacity] = useState(false);

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

  const handleGiftCardLookup = async () => {
    if (!gcInputCode.trim()) return;
    setGcLookupLoading(true);
    setGcLookupError('');
    try {
      const response = await api.post('/api/gift-cards/save', {
        code: gcInputCode.trim(),
      });
      const gc = response.data;

      if (gc.alreadySaved) {
        // Poukaz už bol pridaný — len aktualizuj dáta
        setGiftCards(prev =>
          prev.some(g => g.code === gc.code)
            ? prev.map(g => g.code === gc.code ? gc : g)
            : [gc, ...prev]
        );
        setGcInputCode('');
        return;
      }

      // Nový poukaz — pridaj na začiatok zoznamu
      setGiftCards(prev => [gc, ...prev.filter(g => g.code !== gc.code)]);
      setGcInputCode('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Poukaz sa nepodarilo nájsť.';
      setGcLookupError(msg);
    } finally {
      setGcLookupLoading(false);
    }
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleUpdateCapacity = async () => {
    if (!capacitySession?.training_id) return;
    setIsUpdatingCapacity(true);
    try {
      const response = await api.put(
        `/api/admin/training-sessions/${capacitySession.training_id}/capacity`,
        { newCapacity: Number(newCapacity) }
      );
      showAlert(
        response.data?.message || 'Kapacita bola úspešne aktualizovaná.',
        'success'
      );
      await refreshBookings();
      setShowCapacityModal(false);
      setCapacitySession(null);
      setNewCapacity('');
    } catch (err) {
      showAlert(
        err.response?.data?.error || 'Nepodarilo sa aktualizovať kapacitu.',
        'danger'
      );
    } finally {
      setIsUpdatingCapacity(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Načíta uložené darčekové poukazy pri otvorení profilu
  useEffect(() => {
    if (!userId) return;
    const fetchSavedGiftCards = async () => {
      try {
        const res = await api.get(`/api/gift-cards/user/${userId}`);
        setGiftCards(res.data || []);
      } catch (err) {
        // Non-fatal — gift cards sekcia bude prázdna
        console.warn('[UserProfile] Could not load saved gift cards:', err.message);
      }
    };
    fetchSavedGiftCards();
  }, [userId]);

  // ESC key zatvorí modál náhľadu darčekového poukazu
  useEffect(() => {
    if (!selectedGiftCard) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedGiftCard(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedGiftCard]);

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
          adults: isAdultParticipant ? (Number(session.number_of_adults) || 1) : 0,
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
      <div className="bg-white rounded-[2rem] shadow-md border-2 border-neutral-300 mb-8 overflow-hidden relative">
        <FlakPink className="absolute pointer-events-none z-0" style={{ width: 195, top: -40, right: '30%', opacity: 0.38, transform: 'rotate(20deg)' }} />
        <FlakCream className="absolute pointer-events-none z-0" style={{ width: 175, bottom: -35, left: -25, opacity: 0.35, transform: 'rotate(-15deg)' }} />
        <div className="relative z-10">
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
                      <div
                        className={`flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-colors ${!isCancelled ? 'hover:bg-neutral-100 group cursor-pointer' : 'cursor-not-allowed'}`}
                        onClick={() => {
                          if (isCancelled) return;
                          setCapacitySession(session);
                          setNewCapacity(session.max_participants);
                          setShowCapacityModal(true);
                        }}
                        title={!isCancelled ? 'Upraviť kapacitu' : 'Zrušený tréning'}
                      >
                        <span className={`font-black text-lg leading-none ${session.available_spots === 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {session.available_spots}
                        </span>
                        <span className="text-xs font-medium text-neutral-400 leading-none">
                          z {session.max_participants}
                        </span>
                        {!isCancelled && (
                          <Edit2 className="w-3.5 h-3.5 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500" />
                        )}
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
                                      : participant.booking_type === 'paid' && participant.active === false
                                        ? 'Zrušené'
                                        : participant.booking_type === 'paid' && (!participant.amount_paid || participant.amount_paid === 0)
                                          ? 'Čaká na platbu'
                                          : 'Zaplatené'}
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

  const capacityBookedSpots = capacitySession
    ? capacitySession.participants
        .filter(p => p.active === true)
        .reduce((sum, p) => sum + (p.children || 0) + (p.adults || 0), 0)
    : 0;

  return (
    <div className="relative w-full bg-white">
    <section className="section-wrapper container-custom max-w-7xl mx-auto px-4 sm:px-6 relative space-y-8">
      {/* Alert Banner */}
        {alertMessage && (
          <div 
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
          </div>
        )}

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
            <div className="bg-white rounded-[2rem] border-2 border-neutral-300 p-12 text-center shadow-md overflow-hidden relative">
              <CalendarDays className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 font-bold">
                Žiadne tréningy na zobrazenie.
              </p>
            </div>
          )}

          {/* Administrátorské Permanentky */}
          <div className="bg-white rounded-[2rem] shadow-md p-8 border-2 border-neutral-300 overflow-hidden relative">
            <FlakCream className="absolute pointer-events-none z-0" style={{ width: 185, top: -38, left: -26, opacity: 0.36, transform: 'rotate(-25deg)' }} />
            <FlakPink className="absolute pointer-events-none z-0" style={{ width: 170, bottom: -30, right: '35%', opacity: 0.32, transform: 'rotate(45deg)' }} />
            <div className="relative z-10">
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
          </div>



          {/* TLAČIDLO ARCHÍV (Admin) */}
          <div className="bg-white rounded-[2rem] shadow-md p-8 border-2 border-neutral-300 overflow-hidden relative">
            <FlakPink className="absolute pointer-events-none z-0" style={{ width: 195, top: -42, right: '20%', opacity: 0.35, transform: 'rotate(-10deg)' }} />
            <FlakCream className="absolute pointer-events-none z-0" style={{ width: 175, bottom: -35, left: -24, opacity: 0.32, transform: 'rotate(30deg)' }} />
            <div className="relative z-10">
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
        </div>
      ) : (
        // ================== USER ČASŤ (Nový dizajn) ==================
        <>
          <div className="bg-white rounded-[2rem] shadow-md p-8 border-2 border-neutral-300 mb-8 overflow-hidden relative">
            <FlakCream className="absolute pointer-events-none z-0" style={{ width: 190, top: -40, right: -28, opacity: 0.35, transform: 'rotate(15deg)' }} />
            <FlakPink className="absolute pointer-events-none z-0" style={{ width: 175, bottom: -35, left: '40%', opacity: 0.32, transform: 'rotate(-35deg)' }} />
            <div className="relative z-10">
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
              <>
                {/* Mobile: stacked cards */}
                <div className="md:hidden space-y-3 mb-4">
                  {activeTickets.map((ticket, index) => (
                    <div
                      key={`${ticket.id || 'ticket'}-${ticket.purchase_date || ''}-${index}`}
                      className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Typ</span>
                        <span className="font-bold text-foreground text-sm text-right">
                          {ticket.product_name || ticket.product_code || ticket.training_type_name || ticket.training_type || '-'}
                        </span>
                      </div>
                      {ticket.training_types && ticket.training_types.length > 0 && (
                        <div className="text-xs font-medium text-neutral-400 text-right">
                          {ticket.training_types.map((type) => type.name).join(', ')}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Vstupy</span>
                        <span className="font-bold text-neutral-500 text-sm">{ticket.entries_total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Zostatok</span>
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 py-1 px-3 rounded-full text-xs font-bold">
                          {ticket.entries_remaining}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Kúpené</span>
                        <span className="text-sm font-medium text-neutral-500">{formatSlovakDate(ticket.purchase_date).split(' - ')[0]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Platnosť do</span>
                        <span className="text-sm font-medium text-neutral-500">{formatSlovakDate(ticket.expiry_date).split(' - ')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-200 shadow-sm mb-4">
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
              </>
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

                  {showHistory && (
                    <div 
                      className="overflow-hidden"
                    >
                      {/* Mobile: stacked cards */}
                      <div className="md:hidden space-y-3">
                        {historyTickets.map((ticket, index) => (
                          <div
                            key={`${ticket.id || 'ticket'}-${ticket.purchase_date || ''}-${index}`}
                            className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2.5 opacity-75"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Typ</span>
                              <span className="font-bold text-neutral-600 text-sm text-right">
                                {ticket.product_name || ticket.product_code || ticket.training_type_name || ticket.training_type || '-'}
                              </span>
                            </div>
                            {ticket.training_types && ticket.training_types.length > 0 && (
                              <div className="text-xs font-medium text-neutral-400 text-right">
                                {ticket.training_types.map((type) => type.name).join(', ')}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Status</span>
                              {ticket.entries_remaining === 0 ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                                  Vyčerpaná
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                                  Expirovaná
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Dátum nákupu</span>
                              <span className="text-sm font-medium text-neutral-500">{formatSlovakDate(ticket.purchase_date).split(' - ')[0]}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop: table */}
                      <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-200">
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
                    </div>
                  )}
              </div>
            )}
            </div>
          </div>

          {/* ── DARČEKOVÉ POUKAZY ── */}
          <div className="bg-white rounded-[2rem] shadow-md p-8 border-2 border-neutral-300 mb-8 overflow-hidden relative">
            <FlakPink className="absolute pointer-events-none z-0" style={{ width: 200, top: -44, left: '25%', opacity: 0.38, transform: 'rotate(30deg)' }} />
            <FlakCream className="absolute pointer-events-none z-0" style={{ width: 180, top: '50%', right: -24, opacity: 0.32, transform: 'rotate(-20deg)' }} />
            <div className="relative z-10">
            
            {/* Header */}
            <h3 className="text-2xl font-extrabold text-foreground mb-2 flex items-center gap-3">
              <Gift className="w-6 h-6 text-amber-500" />
              Darčekové poukazy
            </h3>
            <p className="text-sm font-medium text-neutral-500 mb-6">
              Máte darčekový poukaz na Nitráčik? Zadajte jeho kód a sledujte zostatok
              a platnosť priamo tu vo svojom profile.
            </p>

            {/* Input row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-2">
              <input
                type="text"
                value={gcInputCode}
                onChange={(e) => {
                  setGcInputCode(e.target.value.toUpperCase());
                  setGcLookupError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleGiftCardLookup()}
                placeholder="Zadajte kód poukazu"
                className="w-full sm:flex-1 rounded-2xl border-2 border-neutral-200 px-4 py-3 text-sm font-mono font-bold text-foreground placeholder-neutral-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all tracking-widest uppercase"
              />
              <button
                onClick={handleGiftCardLookup}
                disabled={gcLookupLoading || !gcInputCode.trim()}
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl px-5 py-3 transition-colors flex items-center justify-center gap-2"
              >
                {gcLookupLoading
                  ? <SpinnerIcon className="w-4 h-4 text-white" />
                  : <Gift className="w-4 h-4" />
                }
                {gcLookupLoading ? 'Hľadám...' : 'Pridať'}
              </button>
            </div>

            {/* Error message */}
            {gcLookupError && (
              <p className="text-sm font-bold text-red-500 mb-4 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {gcLookupError}
              </p>
            )}

            {/* Gift card list */}
            {giftCards.length > 0 && (
              <>
                {/* Mobile: stacked cards */}
                <div className="md:hidden space-y-3 mt-6">
                  {giftCards.map((gc, index) => {
                    const used = (parseFloat(gc.amount) - parseFloat(gc.balance)).toFixed(2);
                    const isValid = gc.status === 'active';
                    return (
                      <div
                        key={gc.id || index}
                        className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Hodnota</span>
                          <span className="font-bold text-foreground text-sm">{parseFloat(gc.amount).toFixed(2)} €</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Využité</span>
                          <span className="text-neutral-600 text-sm">{used} €</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Zostatok</span>
                          <span className="font-black text-amber-700 text-sm">{parseFloat(gc.balance).toFixed(2)} €</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Platné</span>
                          <span className="text-neutral-600 text-xs">
                            {new Date(gc.expiresAt).toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Aktívny</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isValid ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                            {isValid ? 'Aktívny' : (gc.status || 'Neaktívny')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                          <button
                            onClick={() => handleCopyCode(gc.code)}
                            className="group flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-neutral-600 active:text-amber-600 transition-colors"
                          >
                            {copiedCode === gc.code ? (
                              <><Check className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600 text-[11px]">Skopírované!</span></>
                            ) : (
                              <><Copy className="w-3.5 h-3.5 text-neutral-400" />{gc.code}</>
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedGiftCard(gc)}
                            className="text-neutral-400 active:text-amber-500 transition-colors p-1"
                            title="Zobraziť náhľad poukazu"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block mt-6 overflow-x-auto rounded-2xl border border-neutral-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-500 font-semibold text-xs uppercase tracking-wider">
                        <th className="text-left py-3 px-4 whitespace-nowrap">Hodnota</th>
                        <th className="text-left py-3 px-4 whitespace-nowrap">Využité</th>
                        <th className="text-left py-3 px-4 whitespace-nowrap">Zostatok</th>
                        <th className="text-left py-3 px-4 whitespace-nowrap">Platné</th>
                        <th className="text-left py-3 px-4 whitespace-nowrap">Aktívny</th>
                        <th className="text-left py-3 px-4 whitespace-nowrap">Kód</th>
                        <th className="text-center py-3 px-4 whitespace-nowrap w-10">#</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {giftCards.map((gc, index) => {
                        const used = (parseFloat(gc.amount) - parseFloat(gc.balance)).toFixed(2);
                        const isValid = gc.status === 'active';
                        return (
                          <tr
                            key={gc.id || index}
                            className="hover:bg-neutral-50/50 transition-colors"
                          >
                            <td className="py-3 px-4 font-bold text-foreground whitespace-nowrap">
                              {parseFloat(gc.amount).toFixed(2)} €
                            </td>
                            <td className="py-3 px-4 text-neutral-600 whitespace-nowrap">
                              {used} €
                            </td>
                            <td className="py-3 px-4 font-black text-amber-700 whitespace-nowrap">
                              {parseFloat(gc.balance).toFixed(2)} €
                            </td>
                            <td className="py-3 px-4 text-neutral-600 whitespace-nowrap text-xs">
                              {new Date(gc.expiresAt).toLocaleDateString('sk-SK', {
                                day: '2-digit', month: '2-digit', year: 'numeric'
                              })}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isValid ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                {isValid ? 'Aktívny' : (gc.status || 'Neaktívny')}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleCopyCode(gc.code)}
                                className="group flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-neutral-600 hover:text-amber-600 transition-colors cursor-pointer"
                                title="Kliknutím skopírujete kód"
                              >
                                {copiedCode === gc.code ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-green-600">Skopírované!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500 transition-colors" />
                                    {gc.code}
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedGiftCard(gc)}
                                className="text-neutral-400 hover:text-amber-500 transition-colors p-1"
                                title="Zobraziť náhľad poukazu"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Empty state — shown only when no cards added yet */}
            {giftCards.length === 0 && (
              <div className="text-center py-8 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 mt-4">
                <Gift className="w-9 h-9 text-neutral-300 mx-auto mb-2" />
                <p className="text-neutral-400 font-medium text-sm">
                  Zatiaľ ste nepridali žiadny darčekový poukaz.
                </p>
              </div>
            )}
            </div>
          </div>

          {/* GIFT CARD DETAIL MODAL */}
          {selectedGiftCard && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedGiftCard(null)}
            >
              <div
                className="w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex justify-end">
                  <button
                    onClick={() => setSelectedGiftCard(null)}
                    className="text-white/80 hover:text-white text-sm font-medium"
                  >
                    ✕ Zavrieť
                  </button>
                </div>
                <GiftCertificate
                  mode="full"
                  code={selectedGiftCard.code}
                  amount={selectedGiftCard.amount}
                  recipientName={selectedGiftCard.recipientName || ''}
                  buyerEmail={selectedGiftCard.buyerName || ''}
                  message=""
                  expiresAt={selectedGiftCard.expiresAt}
                  previewClassName="max-w-[760px]"
                />
                <div className="mt-3 text-center text-xs text-white/60">
                  Zostatok: <strong className="text-white">{selectedGiftCard.balance}€</strong>
                  {' '}· Status: <strong className="text-white">{selectedGiftCard.status}</strong>
                </div>
              </div>
            </div>
          )}

          {/* VAŠE REZERVOVANÉ RELÁCIE */}
          <div className="bg-white rounded-[2rem] shadow-md p-8 border-2 border-neutral-300 mb-8 overflow-hidden relative">
            <FlakCream className="absolute pointer-events-none z-0" style={{ width: 200, top: -42, left: '35%', opacity: 0.35, transform: 'rotate(-30deg)' }} />
            <FlakPink className="absolute pointer-events-none z-0" style={{ width: 170, top: '45%', right: -22, opacity: 0.32, transform: 'rotate(25deg)' }} />
            <div className="relative z-10">
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
                      return { type: 'credit', label: t?.profile?.bookingMethods?.credit || 'Kredit', icon: <CreditCard className="w-3.5 h-3.5"/>, badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', borderColor: 'border-blue-500' };
                    }
                    if (session.booking_type === 'season_ticket') {
                      return { type: 'season_ticket', label: t?.profile?.bookingMethods?.season_ticket || 'Permanentka', icon: <Ticket className="w-3.5 h-3.5"/>, badgeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200', borderColor: 'border-yellow-500' };
                    }
                    if (session.booking_type === 'gift_card') {
                      return { type: 'gift_card', label: '🎁 Zaplatená', icon: null, badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', borderColor: 'border-amber-500' };
                    }
                    if (session.booking_type === 'paid' && session.amount_paid && session.amount_paid > 0) {
                      return { type: 'paid', label: t?.profile?.bookingMethods?.paid || 'Zaplatená', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', borderColor: 'border-emerald-500' };
                    }
                    if (session.booking_type === 'paid' && (!session.amount_paid || session.amount_paid === 0)) {
                      return { type: 'pending', label: t?.profile?.bookingMethods?.pending || 'Čaká sa na platbu', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200', borderColor: 'border-orange-500' };
                    }
                    return { type: 'unknown', label: t?.profile?.bookingMethods?.reservation || 'Rezervácia', badgeClass: 'bg-neutral-100 text-neutral-600 border-neutral-200', borderColor: 'border-neutral-400' };
                  };

                  const bookingTypeInfo = getBookingTypeInfo();

                  return (
                    <div
                      key={`${session.booking_id || 'booking'}-${session.training_date || ''}-${index}`}
                      className={`rounded-2xl shadow-sm overflow-hidden border-2 ${isCancelled
                        ? 'bg-neutral-50 border-neutral-300'
                        : 'bg-white hover:shadow-md transition-shadow border-neutral-300'
                        }`}
                    >
                      {/* Horný farebný pásik */}
                      <div className={`border-t-4 ${isCancelled ? 'border-neutral-300' : bookingTypeInfo.borderColor}`}></div>

                      {/* Hlavný obsah karty – 3 stĺpce na desktope, stĺpec na mobile */}
                      <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">

                        {/* ĽAVÝ STĹPEC: Názov tréningu + dátum + čas */}
                        <div className={`flex flex-col items-center md:items-start text-center md:text-left md:flex-1 ${isCancelled ? 'text-neutral-400' : ''}`}>
                          <strong className={`text-xl md:text-2xl font-black uppercase ${isCancelled ? 'text-neutral-400' : 'text-foreground'}`}>
                            {session.training_type}
                          </strong>
                          <div className="mt-2 space-y-1">
                            <div className={`flex items-center gap-1.5 justify-center md:justify-start text-sm font-medium ${isCancelled ? 'text-neutral-400' : 'text-neutral-600'}`}>
                              <CalendarDays className="w-4 h-4 flex-shrink-0" />
                              <span>{formatSlovakDate(session.training_date).split(' - ')[0]}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 justify-center md:justify-start text-sm font-medium ${isCancelled ? 'text-neutral-400' : 'text-neutral-500'}`}>
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>{formatSlovakDate(session.training_date).split(' - ')[1] || ''}</span>
                            </div>
                          </div>
                          {isCancelled && (
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 mt-2">
                              <XCircle className="w-3 h-3 mr-1" /> {t?.profile?.cancelled || 'ZRUŠENÉ'}
                            </div>
                          )}
                        </div>

                        {/* STREDNÝ STĹPEC: Typ platby + Téma */}
                        <div className={`flex flex-col items-center md:items-start gap-2 md:flex-1 ${isCancelled ? 'opacity-60' : ''}`}>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${isCancelled ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : bookingTypeInfo.badgeClass}`}>
                            {bookingTypeInfo.icon} {bookingTypeInfo.label}
                          </span>
                          {session.theme && (
                            <div className="inline-flex items-center px-3 py-1.5 bg-neutral-100 rounded-lg">
                              <span className={`font-bold text-xs uppercase tracking-wider ${isCancelled ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                Téma: {session.theme}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* PRAVÝ STĹPEC: Tlačidlá akcií */}
                        <div className="flex flex-col md:items-end gap-2 md:flex-shrink-0">
                          <button
                            onClick={() => { setSelectedSessionDetail(session); setShowDetailModal(true); }}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 md:py-3 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-foreground font-bold text-xs md:text-sm rounded-xl transition-all border border-neutral-300 hover:border-neutral-400 w-full md:w-auto"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Podrobnosti rezervácie
                          </button>

                          <div
                            data-tooltip-id="cancel-tooltip"
                            data-tooltip-content={
                              isCancelled
                                ? 'Táto relácia bola zrušená administrátorom. Skontrolujte svoj email pre informácie o vrátení platby/kreditu.'
                                : !canCancel
                                  ? t?.profile?.cancel?.tooltip || 'Zrušenie už nie je možné, do relácie zostáva menej ako 10 hodín.'
                                  : ''
                            }
                            className="w-full md:w-auto"
                          >
                            <button
                              className={`w-full px-4 py-2.5 md:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap text-xs md:text-sm ${isCancelled || !canCancel
                                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                                : 'bg-white text-red-600 border-2 border-red-500 hover:bg-red-50 active:bg-red-100'
                                }`}
                              onClick={() => handleCancelSession(session.booking_id, session.training_date, session.training_type)}
                              disabled={isCancelled || !canCancel}
                            >
                              <XCircle className="w-4 h-4" />
                              {isCancelled ? t?.profile?.cancelled || 'Zrušené' : t?.profile?.cancel?.button || 'Zrušiť hodinu'}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Tooltip id="cancel-tooltip" place="top" effect="solid" className="rounded-lg !bg-neutral-800 !text-white font-medium text-xs px-3 py-2 shadow-xl" />
            </div>
          </div>

          {/* PROFILOVÉ INFORMÁCIE (Smart Adresa) */}
          <div className="bg-white rounded-[2rem] shadow-md p-8 border-2 border-neutral-300 mb-8 overflow-hidden relative">
            <FlakPink className="absolute pointer-events-none z-0" style={{ width: 185, top: -38, left: -28, opacity: 0.36, transform: 'rotate(-20deg)' }} />
            <FlakCream className="absolute pointer-events-none z-0" style={{ width: 165, bottom: -32, right: '25%', opacity: 0.32, transform: 'rotate(40deg)' }} />
            <div className="relative z-10">
            <h3 className="text-2xl font-extrabold text-foreground mb-6 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-primary" />
              {t?.profile?.info?.title || 'Profilové informácie'}
            </h3>

              {updateMessage && (
                <div 
                  className={`rounded-xl p-4 mb-6 border font-medium text-sm flex items-start gap-3 ${updateVariant === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {updateVariant === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                  <span className="mt-0.5">{updateMessage}</span>
                </div>
              )}

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
          </div>

          {/* ARCHÍV TLAČIDLO (User) */}
          <div className="bg-white rounded-[2rem] shadow-md p-8 border-2 border-neutral-300 mb-8 overflow-hidden relative">
            <FlakCream className="absolute pointer-events-none z-0" style={{ width: 190, top: -40, right: -26, opacity: 0.35, transform: 'rotate(-40deg)' }} />
            <FlakPink className="absolute pointer-events-none z-0" style={{ width: 165, top: '40%', left: -22, opacity: 0.32, transform: 'rotate(15deg)' }} />
            <div className="relative z-10">
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
          </div>
        </>
      )}

      {/* --- GENERATE PAYMENT REPORT (Admin) --- */}
      {isAdmin && (
        <div className="bg-white rounded-[2rem] shadow-md p-8 border-2 border-neutral-300 overflow-hidden relative">
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
        <div className="bg-white rounded-[2rem] shadow-md p-8 border-2 border-neutral-300 overflow-hidden relative">
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
              <div 
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
              </div>
            )}

            {/* ========== INFO BOXES ========== */}
            <>
              {cancellationType === 'refund' && bookingType === 'paid' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4 flex items-start gap-3">
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
                </div>
              )}

              {cancellationType === 'credit' && bookingType === 'paid' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4 flex items-start gap-3">
                  <div className="text-emerald-600 mt-0.5">✅</div>
                  <div>
                    <strong className="text-emerald-900 block mb-1 text-sm">{t?.profile?.cancelModal?.creditInfo || 'Informácie o kredite:'}</strong>
                    <p className="text-emerald-700 text-sm font-medium">
                      {t?.profile?.cancelModal?.creditDetails || 'Kredit bude okamžite pripísaný na váš účet so všetkými pôvodnými podmienkami rezervácie. Použiť ho môžete na akúkoľvek budúcu hodinu.'}
                    </p>
                  </div>
                </div>
              )}

              {cancellationType === 'return' && bookingType === 'season_ticket' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4 flex items-start gap-3">
                  <div className="text-yellow-600 mt-0.5">🎫</div>
                  <div>
                    <strong className="text-yellow-900 block mb-1 text-sm">{t?.profile?.cancelModal?.ticketReturnInfo || 'Informácie o permanentke:'}</strong>
                    <p className="text-yellow-700 text-sm font-medium">
                      {t?.profile?.cancelModal?.ticketReturnDetails || 'Vstup bude okamžite vrátený na vašu permanentku a môžete ho použiť na inú hodinu.'}
                    </p>
                  </div>
                </div>
              )}

              {cancellationType === 'return' && bookingType === 'credit' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4 flex items-start gap-3">
                  <div className="text-emerald-600 mt-0.5">💳</div>
                  <div>
                    <strong className="text-emerald-900 block mb-1 text-sm">{t?.profile?.cancelModal?.creditReturnInfo || 'Informácie o kredite:'}</strong>
                    <p className="text-emerald-700 text-sm font-medium">
                      {t?.profile?.cancelModal?.creditReturnDetails || 'Kredit bude okamžite vrátený na váš účet a môžete ho použiť na inú hodinu.'}
                    </p>
                  </div>
                </div>
              )}
            </>
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

      {/* Upraviť Kapacitu Modal */}
      <Modal show={showCapacityModal} onHide={() => setShowCapacityModal(false)} centered>
        <div className="bg-white rounded-[2rem] shadow-2xl border-0 overflow-hidden">
          <Modal.Header closeButton className="border-b border-neutral-100 p-6 pb-4">
            <Modal.Title className="text-xl font-black text-foreground flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Upraviť kapacitu tréningu
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-6">
            {capacitySession && (
              <div className="space-y-4">
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium text-neutral-700 space-y-2">
                  <p className="font-black text-foreground uppercase">{capacitySession.training_type}</p>
                  <p className="text-neutral-500">{formatSlovakDate(capacitySession.training_date)}</p>
                  <p>
                    Aktuálne prihlásených:{' '}
                    <strong className="text-foreground">{capacityBookedSpots}</strong>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Nová maximálna kapacita
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-medium text-foreground"
                  />
                  {Number(newCapacity) < capacityBookedSpots && (
                    <p className="text-xs font-bold text-red-500 mt-2">
                      Nová kapacita nemôže byť menšia ako počet už prihlásených ({capacityBookedSpots}).
                    </p>
                  )}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-t border-neutral-100 p-6 pt-4 flex gap-3">
            <button
              className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors flex-1"
              onClick={() => setShowCapacityModal(false)}
            >
              Zrušiť
            </button>
            <button
              disabled={isUpdatingCapacity || !Number.isFinite(Number(newCapacity)) || Number(newCapacity) < 1 || Number(newCapacity) < capacityBookedSpots}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-600 transition-all hover:shadow-md disabled:bg-neutral-300 disabled:shadow-none flex-1 flex items-center justify-center gap-2"
              onClick={handleUpdateCapacity}
            >
              {isUpdatingCapacity
                ? <SpinnerIcon className="w-4 h-4 text-white" />
                : <CheckCircle className="w-4 h-4" />
              }
              {isUpdatingCapacity ? 'Ukladám...' : 'Uložiť kapacitu'}
            </button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Detail Rezervácie Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <div className="bg-white rounded-[2rem] shadow-2xl border-0 overflow-hidden">
          <Modal.Header closeButton className="border-b border-neutral-100 p-5 pb-3">
            <Modal.Title className="text-lg font-black text-foreground">
              Podrobnosti rezervácie
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-5 md:p-6">
            {selectedSessionDetail && (
              <div className="divide-y divide-neutral-100">
                {/* Typ tréningu */}
                <div className="flex flex-col items-center gap-1.5 py-1.5">
                  <span className="text-lg font-black uppercase text-foreground">
                    {selectedSessionDetail.training_type}
                  </span>
                  {selectedSessionDetail.cancelled && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-100">
                      <XCircle className="w-3 h-3 mr-1" /> Zrušené
                    </span>
                  )}
                </div>

                <div className="py-1.5">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Dátum a čas</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {formatSlovakDate(selectedSessionDetail.training_date)}
                  </p>
                </div>

                {selectedSessionDetail.theme && (
                  <div className="py-1.5">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Téma</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedSessionDetail.theme}</p>
                  </div>
                )}

                <div className="py-1.5">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Miesto konania</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">Štefánikova trieda 148, 949 01 Nitra</p>
                  <a
                    href="https://maps.google.com/?q=Štefánikova+trieda+148+Nitra"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Otvoriť v Google Maps
                  </a>
                </div>

                <div className="py-1.5">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Dátum vytvorenia rezervácie</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedSessionDetail.booked_at
                      ? formatSlovakDate(selectedSessionDetail.booked_at)
                      : '—'}
                  </p>
                </div>

                <div className="py-1.5">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Spôsob platby</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {(() => {
                      if (selectedSessionDetail.booking_type === 'credit') return <span className="text-blue-700">Kredit</span>;
                      if (selectedSessionDetail.booking_type === 'season_ticket') return <span className="text-yellow-700">Permanentka</span>;
                      if (selectedSessionDetail.booking_type === 'gift_card') return <span className="text-amber-700">🎁 Darčekový poukaz</span>;
                      if (selectedSessionDetail.booking_type === 'paid' && selectedSessionDetail.amount_paid && selectedSessionDetail.amount_paid > 0) return <span className="text-emerald-700">Zaplatená</span>;
                      if (selectedSessionDetail.booking_type === 'paid' && (!selectedSessionDetail.amount_paid || selectedSessionDetail.amount_paid === 0)) return <span className="text-orange-700">Čaká na platbu</span>;
                      return <span className="text-neutral-600">Rezervácia</span>;
                    })()}
                  </p>
                </div>

                <div className="py-1.5">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Zaplatená suma</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedSessionDetail.amount_paid && selectedSessionDetail.amount_paid > 0
                      ? `€${parseFloat(selectedSessionDetail.amount_paid).toFixed(2)}`
                      : '—'}
                  </p>
                </div>

                <div className="py-1.5">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Typ tréningu</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedSessionDetail.age_group === 'adult' ? 'Dospelý' : 'Detský'}
                  </p>
                </div>

                <div className="py-1.5">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    {selectedSessionDetail.age_group === 'adult' ? 'Počet dospelých' : 'Počet detí'}
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedSessionDetail.age_group === 'adult'
                      ? (selectedSessionDetail.number_of_adults || 1)
                      : (selectedSessionDetail.number_of_children || 0)}
                  </p>
                </div>

                <div className="py-1.5">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Sprevádzajúca osoba</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedSessionDetail.accompanying_person ? '✅ Áno' : '❌ Nie'}
                  </p>
                </div>

                {selectedSessionDetail.children_ages && (
                  <div className="py-1.5">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Vek detí</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedSessionDetail.children_ages}</p>
                  </div>
                )}

                <div className="py-1.5">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Foto súhlas</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedSessionDetail.photo_consent ? '✅ Udelený' : '❌ Neudelený'}
                  </p>
                </div>

                {selectedSessionDetail.mobile && (
                  <div className="py-1.5">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Telefón</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedSessionDetail.mobile}</p>
                  </div>
                )}

                {(selectedSessionDetail.note && selectedSessionDetail.note.trim()) && (
                  <div className="py-1.5">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">📝 Poznámka</span>
                    <p className="text-sm font-medium text-neutral-700 mt-0.5 whitespace-pre-wrap">
                      {selectedSessionDetail.note}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-t border-neutral-100 p-4 pt-3">
            <button
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-600 transition-all hover:shadow-md w-full text-sm"
              onClick={() => setShowDetailModal(false)}
            >
              Zavrieť
            </button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Moderný React Tooltip global */}
      <Tooltip id="generate-tooltip" place="top" effect="solid" className="rounded-lg !bg-neutral-800 !text-white font-medium text-xs px-3 py-2 shadow-xl" />
      
      {/* Scroll to Top */}
        {showScrollButton && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-elevated border border-neutral-200 text-foreground transition-all hover:bg-neutral-50 hover:-translate-y-1"
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-6 w-6" />
          </button>
        )}
    </section>
    </div>
  );
};

export default UserProfile;