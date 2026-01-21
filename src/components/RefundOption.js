import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/api';

export default function RefundOption() {
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId');
  const action = params.get('action');
  const [message, setMessage] = useState('Processing your request...');
  const [isProcessed, setIsProcessed] = useState(false);

  useEffect(() => {
    if (bookingId && action) {
      api
        .get(`/api/booking/${action}`, { params: { bookingId } })
        .then((res) => {
          const { status, message, refundId } = res.data;

          if (status === 'processed') {
            setMessage(`Refund Processed Successfully! Refund ID: ${refundId}`);
            setIsProcessed(true);
          } else if (status === 'already') {
            setMessage(`Your refund has already been processed. Refund ID: ${refundId}`);
            setIsProcessed(true);
          } else {
            setMessage(message || 'Unexpected response from server.');
            setIsProcessed(false);
          }
        })
        .catch((err) => {
          setMessage(`Error: ${err.response?.data?.message || err.message || 'Unexpected error'}`);
          setIsProcessed(false);
        });
    }
  }, [bookingId, action]);

  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h2>{message}</h2>
      {isProcessed && (
        <p>
          <a href="/booking" style={{ color: '#667eea' }}>
            Go back to your bookings
          </a>
        </p>
      )}
      {!isProcessed && <p>Please wait or try again later.</p>}
    </div>
  );
}
