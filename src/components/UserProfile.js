import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import { Tooltip } from 'react-tooltip'; // Updated import
import './UserProfile.css';

const UserProfile = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [bookedSessions, setBookedSessions] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  // Fetch booked sessions
  useEffect(() => {
    const fetchBookedSessions = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/bookings/user/${userId}`, {
          withCredentials: true,
        });
        setBookedSessions(response.data);
      } catch (error) {
        console.error('Error fetching booked sessions:', error);
      }
    };

    if (userId) {
      fetchBookedSessions();
    }
  }, [userId]);

  // Check if a session can be canceled
  const canCancelSession = (trainingDate) => {
    const now = new Date();
    const sessionTime = new Date(trainingDate);
    const hoursBeforeSession = (sessionTime - now) / (1000 * 60 * 60); // Difference in hours
    return hoursBeforeSession > 10; // Allow cancellation if more than 10 hours remain
  };

  // Handle session cancellation
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

      // Refresh the list of booked sessions
      const response = await axios.get(`http://localhost:5000/api/bookings/user/${userId}`, {
        withCredentials: true,
      });
      setBookedSessions(response.data);

      alert('Session canceled successfully.');
    } catch (error) {
      console.error('Error canceling session:', error);
      alert('Failed to cancel session. Please try again.');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setShowPasswordModal(true); // Show password confirmation modal
  };

  const confirmDeleteAccount = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsDeleting(true);
    try {
      // Verify password
      const verifyResponse = await axios.post(
        'http://localhost:5000/api/verify-password',
        { password },
        { withCredentials: true }
      );

      if (verifyResponse.data.success) {
        // Delete account
        await axios.delete(`http://localhost:5000/api/users/${userId}`, {
          withCredentials: true,
        });

        // Clear local storage and redirect
        localStorage.removeItem('userId');
        localStorage.removeItem('isLoggedIn');
        navigate('/account-deleted'); // Redirect to confirmation page
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowPasswordModal(false); // Close modal
    }
  };

  return (
    <div className="container mt-5">
      <h2>Account Settings</h2>

      {/* Booked Sessions */}
      <div className="booked-sessions mt-5">
        <h3>Your Booked Sessions</h3>
        {bookedSessions.length === 0 ? (
          <p>You have no booked sessions.</p>
        ) : (
          <ul className="list-group">
            {bookedSessions.map((session) => (
              <li key={session.booking_id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>{session.training_type}</strong> - {new Date(session.training_date).toLocaleString()}
                </div>
                <div
                  data-tooltip-id="cancel-tooltip"
                  data-tooltip-content={!canCancelSession(session.training_date) ? 'Cancellation is no longer possible because there are less than 10 hours left until the training.' : ''}
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
      </div>

      {/* Tooltip component */}
      <Tooltip id="cancel-tooltip" place="top" effect="solid" />

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

      {/* Password Confirmation Modal */}
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