import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/api';

export default function RefundOption() {
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId');
  const action = params.get('action');

  useEffect(() => {
    if (bookingId && action) {
      api 
        .get(`/api/booking/${action}`, { params: { bookingId } }) 
        .then((res) => {
          // display the HTML content returned from the backend directly
          document.body.innerHTML = res.data;
        })
        .catch((err) => {
          document.body.innerHTML = `<h2>Error</h2><p>${
            err.response?.data || 'Unexpected error'
          }</p>`;
        });
    }
  }, [bookingId, action]);

  return <h2 style={{ textAlign: 'center' }}>Processing your request...</h2>;
}
