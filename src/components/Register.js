import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    address: '',
  });
  const [repeatPasswordError, setRepeatPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        if (!value) return 'First name is required.';
        break;
      case 'lastName':
        if (!value) return 'Last name is required.';
        break;
      case 'email':
        if (!value) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address.';
        break;
      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 6) return 'Password must be at least 6 characters long.';
        break;
      case 'address':
        if (!value) return 'Address is required.';
        break;
      default:
        break;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');
  
    const newErrors = {
      firstName: validateField('firstName', firstName),
      lastName: validateField('lastName', lastName),
      email: validateField('email', email),
      password: validateField('password', password),
      address: validateField('address', address),
    };
    setErrors(newErrors);
  
    if (password !== repeatPassword) {
      setRepeatPasswordError('Passwords do not match.');
      setLoading(false);
      return;
    } else {
      setRepeatPasswordError('');
    }
  
    if (Object.values(newErrors).some((error) => error)) {
      setLoading(false);
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:5000/api/register', {
        firstName,
        lastName,
        email,
        password,
        address,
      });
      console.log('Registration successful:', response.data);
  
      // Show message instead of redirecting
      setApiError('Registration successful. Please check your email to verify your account.');
      setTimeout(() => {
        navigate('/'); // Change '/' to your desired path
      }, 4000);
    } catch (error) {
      if (error.response?.status === 400) {
        setApiError(error.response.data.message);
        setErrors((prev) => ({ ...prev, email: 'Email is already registered' }));
      } else {
        console.error('Registration failed:', error.response?.data || error.message);
        setApiError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

   return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-center">Register</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="firstName" className="form-label">First Name</label>
                  <input
                    type="text"
                    className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                    id="firstName"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setErrors({ ...errors, firstName: validateField('firstName', e.target.value) });
                    }}
                    required
                  />
                  {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="lastName" className="form-label">Last Name</label>
                  <input
                    type="text"
                    className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                    id="lastName"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setErrors({ ...errors, lastName: validateField('lastName', e.target.value) });
                    }}
                    required
                  />
                  {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email || apiError ? 'is-invalid' : ''}`}
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: validateField('email', e.target.value) });
                      setApiError(''); // Clear error when user edits email
                    }}
                    required
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>} 
                </div>
                {/* Password Input */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({ ...errors, password: validateField('password', e.target.value) });
                    }}
                    required
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>

                {/* Repeated Password Input */}
                <div className="mb-3">
                  <label htmlFor="repeatPassword" className="form-label">Repeat Password</label>
                  <input
                    type="password"
                    className={`form-control ${repeatPasswordError ? 'is-invalid' : ''}`}
                    id="repeatPassword"
                    value={repeatPassword}
                    onChange={(e) => {
                      setRepeatPassword(e.target.value);
                      setRepeatPasswordError(''); // Clear error when user edits the field
                    }}
                    required
                  />
                  {repeatPasswordError && <div className="invalid-feedback">{repeatPasswordError}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="address" className="form-label">Address</label>
                  <input
                    type="text"
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                    id="address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setErrors({ ...errors, address: validateField('address', e.target.value) });
                    }}
                    required
                  />
                  {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={
                    loading || // Disable while loading
                    !firstName ||
                    !lastName ||
                    !email ||
                    !password ||
                    !repeatPassword ||
                    !address ||
                    Object.values(errors).some((error) => error) ||
                    repeatPasswordError
                  }
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span className="ms-2">Registering...</span>
                    </>
                  ) : (
                    'Register'
                  )}
                </button>
                {/* Display API error in red */}
                {apiError && <div className="text-danger mt-2 text-center">{apiError}</div>}
              </form>
              <div className="mt-3 text-center">
                <p>Already registered? <Link to="/login">Login here</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;