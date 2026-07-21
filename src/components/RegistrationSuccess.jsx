import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const RegistrationSuccess = () => {
  const location = useLocation();
  const message = location.state?.message || 'Registration successful! You can now log in.';

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h2 className="card-title text-success">Success!</h2>
              <p className="lead">{message}</p>
              <Link to="/login" className="btn btn-primary">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;