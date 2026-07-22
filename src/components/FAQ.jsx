import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Pencil, 
  Trash2, 
  Plus, 
  HelpCircle, 
  X 
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

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
      if (response.data.role === 'admin' || localStorage.getItem('userRole') === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Admin check failed:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchFaqs();
    if (userId) {
      checkAdminStatus();
    }
  }, [userId, fetchFaqs, checkAdminStatus]);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleShowAdd = () => {
    setIsEditing(false);
    setCurrentFaq({ id: null, question: '', answer: '' });
    setShowModal(true);
  };

  const handleShowEdit = (e, faq) => {
    e.stopPropagation();
    setIsEditing(true);
    setCurrentFaq(faq);
    setShowModal(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Naozaj chcete vymazať túto otázku?')) {
      try {
        await api.delete(`/api/admin/faqs/${id}`);
        fetchFaqs();
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
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-16 container-custom max-w-4xl mx-auto px-4 sm:px-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-2">
          Často kladené otázky (FAQ)
        </h1>
        <p className="text-neutral-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Nájdete tu odpovede na najčastejšie otázky o Nitráčikovi
        </p>

        {isAdmin && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleShowAdd}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-sm hover:bg-primary-600 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Pridať novú otázku</span>
            </button>
          </div>
        )}
      </div>

      {/* Zoznam FAQ */}
      <div className="space-y-4">
        {faqData.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-neutral-200 shadow-sm">
            <HelpCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 font-medium">Momentálne nie sú dostupné žiadne otázky.</p>
          </div>
        ) : (
          faqData.map((faq, index) => (
            <div 
              key={faq.id} 
              className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              <div
                className="w-full px-6 sm:px-8 py-3 flex justify-between items-center cursor-pointer select-none transition-colors duration-200"
                onClick={() => toggleAccordion(index)}
              >
                <span className="text-base sm:text-lg font-extrabold text-foreground pr-4 flex-1">
                  {faq.question}
                </span>
                
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <div className="flex items-center gap-2 mr-2 border-r pr-3 border-neutral-200">
                      <button
                        type="button"
                        onClick={(e) => handleShowEdit(e, faq)}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-200"
                        title="Upraviť"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, faq.id)}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100"
                        title="Vymazať"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-500">
                    {openIndex === index ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
              
              <AnimatePresence>
                  {openIndex === index && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="px-6 sm:px-8 pb-4"
                  >
                    <div className="border-t border-neutral-100 pt-4">
                      <p className="text-neutral-600 font-medium leading-relaxed whitespace-pre-line text-base sm:text-lg">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Admin Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-neutral-200">
          <Modal.Title className="font-extrabold text-xl text-foreground">
            {isEditing ? 'Upraviť otázku' : 'Pridať novú otázku'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6 space-y-5">
          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">Otázka</Form.Label>
              <Form.Control
                type="text"
                placeholder="Napíšte otázku..."
                value={currentFaq.question}
                onChange={(e) => setCurrentFaq({ ...currentFaq, question: e.target.value })}
                autoFocus
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">Odpoveď</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                placeholder="Napíšte odpoveď..."
                value={currentFaq.answer}
                onChange={(e) => setCurrentFaq({ ...currentFaq, answer: e.target.value })}
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-neutral-200 p-6">
          <button 
            type="button"
            onClick={() => setShowModal(false)} 
            className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 transition-all text-sm"
          >
            Zrušiť
          </button>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-600 transition-all text-sm shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Spinner size="sm" />}
            <span>{loading ? 'Ukladám...' : 'Uložiť'}</span>
          </button>
        </Modal.Footer>
      </Modal>
    </motion.section>
  );
};

export default FAQ;