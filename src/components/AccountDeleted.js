import React from 'react';
import { Link } from 'react-router-dom';

const AccountDeleted = () => {
  return (
    <div className="container mt-5 text-center">
      <h2>Your Account Has Been Deleted</h2>
      <p className="lead">
        Thank you for being part of our trainings. We hope to see you again in the future!
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Home
      </Link>
    </div>
  );
};

export default AccountDeleted;