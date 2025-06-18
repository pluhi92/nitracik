import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import { useTranslation } from '../contexts/LanguageContext'; // Adjusted path
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
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'Unknown User';
  const [isAdmin, setIsAdmin] = useState(false);

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
    const currentDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD
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
            </tr>
          </thead>
          <tbody>
            {filtered.map((session) => (
              <tr key={`${session.training_date}-${session.training_type}`}>
                <td>{new Date(session.training_date).toLocaleString()}</td>
                <td>{session.training_type}</td>
                <td>{session.available_spots}</td>
                <td>
                  <div className="participants-container">
                    {session.participants.map((participant, index) => (
                      <div key={index} className="participant-badge">
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
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const canCancelSession = (trainingDate) => {
    const now = new Date();
    const sessionTime = new Date(trainingDate);
    const hoursBeforeSession = (sessionTime - now) / (1000 * 60 * 60);
    return hoursBeforeSession > 10;
  };

  const handleCancelSession = async (bookingId, trainingDate) => {
    if (!canCancelSession(trainingDate)) {
      alert(t?.profile?.cancel?.alert || 'Cancellation is allowed only within 10 hours before the session.');
      return;
    }

    if (!window.confirm(t?.profile?.cancel?.confirm || 'Are you sure you want to cancel this session?')) {
      return;
    }

    try {
      console.log(`Attempting to cancel booking with ID: ${bookingId}`);
      const deleteResponse = await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`, {
        withCredentials: true,
      });

      await axios.post(
        'http://localhost:5000/api/send-cancellation-email',
        {
          bookingId,
          userId,
          adminEmail: process.env.REACT_APP_ADMIN_EMAIL,
          trainingDate: deleteResponse.data.trainingDate,
          userName,
        },
        { withCredentials: true }
      );

      const response = await axios.get(`http://localhost:5000/api/bookings/user/${userId}`, {
        withCredentials: true,
      });
      setBookedSessions(response.data);
      alert(t?.profile?.cancel?.success || 'Session was successfully canceled. Emails have been sent to you and the administrator.');
    } catch (error) {
      console.error('Error canceling session:', error);
      const errorMessage = error.response?.status === 404
        ? t?.profile?.cancel?.error?.notFound || 'Booking could not be found. It may have been already deleted or does not exist.'
        : error.response?.status === 403
          ? t?.profile?.cancel?.error?.unauthorized || 'You are not authorized to cancel this booking.'
          : t?.profile?.cancel?.error?.generic || 'Failed to cancel session. Please try again.';
      alert(errorMessage);
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
      alert(t?.profile?.report?.error?.required || 'Please fill in both dates.');
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
      alert(t?.profile?.report?.error?.generic || 'Failed to generate payment report. Check console for details.');
    }
  };

  return (
    <div className="container mt-5">
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
                        onClick={() => handleCancelSession(session.booking_id, session.training_date)}
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
          <Modal.Title>{t?.profile?.deleteModal?.title || 'Confirm Deletion'}</Modal.Title>
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
      <Tooltip id="generate-tooltip" place="top" effect="solid" />
    </div>
  );
};

export default UserProfile;