import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import { useTranslation } from '../contexts/LanguageContext';
import { Tooltip } from 'react-tooltip';
import './UserProfile.css';

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
  const [bookingType, setBookingType] = useState(''); // New state for booking type
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'Unknown User';
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminCancelModal, setShowAdminCancelModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [reason, setReason] = useState('');
  const [forceCancel, setForceCancel] = useState(false);

  const showAlert = (message, variant = 'success') => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setTimeout(() => setAlertMessage(''), 5000);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${userId}`, {
          withCredentials: true,
        });
        setIsAdmin(response.data.email === process.env.REACT_APP_ADMIN_EMAIL);
      } catch (error) {
        console.error('Admin check failed:', error);
      }
    };

    const fetchSeasonTickets = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/season-tickets/${userId}`, {
          withCredentials: true,
        });
        setSeasonTickets(response.data);
      } catch (error) {
        console.error('Error fetching season tickets:', error);
      }
    };

    const fetchAdminSeasonTickets = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/admin/season-tickets`, {
          withCredentials: true,
        });
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
        const response = await axios.get(`http://localhost:5000${endpoint}`, {
          withCredentials: true,
        });
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
          participants: [],
        };
      }
      if (session.user_id) {
        grouped[key].participants.push({
          first_name: session.first_name,
          last_name: session.last_name,
          email: session.email,
          children: session.number_of_children || 1,
        });
      }
    });
    return Object.values(grouped);
  };

  const renderSessionTable = (type) => {
    const filtered = processSessions(bookedSessions)
      .filter((session) => session.training_type === type)
      .sort((a, b) => new Date(b.training_date) - new Date(a.training_date));

    if (filtered.length === 0) return null;

    return (
      <div className="mb-5">
        <h4>{t?.profile?.sessionType?.[type.toLowerCase()] || `${type} Sessions`}</h4>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>{t?.profile?.table?.date || 'Date'}</th>
              <th>{t?.profile?.table?.type || 'Type'}</th>
              <th>{t?.profile?.table?.availableSpots || 'Available Spots'}</th>
              <th>{t?.profile?.table?.participants || 'Participants'}</th>
              <th>{t?.profile?.table?.actions || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((session) => {
              const sessionTime = new Date(session.training_date);
              const currentTime = new Date();
              const hoursDifference = (sessionTime - currentTime) / (1000 * 60 * 60);
              const isWithin10Hours = hoursDifference <= 10;
              
              return (
                <tr key={`${session.training_date}-${session.training_type}`} className={isWithin10Hours ? 'table-warning' : ''}>
                  <td>{new Date(session.training_date).toLocaleString()}</td>
                  <td>{session.training_type}</td>
                  <td>{session.available_spots}</td>
                  <td>
                    <div className="participants-container">
                      {session.participants.map((participant, index) => (
                        <div key={`${participant.email}-${index}`} className="participant-badge">
                          <div className="participant-info">
                            <span className="participant-name">
                              {participant.first_name} {participant.last_name}
                            </span>
                            <span className="participant-email">
                              {participant.email}
                            </span>
                          </div>
                          <div className="children-count">
                            {t?.profile?.table?.child?.replace('{count}', participant.children) || `Number of children: ${participant.children}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    {/* Regular cancel button */}
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleAdminCancelSession(session.training_id, session.training_type, session.training_date, false)}
                      className="me-2"
                    >
                      Cancel Session
                    </Button>
                    
                    {/* Force cancel button for sessions within 10 hours */}
                    {isWithin10Hours && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleAdminCancelSession(session.training_id, session.training_type, session.training_date, true)}
                        title="Force cancel within 10 hours"
                      >
                        Force Cancel
                      </Button>
                    )}
                    {isWithin10Hours && (
                      <div className="small text-warning mt-1">
                        {Math.round(hoursDifference)} hours until session
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  };

  // UPDATED: Admin cancellation with timing check
  const handleAdminCancelSession = (id, type, date, useForceCancel = false) => {
    setSelectedSession({ id, type, date });
    setReason('');
    setForceCancel(useForceCancel);
    
    if (useForceCancel) {
      setShowAdminCancelModal(true);
    } else {
      // Check timing for regular cancellation
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

  // UPDATED: Admin cancellation confirmation
  const confirmAdminCancel = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/admin/cancel-session', {
        trainingId: selectedSession.id,
        reason,
        forceCancel
      }, { withCredentials: true });

      showAlert(`Session canceled successfully! ${response.data.canceledBookings} bookings affected.${response.data.forceCancelUsed ? ' (Force Cancel)' : ''}`, 'success');

      // Refresh bookings
      const bookingsResponse = await axios.get('http://localhost:5000/api/admin/bookings', { withCredentials: true });
      setBookedSessions(bookingsResponse.data);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to cancel session';
      
      // Handle 10-hour restriction error
      if (errorMessage.includes('within 10 hours')) {
        if (window.confirm('Session is within 10 hours. Do you want to force cancel?')) {
          setForceCancel(true);
          // Retry with force cancel
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

  // UPDATED: User cancellation with 10-hour check
  const handleCancelSession = async (bookingId, trainingDate) => {
    if (!canCancelSession(trainingDate)) {
      showAlert(t?.profile?.cancel?.alert || 'Cancellation is not allowed within 10 hours of the session.', 'danger');
      return;
    }

    setSelectedBooking({ bookingId, trainingDate });

    // Fetch booking type
    try {
      const response = await axios.get(`http://localhost:5000/api/bookings/${bookingId}/type`, {
        withCredentials: true,
      });
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

    // Fetch replacement sessions
    try {
      const response = await axios.get(`http://localhost:5000/api/replacement-sessions/${bookingId}`, {
        withCredentials: true,
      });
      setReplacementSessions(response.data);
    } catch (error) {
      console.error('Error fetching replacement sessions:', error);
      setReplacementSessions([]);
    }

    setShowCancelModal(true);
  };

  // UPDATED: User cancellation confirmation with proper error handling
  const confirmCancellation = async () => {
    if (!selectedBooking) return;

    try {
      if (cancellationType === 'refund') {
        const response = await axios.delete(
          `http://localhost:5000/api/bookings/${selectedBooking.bookingId}`,
          { withCredentials: true }
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
      } else if (cancellationType === 'replacement' && selectedReplacement) {
        const response = await axios.post(
          `http://localhost:5000/api/replace-booking/${selectedBooking.bookingId}`,
          { newTrainingId: selectedReplacement },
          { withCredentials: true }
        );
        showAlert(t?.profile?.cancel?.replacementSuccess || 'Session successfully replaced.', 'success');
      }

      // Refresh bookings
      const bookingsResponse = await axios.get(`http://localhost:5000/api/bookings/user/${userId}`, {
        withCredentials: true,
      });
      setBookedSessions(bookingsResponse.data);
    } catch (error) {
      console.error('Error processing cancellation:', error);
      
      // Handle 10-hour restriction error
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
      const verifyResponse = await axios.post(
        'http://localhost:5000/api/verify-password',
        { password },
        { withCredentials: true }
      );

      if (verifyResponse.data.success) {
        await axios.delete(`http://localhost:5000/api/users/${userId}`, {
          withCredentials: true,
        });

        localStorage.removeItem('userId');
        localStorage.removeItem('isLoggedIn');
        navigate('/account-deleted');
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
      const response = await axios.post(
        'http://localhost:5000/api/admin/payment-report',
        { startDate, endDate },
        { withCredentials: true, responseType: 'arraybuffer' }
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

  return (
    <div className="container mt-5">
      {alertMessage && (
        <div className={`alert alert-${alertVariant} mt-3`} role="alert">
          {alertMessage}
        </div>
      )}
      <h2 className="text-center text-primary">{t?.profile?.title || 'Account Settings'}</h2>

      {isAdmin && (
        <div className="payment-report mt-4">
          <h4>{t?.profile?.report?.title || 'Generate Payment Report'}</h4>
          <Form onSubmit={handleGenerateReport}>
            <div className="row">
              <div className="col-md-5 mb-3">
                <Form.Label>{t?.profile?.report?.startDate || 'Start Date'}</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-5 mb-3">
                <Form.Label>{t?.profile?.report?.endDate || 'End Date'}</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2 mb-3">
                <Button
                  type="submit"
                  className="btn btn-primary w-100 mt-4"
                  disabled={isButtonDisabled}
                  data-tooltip-id="generate-tooltip"
                  data-tooltip-content={tooltipMessage}
                  data-tooltip-place="top"
                  style={{ cursor: isButtonDisabled ? 'not-allowed' : 'pointer' }}
                >
                  {t?.profile?.report?.generate || 'Generate PDF'}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}

      {isAdmin ? (
        <div className="admin-sessions">
          {renderSessionTable('MIDI')}
          {renderSessionTable('MINI')}
          {renderSessionTable('MAXI')}
          <div className="season-tickets mt-5">
            <h3>{t?.profile?.seasonTickets?.title || 'Season Ticket Holders'}</h3>
            {adminSeasonTickets.length === 0 ? (
              <p>{t?.profile?.seasonTickets?.noTickets || 'No users have purchased season tickets.'}</p>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>{t?.profile?.seasonTickets?.name || 'Name'}</th>
                    <th>{t?.profile?.seasonTickets?.email || 'Email'}</th>
                    <th>{t?.profile?.seasonTickets?.totalEntries || 'Total Entries'}</th>
                    <th>{t?.profile?.seasonTickets?.remainingEntries || 'Remaining Entries'}</th>
                  </tr>
                </thead>
                <tbody>
                  {adminSeasonTickets.map((ticket) => (
                    <tr key={ticket.user_id}>
                      <td>
                        {ticket.first_name} {ticket.last_name}
                      </td>
                      <td>{ticket.email}</td>
                      <td>{ticket.entries_total}</td>
                      <td>{ticket.entries_remaining}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="season-tickets mt-5">
            <h3>{t?.profile?.mySeasonTickets?.title || 'My Season Tickets'}</h3>
            {seasonTickets.length === 0 ? (
              <p>{t?.profile?.mySeasonTickets?.noTickets || 'You have no active season tickets.'}</p>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>{t?.profile?.mySeasonTickets?.ticketId || 'Ticket ID'}</th>
                    <th>{t?.profile?.mySeasonTickets?.entriesTotal || 'Total Entries'}</th>
                    <th>{t?.profile?.mySeasonTickets?.entriesRemaining || 'Remaining Entries'}</th>
                    <th>{t?.profile?.mySeasonTickets?.purchaseDate || 'Purchase Date'}</th>
                    <th>{t?.profile?.mySeasonTickets?.expiryDate || 'Expiry Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>{ticket.id}</td>
                      <td>{ticket.entries_total}</td>
                      <td>{ticket.entries_remaining}</td>
                      <td>{new Date(ticket.purchase_date).toLocaleDateString()}</td>
                      <td>{new Date(ticket.expiry_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          <div className="booked-sessions mt-5">
            <h3>{t?.profile?.bookedSessions?.title || 'Your Booked Sessions'}</h3>
            {bookedSessions.length === 0 ? (
              <p>{t?.profile?.bookedSessions?.noSessions || 'You have no booked sessions.'}</p>
            ) : (
              <ul className="list-group">
                {bookedSessions.map((session) => (
                  <li key={session.booking_id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{session.training_type}</strong> - {new Date(session.training_date).toLocaleString()}
                      {session.credit_id && <span className="badge bg-success ms-2">Credit Booking</span>}
                    </div>
                    <div
                      data-tooltip-id="cancel-tooltip"
                      data-tooltip-content={
                        !canCancelSession(session.training_date)
                          ? t?.profile?.cancel?.tooltip || 'Cancellation is no longer possible as less than 10 hours remain until the training.'
                          : ''
                      }
                    >
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelSession(session.booking_id, session.training_date, session.training_type)}
                        disabled={!canCancelSession(session.training_date)}
                      >
                        {t?.profile?.cancel?.button || 'Cancel Session'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Tooltip id="cancel-tooltip" place="top" effect="solid" />
          </div>
        </>
      )}

      <div className="danger-zone mt-5">
        <h5 className="text-danger">{t?.profile?.dangerZone?.title || 'Danger Zone'}</h5>
        <p className="text-muted">
          {t?.profile?.dangerZone?.description || 'Deleting your account will permanently remove all your data from our system. This action is irreversible.'}
        </p>
        <button
          onClick={handleDeleteAccount}
          className="btn btn-danger"
          disabled={isDeleting}
        >
          {isDeleting ? t?.profile?.dangerZone?.deleting || 'Deleting...' : t?.profile?.dangerZone?.delete || 'Delete My Account'}
        </button>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
      </div>

      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {t?.profile?.deleteModal?.title || 'Confirm Account Deletion'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="password">
              <Form.Label>{t?.profile?.deleteModal?.label || 'Enter your password to confirm deletion:'}</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t?.profile?.deleteModal?.placeholder || 'Password'}
              />
            </Form.Group>
          </Form>
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
          <Modal.Title>{t?.profile?.cancelModal?.title || 'Cancel Session'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>{t?.profile?.cancelModal?.chooseOption || 'Choose cancellation option:'}</h5>

          <Form.Group className="mb-3">
            {bookingType === 'paid' && (
              <Form.Check
                type="radio"
                name="cancellationType"
                id="refundOption"
                label={t?.profile?.cancelModal?.refundOption || 'Cancel session and request refund'}
                checked={cancellationType === 'refund'}
                onChange={() => setCancellationType('refund')}
              />
            )}
            <Form.Check
              type="radio"
              name="cancellationType"
              id="replacementOption"
              label={t?.profile?.cancelModal?.replacementOption || 'Replace with another session'}
              checked={cancellationType === 'replacement'}
              onChange={() => setCancellationType('replacement')}
            />
          </Form.Group>

          {cancellationType === 'replacement' && (
            <Form.Group className="mb-3">
              <Form.Label>{t?.profile?.cancelModal?.selectReplacement || 'Select replacement session:'}</Form.Label>
              <Form.Select
                value={selectedReplacement}
                onChange={(e) => setSelectedReplacement(e.target.value)}
              >
                <option value="">{t?.profile?.cancelModal?.chooseSession || 'Choose a session...'}</option>
                {replacementSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {new Date(session.training_date).toLocaleString()} - {session.training_type}
                    ({session.available_spots} spots available)
                  </option>
                ))}
              </Form.Select>
              {replacementSessions.length === 0 && (
                <Form.Text className="text-muted">
                  {t?.profile?.cancelModal?.noReplacements || 'No available replacement sessions found.'}
                </Form.Text>
              )}
            </Form.Group>
          )}

          {cancellationType === 'refund' && bookingType === 'paid' && (
            <div className="alert alert-info">
              <strong>{t?.profile?.cancelModal?.refundInfo || 'Refund Information:'}</strong>
              <br />
              {t?.profile?.cancelModal?.refundDetails || 'Your refund will be processed automatically and may take 5-10 business days to appear in your account.'}
            </div>
          )}
          {cancellationType === 'refund' && bookingType === 'season_ticket' && (
            <div className="alert alert-warning">
              {t?.profile?.cancelModal?.seasonTicketInfo || 'This booking was made with a season ticket. No refund is applicable; entries will be returned to your season ticket.'}
            </div>
          )}
          {cancellationType === 'refund' && bookingType === 'credit' && (
            <div className="alert alert-success">
              {t?.profile?.cancelModal?.creditInfo || 'This booking was made with a credit. Your credit will be returned to your account for future use.'}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            {t?.profile?.cancelModal?.cancel || 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={confirmCancellation}
            disabled={
              !cancellationType ||
              (cancellationType === 'replacement' && !selectedReplacement)
            }
          >
            {t?.profile?.cancelModal?.confirm || 'Confirm Cancellation'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Admin Cancel Session Modal */}
      <Modal show={showAdminCancelModal} onHide={() => setShowAdminCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {forceCancel ? 'Force Cancel Session' : 'Cancel Session'}
            {forceCancel && <span className="text-warning ms-2">(Within 10 Hours)</span>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {forceCancel ? 'FORCE CANCEL:' : 'Cancel'} {selectedSession?.type} session on {selectedSession?.date ? new Date(selectedSession.date).toLocaleString() : ''}?
            {forceCancel && <div className="alert alert-warning mt-2">This session is within 10 hours. Force cancel will proceed despite timing restrictions.</div>}
          </p>
          <Form.Group controlId="reason">
            <Form.Label>Reason for cancellation:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </Form.Group>
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