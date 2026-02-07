import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PencilSquareIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../api/api';

const FAQ = () => {
  const [faqData, setFaqData] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const userId = localStorage.getItem('userId');

  // Modal State (Add/Edit)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFaq, setCurrentFaq] = useState({ id: null, question: '', answer: '' });
  const [loading, setLoading] = useState(false);

  // 1. Obalíme funkcie do useCallback, aby boli stabilné
  const fetchFaqs = useCallback(async () => {
    try {
      const response = await api.get('/api/faqs');
      setFaqData(response.data);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    }
  }, []);

  const checkAdminStatus = useCallback(async () => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      // Kontrola podľa role (fallback na localStorage pre staršie sesie)
      if (response.data.role === 'admin' || localStorage.getItem('userRole') === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Admin check failed:', error);
    }
  }, [userId]);

  // 2. Teraz ich môžeme bezpečne pridať do závislostí useEffect
  useEffect(() => {
    fetchFaqs();
    if (userId) {
      checkAdminStatus();
    }
  }, [userId, fetchFaqs, checkAdminStatus]);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // --- HANDLERS ---

  const handleShowAdd = () => {
    setIsEditing(false);
    setCurrentFaq({ id: null, question: '', answer: '' });
    setShowModal(true);
  };

  const handleShowEdit = (e, faq) => {
    e.stopPropagation(); // Zabráni otvoreniu akordeónu pri kliknutí na edit
    setIsEditing(true);
    setCurrentFaq(faq);
    setShowModal(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Naozaj chcete vymazať túto otázku?')) {
      try {
        await api.delete(`/api/admin/faqs/${id}`);
        fetchFaqs(); // Refresh zoznamu
      } catch (error) {
        alert('Nepodarilo sa vymazať otázku.');
        console.error(error);
      }
    }
  };

  const handleSave = async () => {
    if (!currentFaq.question || !currentFaq.answer) {
      alert('Prosím vyplňte otázku aj odpoveď.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/api/admin/faqs/${currentFaq.id}`, {
          question: currentFaq.question,
          answer: currentFaq.answer
        });
      } else {
        await api.post('/api/admin/faqs', {
          question: currentFaq.question,
          answer: currentFaq.answer
        });
      }
      setShowModal(false);
      fetchFaqs();
    } catch (error) {
      alert('Chyba pri ukladaní. Skontrolujte či ste prihlásený ako admin.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-3">
            Často kladené otázky (FAQ)
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Nájdete tu odpovede na najčastejšie otázky o Nitráčikovi
          </p>

          {/* Admin tlačidlo - zobrazí sa len ak je isAdmin true */}
          {isAdmin && (
            <div className="mt-6">
              <button
                onClick={handleShowAdd}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Pridať novú otázku
              </button>
            </div>
          )}
        </div>

        {/* Zoznam FAQ */}
        <div className="space-y-3">
          {faqData.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Momentálne nie sú dostupné žiadne otázky.</p>
          ) : (
            faqData.map((faq, index) => (
              <div key={faq.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                <div
                  className="w-full px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => toggleAccordion(index)}
                >
                  <span className="text-lg font-medium text-gray-900 pr-4 flex-1">
                    {faq.question}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    {/* Admin Actions Icons */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 mr-2 border-r pr-3 border-gray-300">
                        <button
                          onClick={(e) => handleShowEdit(e, faq)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Upraviť"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, faq.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Vymazať"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {openIndex === index ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
                
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Admin Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Upraviť otázku' : 'Pridať novú otázku'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="font-semibold">Otázka</Form.Label>
              <Form.Control
                type="text"
                placeholder="Napíšte otázku..."
                value={currentFaq.question}
                onChange={(e) => setCurrentFaq({ ...currentFaq, question: e.target.value })}
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="font-semibold">Odpoveď</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                placeholder="Napíšte odpoveď..."
                value={currentFaq.answer}
                onChange={(e) => setCurrentFaq({ ...currentFaq, answer: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Zrušiť
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? 'Ukladám...' : 'Uložiť'}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
};

export default FAQ;