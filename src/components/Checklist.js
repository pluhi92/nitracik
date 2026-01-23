import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Table, Container } from 'react-bootstrap';
import api from '../api/api';

const Checklist = () => {
    const { trainingId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState({ participants: [], training: null });
    const [loading, setLoading] = useState(true);

    // Načítanie dát
    useEffect(() => {
        const fetchChecklist = async () => {
            try {
                const response = await api.get(`/api/admin/checklist/${trainingId}`);
                setData(response.data);
            } catch (error) {
                console.error('Error loading checklist:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChecklist();
    }, [trainingId]);

    // Funkcia na zmenu checkboxu (v DB stĺpec checked_in)
    const handleCheckInToggle = async (bookingId, currentStatus) => {
        const newStatus = !currentStatus;

        // Optimistický update UI
        setData(prevData => ({
            ...prevData,
            participants: prevData.participants.map(p =>
                p.booking_id === bookingId ? { ...p, checked_in: newStatus } : p
            )
        }));

        try {
            await api.put(`/api/admin/checklist/${bookingId}/toggle`, {
                checked_in: newStatus
            });
        } catch (error) {
            console.error('Failed to update check-in status', error);
            // Vrátenie späť pri chybe
            setData(prevData => ({
                ...prevData,
                participants: prevData.participants.map(p =>
                    p.booking_id === bookingId ? { ...p, checked_in: currentStatus } : p
                )
            }));
            alert('Nepodarilo sa uložiť zmenu.');
        }
    };

    if (loading) {
        return <div className="text-center p-5">Načítavam checklist...</div>;
    }

    const formattedDate = data.training 
        ? new Date(data.training.training_date).toLocaleString('sk-SK', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          }) 
        : '';

    return (
        <Container className="mt-4 bg-white p-4 rounded shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    &larr; Späť
                </Button>
                <Button variant="primary" onClick={() => window.print()}>
                    🖨️ Tlačiť Checklist
                </Button>
            </div>

            <div className="checklist-header mb-4 border-bottom pb-2">
                <h2>Prezenčná listina (Checklist)</h2>
                <h4 className="text-muted">{data.training?.training_type} - {formattedDate}</h4>
            </div>

            <Table bordered hover responsive>
                <thead className="table-dark">
                    <tr>
                        <th>#</th>
                        <th>Meno</th>
                        <th className="text-center">Deti</th>
                        <th className="text-center">Sprievod</th>
                        <th>Poznámka</th>
                        <th>Typ platby</th>
                        <th className="text-center">CHECK</th>
                    </tr>
                </thead>
                <tbody>
                    {data.participants.length > 0 ? (
                        data.participants.map((p, index) => (
                            <tr 
                                key={p.booking_id}
                                className={p.checked_in ? "table-success" : ""}
                                style={{ transition: 'background-color 0.2s' }}
                            >
                                <td>{index + 1}</td>
                                <td className="fw-bold">{p.first_name} {p.last_name}</td>
                                <td className="text-center">{p.number_of_children}</td>
                                
                                {/* SPRIEVOD: Tu bola chyba, teraz mapujeme b.accompanying_person z DB */}
                                <td className="text-center">
                                    {p.accompanying_person ? (
                                        <span className="badge bg-info text-dark">ÁNO</span>
                                    ) : (
                                        <span className="text-muted small">nie</span>
                                    )}
                                </td>

                                <td>
                                    {p.note ? (
                                        <span className="text-danger fw-bold">{p.note}</span>
                                    ) : (
                                        <span className="text-muted small italic">Bez poznámky</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`badge ${
                                        p.payment_display === 'Platba' ? 'bg-success' : 
                                        p.payment_display === 'Permanentka' ? 'bg-warning text-dark' : 
                                        'bg-primary'
                                    }`}>
                                        {p.payment_display}
                                    </span>
                                </td>
                                <td className="text-center">
                                    <input 
                                        type="checkbox" 
                                        className="form-check-input" 
                                        checked={!!p.checked_in}
                                        onChange={() => handleCheckInToggle(p.booking_id, p.checked_in)}
                                        style={{ transform: "scale(1.7)", cursor: "pointer" }} 
                                    />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="text-center text-muted">
                                Žiadni účastníci na tento termín.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    h2 { font-size: 20px; }
                }
                /* Bootstrap trieda pre zelený riadok */
                .table-success td {
                    background-color: #d1e7dd !important;
                }
            `}</style>
        </Container>
    );
};

export default Checklist;