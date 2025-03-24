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
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin check
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
    if (userId) checkAdmin();
  }, [userId]);

  // Fetch bookings data
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const endpoint = isAdmin 
          ? '/api/admin/bookings'
          : `/api/bookings/user/${userId}`;

        const response = await axios.get(`http://localhost:5000${endpoint}`, {
          withCredentials: true,
        });
        
        // Ensure proper data structure
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

  // Process sessions data for admin view
  const processSessions = (data) => {
    if (!data || !data.sessions) return [];
    
    const grouped = {};
    
    data.sessions.forEach(session => {
      const key = `${session.training_date}-${session.training_type}`;
      grouped[key] = {
        ...session,
        participants: data.participants
          .filter(p => 
            p.training_date === session.training_date &&
            p.training_type === session.training_type
          )
      };
    });

    return Object.values(grouped);
  };

  // Render session tables for admin
  const renderSessionTable = (type) => {
    const processedSessions = processSessions(bookedSessions);
    const filtered = processedSessions
      .filter(session => session.training_type === type)
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
              <th>Participants</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((session) => (
              <tr key={`${session.training_date}-${session.training_type}`}>
                <td>{new Date(session.training_date).toLocaleString()}</td>
                <td>{session.training_type}</td>
                <td>{session.available_spots}</td>
                <td>
                  <ul className="list-unstyled">
                    {session.participants.map((participant, index) => (
                      <li key={index}>
                        {participant.first_name} {participant.last_name}
                        <br />
                        <small className="text-muted">{participant.email}</small>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  // Check if session can be canceled (for regular users)
  const canCancelSession = (trainingDate) => {
    const now = new Date();
    const sessionTime = new Date(trainingDate);
    const hoursBeforeSession = (sessionTime - now) / (1000 * 60 * 60);
    return hoursBeforeSession > 10;
  };

  // Handle session cancellation (for regular users)
  const handleCancelSession = async (bookingId, trainingDate) => {
    if (!canCancelSession(trainingDate)) {
      alert('Cancellation is only allowed up to 10 hours before the session.');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this session?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`, {
        withCredentials: true,
      });

      // Refresh bookings
      const response = await axios.get(`http://localhost:5000/api/bookings/user/${userId}`, {
        withCredentials: true,
      });
      setBookedSessions({ sessions: response.data, participants: [] });

      alert('Session canceled successfully.');
    } catch (error) {
      console.error('Error canceling session:', error);
      alert('Failed to cancel session. Please try again.');
    }
  };

  // Account deletion handlers
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
        // Admin view
        <div className="admin-sessions">
          {renderSessionTable('MIDI')}
          {renderSessionTable('MINI')}
        </div>
      ) : (
        // Regular user view
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
                    data-tooltip-content={!canCancelSession(session.training_date) ? 
                      'Cancellation is no longer possible because there are less than 10 hours left until the training.' : ''}
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
      )}

      {/* Danger Zone */}
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

      {/* Password Modal */}
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