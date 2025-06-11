import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import { Tooltip } from 'react-tooltip';
import './UserProfile.css';

const UserProfile = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [bookedSessions, setBookedSessions] = useState({ sessions: [], participants: [] });
  const [seasonTickets, setSeasonTickets] = useState([]);
  const [adminSeasonTickets, setAdminSeasonTickets] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'Unknown User'; // Assuming name is stored after login
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin check and fetch data
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

  // Fetch bookings data
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const endpoint = isAdmin ? '/api/admin/bookings' : `/api/bookings/user/${userId}`;
        const response = await axios.get(`http://localhost:5000${endpoint}`, {
          withCredentials: true,
        });
        if (isAdmin) {
          setBookedSessions(response.data);
        } else {
          setBookedSessions({ sessions: response.data, participants: [] });
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    if (userId) fetchBookings();
  }, [userId, isAdmin]);

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
        <h4>{type} Sessions</h4>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Available Spots</th>
              <th>Participants (Children)</th>
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
                          {participant.children} child{participant.children !== 1 ? 'ren' : ''}
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
      alert('Cancellation is only allowed up to 10 hours before the session.');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this session?')) {
      return;
    }

    try {
      console.log(`Attempting to cancel booking with ID: ${bookingId}`); // Debug log
      const deleteResponse = await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`, {
        withCredentials: true,
      });

      // Send cancellation email to user and admin with userName
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
      setBookedSessions({ sessions: response.data, participants: [] });
      alert('Session canceled successfully. Emails have been sent to you and the admin.');
    } catch (error) {
      console.error('Error canceling session:', error);
      const errorMessage = error.response?.status === 404
        ? 'The booking could not be found. It may have been deleted or does not exist.'
        : error.response?.status === 403
        ? 'You are not authorized to cancel this booking.'
        : 'Failed to cancel session. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDeleteAccount = async () => {
    setShowPasswordModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!password) {
      setError('Please enter your password');
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
        setError('Incorrect password');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowPasswordModal(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Account Settings</h2>

      {isAdmin ? (
        <div className="admin-sessions">
          {renderSessionTable('MIDI')}
          {renderSessionTable('MINI')}
          <div className="season-tickets mt-5">
            <h3>Season Ticket Holders</h3>
            {adminSeasonTickets.length === 0 ? (
              <p>No users have purchased season tickets.</p>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Total Entries</th>
                    <th>Remaining Entries</th>
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
            <h3>Your Season Tickets</h3>
            {seasonTickets.length === 0 ? (
              <p>You have no active season tickets.</p>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Entries Total</th>
                    <th>Entries Remaining</th>
                    <th>Purchase Date</th>
                    <th>Expiry Date</th>
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
            <h3>Your Booked Sessions</h3>
            {bookedSessions.sessions.length === 0 ? (
              <p>You have no booked sessions.</p>
            ) : (
              <ul className="list-group">
                {bookedSessions.sessions.map((session) => (
                  <li key={session.booking_id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{session.training_type}</strong> - {new Date(session.training_date).toLocaleString()}
                    </div>
                    <div
                      data-tooltip-id="cancel-tooltip"
                      data-tooltip-content={
                        !canCancelSession(session.training_date)
                          ? 'Cancellation is no longer possible because there are less than 10 hours left until the training.'
                          : ''
                      }
                    >
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelSession(session.booking_id, session.training_date)}
                        disabled={!canCancelSession(session.training_date)}
                      >
                        Cancel Session
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
        <h5 className="text-danger">Danger Zone</h5>
        <p className="text-muted">
          Deleting your account will permanently remove all your data from our system. This action cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="btn btn-danger"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete My Account'}
        </button>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
      </div>

      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="password">
              <Form.Label>Enter your password to confirm deletion:</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteAccount}>
            Confirm Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserProfile;