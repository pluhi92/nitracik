import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import api from '../api/api';
import { 
  ChevronDown, 
  ChevronUp, 
  Pencil, 
  Trash2, 
  Plus, 
  HelpCircle, 
  X 
} from 'lucide-react';

const FlakPink = ({ className, style }) => (
  <svg viewBox="0 0 170.079 170.658" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,102.0004,33.3618)" fill="#F4A5A5" d="M0 0C-.049 .001-.084 .006-.122 .01-.182 .023-.241 .037-.301 .049-.28 .054-.187 .045 0 0M19.592-55.855C20.281-56.109 20.126-56.34 19.592-55.855M59.411-29.461C57.428-26.123 53.616-24.284 50.208-22.771 45.813-20.82 41.283-19.202 36.756-17.587 34.934-16.937 33.322-16.418 31.946-15.898 33.149-13.263 34.563-10.35 35.803-7.743 38.635-1.79 44.262 6.585 43.568 13.498L43.497 13.469C43.477 15.353 42.864 17.163 41.371 18.802 37.474 23.079 28.987 20.373 28.555 14.604 28.445 14.402 28.336 14.198 28.223 14.009 27.353 12.55 26.389 11.142 25.433 9.738 23.773 7.298 22.062 4.894 20.341 2.496 17.561 3.718 13.969 3.659 11.099 3.032 9.233 2.625 7.411 2.02 5.587 1.448 4.969 4.959 2.515 8.404-1.587 7.855-4.99 7.4-8.385 6.912-11.775 6.385-12.271 11.193-13.235 15.956-14.62 20.562-16.34 26.288-22.863 27.479-27.155 23.872-29.653 21.772-31.991 19.435-34.568 17.453-34.618 17.567-34.663 17.681-34.714 17.794-38.307 25.869-50.188 19.92-48.422 12.015-47.755 9.033-46.907 6.076-45.887 3.176-46.502 3.008-47.126 2.762-47.758 2.406-57.967-3.36-68.755-7.401-80.21-9.896-84.776-10.891-86.216-14.818-85.362-18.369-86.023-18.416-86.685-18.451-87.347-18.501-96.907-19.233-97.085-33.067-87.347-33.501-81.613-33.757-75.879-34.013-70.144-34.269-70.426-35.257-70.513-36.288-70.372-37.299-71.676-36.835-73.11-36.745-74.61-37.174-77.526-38.008-80.49-41.163-80.116-44.406-79.648-48.474-77.55-52.006-74.602-54.375-73.368-56.077-72.13-57.775-70.894-59.475-73.925-59.862-76.894-62.027-77.429-64.966-77.515-65.437-77.579-65.903-77.632-66.367-77.665-66.302-77.709-66.233-77.74-66.169-77.842-65.96-78.057-65.256-78.171-64.792-78.171-64.779-78.171-64.766-78.17-64.753-78.013-65.121-77.933-63.415-78.146-64.399-76.112-55.002-90.455-50.97-92.61-60.411-94.585-69.06-90.861-78.252-87.146-85.912-83.522-93.383-78.368-102.026-71.043-106.413-70.899-106.499-70.752-106.575-70.607-106.655-71.385-107.292-72.087-107.977-72.681-108.716-75.51-112.236-75.857-118.087-71.163-120.496-66.359-122.962-59.616-121.749-53.963-118.957-52.734-120.363-51.239-121.576-49.448-122.532-45.554-124.61-40.944-124.631-36.98-122.994-32.924-124.98-28.867-126.966-24.81-128.953-21.445-130.6-16.346-130.152-14.549-126.262-12.801-122.479-12.278-118.361-12.835-114.457-12.433-114.495-12.031-114.533-11.629-114.57-7.965-114.914-4.666-111.455-4.263-108.067-4.142-107.049-4.209-106.096-4.432-105.218-3.22-104.77-2.05-104.177-.94-103.467 1.423-105.279 3.805-107.066 6.221-108.806 12.385-113.244 19.072-118.602 26.383-121.019 31.118-122.584 36.677-121.152 38.264-115.886 39.425-112.034 37.477-108.294 35.327-105.21 31.237-99.345 26.243-94.192 21.555-88.821 21.454-88.705 21.354-88.587 21.253-88.471 25.425-87.677 28.671-85.208 31.348-81.712 33.784-78.532 31.874-73.606 28.881-71.604 29.147-71.392 29.404-71.181 29.645-70.975 34.107-67.15 37.25-61.703 36.609-55.69 35.893-48.969 30.618-45.112 25.644-41.229 34.669-43.988 45.652-46.496 54.535-42.159 59.491-39.739 62.499-34.66 59.411-29.461" />
  </svg>
);

const FlakCream = ({ className, style }) => (
  <svg viewBox="0 0 170.079 186.77" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,48.2144,165.57071)" fill="#EFE4C8" d="M0 0C-.168-.194-.238-.269 0 0M-26.05 53.518C-26.131 53.517-26.214 53.524-26.295 53.521-26.528 53.513-26.826 53.628-27.052 53.58-26.742 53.646-26.402 53.614-26.05 53.518M-21.47 47.527C-21.498 47.541-21.521 47.552-21.534 47.559-21.638 47.617-21.705 47.635-21.758 47.641-21.758 47.645-21.757 47.646-21.757 47.65-21.734 48.081-21.613 47.898-21.47 47.527M110.15 62.303C107.116 63.184 104.727 64.781 102.823 66.842 103.529 68.373 103.864 69.987 103.89 71.627 107.735 73.614 110.494 77.248 110.025 82.154 109.638 86.21 106.903 89.629 102.525 89.654 100.286 89.667 98.047 89.68 95.808 89.693 95.791 89.776 95.772 89.859 95.755 89.942 96.096 90.51 96.433 91.081 96.746 91.661 102.128 101.644 101.602 115.764 91.484 122.235 87.426 127.948 80.504 130.605 73.631 130.344 71.238 131.943 68.231 132.319 65.794 131.33 65.44 132.156 65.044 132.975 64.57 133.777 62.624 137.073 59.423 137.949 56.571 137.17 53.53 142.418 50.094 147.541 46.219 152.177 44.129 154.678 41.587 157.301 38.336 158.187 33.582 159.483 29.055 156.611 27.626 152.049 25.506 145.277 27.868 136.599 29.08 129.88 29.306 128.625 29.59 127.328 29.898 126.01 29.882 125.982 29.865 125.955 29.849 125.928 28.135 124.055 26.418 122.185 24.71 120.308 23.918 119.437 22.939 118.469 21.906 117.431 21.381 117.615 20.844 117.777 20.293 117.908 16.407 124.779 12.204 132.099 11.117 139.561 10.307 145.122 2.057 146.775-1.419 142.871-7.775 135.73-6.737 125.805-4.314 117.219-4.223 116.895-4.111 116.574-4.015 116.251-7.819 115.72-11.541 114.236-14.5 111.961-21.762 114.214-29.373 114.816-36.422 113.282-43.959 111.641-43.148 100.885-36.422 98.818-29.578 96.714-23.759 92.901-18.416 88.34-20.759 88.357-23.047 87.64-24.772 85.878-28.055 82.525-27.219 78.105-25.606 74.209-22.098 65.735-14.95 59.381-7.67 54.053-10.925 53.889-14.181 53.732-17.439 53.612-19.622 53.532-21.81 53.451-23.995 53.466-24.472 53.469-24.953 53.493-25.433 53.509-29.306 54.641-34.412 52.786-35.444 48.477-37.939 38.061-28.156 33.128-19.643 31.287-12.564 29.757-5.314 29.111 1.923 28.51 .46 22.217-.966 15.912-2.183 9.568-3.345 3.505-4.649-2.693-3.781-8.86-3.037-14.148 3.398-15.053 7.236-13.342 12.229-11.117 15.582-4.028 18.151 .638 18.69-.342 19.373-1.294 20.226-2.201 25.939-8.272 35.783-8.166 42.419-3.696 46.618-.867 48.926 3.22 50.119 7.756 57.704 3.858 66.779 2.626 74.906 4.709 80.686 6.19 88.654 10.306 92.058 15.338 97.075 22.757 91.471 28.464 84.373 30.439 84.335 30.449 84.258 30.473 84.159 30.504 85.116 32.223 85.851 34.067 86.308 35.971 87.099 39.259 87.17 43.268 86.072 46.52 86.044 46.603 86.006 46.683 85.976 46.765 86.932 46.624 87.894 46.427 88.868 46.138 91.649 45.314 94.118 46.242 95.839 47.967 97.975 47.722 99.924 48.397 101.384 49.651 102.872 48.948 104.456 48.334 106.162 47.839 115.451 45.143 119.417 59.614 110.15 62.303" />
  </svg>
);

const faqFlakVariants = [
  {
    pink: { width: 90, top: 4, right: 8, opacity: 0.25, zIndex: -1, transform: 'rotate(15deg)' },
    cream: { width: 80, bottom: 4, left: 8, opacity: 0.22, zIndex: -1, transform: 'rotate(-20deg)' }
  },
  {
    pink: { width: 72, top: 6, left: 10, opacity: 0.22, zIndex: -1, transform: 'rotate(-18deg)' },
    cream: { width: 95, bottom: 5, right: 12, opacity: 0.24, zIndex: -1, transform: 'rotate(25deg)' }
  },
  {
    pink: { width: 78, bottom: 5, left: 12, opacity: 0.24, zIndex: -1, transform: 'rotate(30deg)' },
    cream: { width: 88, top: 5, right: 10, opacity: 0.22, zIndex: -1, transform: 'rotate(-12deg)' }
  },
  {
    pink: { width: 68, bottom: 6, right: 14, opacity: 0.22, zIndex: -1, transform: 'rotate(-25deg)' },
    cream: { width: 82, top: 6, left: 12, opacity: 0.24, zIndex: -1, transform: 'rotate(20deg)' }
  },
  {
    pink: { width: 85, top: 5, right: '35%', opacity: 0.22, zIndex: -1, transform: 'rotate(-8deg)' },
    cream: { width: 76, bottom: 5, left: '30%', opacity: 0.22, zIndex: -1, transform: 'rotate(22deg)' }
  },
  {
    pink: { width: 75, top: 5, left: '38%', opacity: 0.22, zIndex: -1, transform: 'rotate(12deg)' },
    cream: { width: 92, bottom: 5, right: '25%', opacity: 0.24, zIndex: -1, transform: 'rotate(-16deg)' }
  }
];

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
    <div className="relative w-full bg-white">
    <section className="py-12 md:py-16 container-custom max-w-4xl mx-auto px-4 sm:px-6">
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
          <div className="text-center py-16 bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md relative overflow-hidden" style={{ isolation: 'isolate' }}>
            <FlakCream className="absolute pointer-events-none" style={{ width: 180, top: 10, right: '30%', opacity: 0.28, zIndex: -1, transform: 'rotate(20deg)' }} />
            <HelpCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 font-medium">Momentálne nie sú dostupné žiadne otázky.</p>
          </div>
        ) : (
          faqData.map((faq, index) => {
            const flak = faqFlakVariants[index % faqFlakVariants.length];
            return (
            <div 
              key={faq.id} 
              className="relative bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
              style={{ isolation: 'isolate' }}
            >
              <FlakPink className="absolute pointer-events-none" style={flak.pink} />
              <FlakCream className="absolute pointer-events-none" style={flak.cream} />
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
              
              {openIndex === index && (
                  <div className="px-6 sm:px-8 pb-4">
                    <div className="border-t border-neutral-100 pt-4">
                      <p className="text-neutral-600 font-medium leading-relaxed whitespace-pre-line text-base sm:text-lg">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
            </div>
            );
          })
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
    </section>
    </div>
  );
};

export default FAQ;