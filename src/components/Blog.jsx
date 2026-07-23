import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../api/api';
import { useUser } from '../contexts/UserContext';
import ShareModal from './ShareModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  ArrowRight, 
  Share2, 
  Pencil, 
  Trash2, 
  Link as LinkIcon, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Calendar
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const Blog = ({ limit = null, showViewAll = true }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReadModal, setShowReadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    perex: '',
    content: '',
    source_url: '',
    image_url: '',
    label_id: null
  });
  const [error, setError] = useState('');

  // Upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const userId = localStorage.getItem('userId');

  const checkAdminStatus = useCallback(async () => {
    if (!userId || !user?.isLoggedIn) {
      setIsAdmin(false);
      return;
    }

    try {
      const response = await api.get(`/api/users/${userId}`);
      if (response.data.role === 'admin' || localStorage.getItem('userRole') === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Blog: Admin check failed:', error);
      setIsAdmin(false);
    }
  }, [userId, user?.isLoggedIn]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/blog-posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setError(t?.blog?.fetchError || 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, [t?.blog?.fetchError]);

  const fetchLabels = useCallback(async () => {
    try {
      const response = await api.get('/api/blog-labels');
      setLabels(response.data);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchLabels();
    checkAdminStatus();
  }, [fetchPosts, fetchLabels, checkAdminStatus]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Prosím vyberte obrázok (JPG, PNG, GIF, WebP, atď.)');
        return;
      }

      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setSelectedFile(file);
      setCompressionInfo(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', selectedFile);

    try {
      const response = await api.post('/api/admin/upload-blog-image', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploading(false);

      if (response.data.compression) {
        setCompressionInfo({
          originalSize: (response.data.originalSize / (1024 * 1024)).toFixed(2),
          processedSize: (response.data.processedSize / 1024).toFixed(2),
          compression: response.data.compression
        });
      }

      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Nepodarilo sa nahrať obrázok');
      setUploading(false);
      return null;
    }
  };

  const handleDeleteImage = async () => {
    if (!formData.image_url) return;

    if (window.confirm('Naozaj chcete zmazať tento obrázok?')) {
      try {
        if (formData.image_url.startsWith('/uploads/')) {
          await api.delete('/api/admin/delete-blog-image', {
            data: { imageUrl: formData.image_url }
          });
        }

        await api.put(`/api/admin/blog-posts/${currentPost.id}`, {
          ...formData,
          image_url: null
        });

        setFormData({ ...formData, image_url: '' });
        setImagePreview(null);
        setSelectedFile(null);
        fetchPosts();
      } catch (error) {
        console.error('Error deleting image:', error);
        setError('Nepodarilo sa zmazať obrázok');
      }
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    try {
      let finalImageUrl = formData.image_url;

      if (uploadMethod === 'upload' && selectedFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      await api.post('/api/admin/blog-posts', {
        ...formData,
        image_url: finalImageUrl || null
      });

      setShowCreateModal(false);
      setFormData({ title: '', perex: '', content: '', source_url: '', image_url: '', label_id: null });
      setSelectedFile(null);
      setImagePreview(null);
      setUploadMethod('url');
      setCompressionInfo(null);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(t?.blog?.createError || 'Failed to create post');
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();

    try {
      let finalImageUrl = formData.image_url;

      if (uploadMethod === 'upload' && selectedFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      await api.put(`/api/admin/blog-posts/${currentPost.id}`, {
        ...formData,
        image_url: finalImageUrl || null
      });

      setShowEditModal(false);
      setCurrentPost(null);
      setSelectedFile(null);
      setImagePreview(null);
      setUploadMethod('url');
      setCompressionInfo(null);
      fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      setError(t?.blog?.updateError || 'Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm(t?.blog?.confirmDelete || 'Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/api/admin/blog-posts/${postId}`);
        fetchPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
        setError(t?.blog?.deleteError || 'Failed to delete post');
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('sk-SK', options);
  };

  const getLabelById = (labelId) => {
    return labels.find(label => label.id === labelId);
  };

  const handleOpenCreateModal = () => {
    setFormData({ title: '', perex: '', content: '', source_url: '', image_url: '', label_id: null });
    setSelectedFile(null);
    setImagePreview(null);
    setUploadMethod('url');
    setCompressionInfo(null);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (post) => {
    setCurrentPost(post);
    setFormData({
      title: post.title,
      perex: post.perex,
      content: post.content || '',
      source_url: post.source_url || '',
      image_url: post.image_url || '',
      label_id: post.label_id || null
    });
    setSelectedFile(null);
    setImagePreview(post.image_url);
    setUploadMethod('url');
    setCompressionInfo(null);
    setShowEditModal(true);
  };

  const getThumbnailUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.includes('/uploads/blog/')) {
      return imageUrl.replace('.webp', '-thumb.webp');
    }
    return imageUrl;
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner animation="border" className="text-primary" />
      </div>
    );
  }

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-6 md:py-8 container-custom max-w-6xl mx-auto px-1 sm:px-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <Link to="/blog" className="no-underline group flex justify-center sm:block">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors whitespace-nowrap leading-tight text-center sm:text-left">
            {t?.blog?.title || 'Aktuality & Blog'}
          </h2>
        </Link>
        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            title={t?.blog?.newPost || 'Nový článok'}
            className="flex items-center justify-center gap-2 bg-primary text-white px-4 sm:px-5 py-2.5 rounded-full font-bold shadow-sm hover:bg-primary-600 transition-all text-sm w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>{t?.blog?.newPost || 'Nový článok'}</span>
          </button>
        )}
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible className="rounded-2xl border-red-200 bg-red-50 text-red-800 font-medium">
          {error}
        </Alert>
      )}

      {compressionInfo && (
        <Alert variant="success" dismissible onClose={() => setCompressionInfo(null)} className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-800">
          <strong>🎉 Obrázok úspešne optimalizovaný!</strong>
          <ul className="mb-0 mt-2 text-xs">
            <li>Pôvodná veľkosť: {compressionInfo.originalSize} MB</li>
            <li>Po kompresii: {compressionInfo.processedSize} KB</li>
            <li>Úspora: {compressionInfo.compression}</li>
          </ul>
        </Alert>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[2rem] border border-neutral-200 shadow-sm">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 font-medium mb-6">{t?.blog?.noPosts || 'Žiadne články na zobrazenie'}</p>
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="px-6 py-3 bg-primary text-white rounded-full font-bold shadow-sm hover:bg-primary-600 transition-all text-sm"
            >
              {t?.blog?.createFirstPost || 'Vytvoriť prvý článok'}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
            {(limit ? posts.slice(0, limit) : posts).map(post => (
              <motion.div 
                key={post.id} 
                className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group w-full"
                whileHover={{ y: -4 }}
              >
                {post.image_url && (
                  <div className="h-56 sm:h-48 overflow-hidden bg-neutral-100 relative">
                    <img
                      src={api.makeImageUrl(getThumbnailUrl(post.image_url))}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={post.title}
                      onError={(e) => {
                        e.target.src = api.makeImageUrl(post.image_url);
                        e.target.onerror = () => {
                          e.target.src = 'https://picsum.photos/400/200?random=' + post.id;
                        };
                      }}
                    />
                  </div>
                )}
                
                <div className="px-3 py-3 sm:px-5 sm:py-5 flex flex-col flex-grow">
                  {/* Label Badge */}
                  {post.label_id && (
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-3 w-fit shadow-xs"
                      style={{
                        backgroundColor: getLabelById(post.label_id)?.color || '#3b82f6',
                      }}
                    >
                      {getLabelById(post.label_id)?.name || 'Label'}
                    </span>
                  )}
                  
                  <h3 className="text-xl font-extrabold text-foreground mb-3 tracking-tight line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-neutral-600 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                    {post.perex}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(post.created_at)}</span>
                    </div>

                    <div className="flex items-center justify-center gap-2 flex-nowrap">
                      <Link
                        to={`/blog/${post.slug}`}
                        title={t?.blog?.readMore || 'Čítať viac'}
                        className="w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        title="Zdieľať článok"
                        onClick={() => {
                          setCurrentPost(post);
                          setShowShareModal(true);
                        }}
                        className="w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            title={t?.blog?.edit || 'Upraviť'}
                            onClick={() => handleOpenEditModal(post)}
                            className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            title={t?.blog?.delete || 'Zmazať'}
                            onClick={() => handleDeletePost(post.id)}
                            className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 hover:bg-red-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {showViewAll && limit && posts.length > limit && (
            <div className="text-center mt-12">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-600 text-white rounded-full font-bold transition-all shadow-sm text-base no-underline"
              >
                <span>Pozrieť všetky články ({posts.length})</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </>
      )}

      {/* Create Post Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-neutral-200">
          <Modal.Title className="font-extrabold text-xl text-foreground">{t?.blog?.createPost || 'Vytvoriť nový článok'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreatePost}>
          <Modal.Body className="p-6 space-y-5">
            <Form.Group>
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.titleLabel || 'Názov'}</Form.Label>
              <Form.Control
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </Form.Group>
            
            <Form.Group>
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.perexLabel || 'Krátky popis (perex)'}</Form.Label>
              <Form.Control
                required
                as="textarea"
                rows={3}
                value={formData.perex}
                onChange={(e) => setFormData({ ...formData, perex: e.target.value })}
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.contentLabel || 'Obsah'}</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">Zdroj (URL)</Form.Label>
              <Form.Control
                type="text"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://priklad.sk"
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <Form.Text className="text-neutral-400 text-xs mt-1">
                Voliteľné: URL zdroja článku. Ak je vyplnené, zobrazí sa ako odkaz na konci článku.
              </Form.Text>
            </Form.Group>

            {/* LABEL SELECTOR */}
            <Form.Group>
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">Kategória článku</Form.Label>
              <Form.Select
                value={formData.label_id || ''}
                onChange={(e) => setFormData({ ...formData, label_id: e.target.value ? parseInt(e.target.value) : null })}
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Bez kategórie</option>
                {labels.map(label => (
                  <option key={label.id} value={label.id}>
                    {label.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="font-extrabold text-sm text-foreground mb-3">Obrázok článku</Form.Label>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div
                  onClick={() => {
                    setUploadMethod('url');
                    setSelectedFile(null);
                  }}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center ${
                    uploadMethod === 'url'
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary font-bold'
                      : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <LinkIcon className="w-5 h-5" />
                  <span className="text-xs font-bold">Vložiť URL odkazu</span>
                </div>

                <div
                  onClick={() => {
                    setUploadMethod('upload');
                    setFormData({ ...formData, image_url: '' });
                  }}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center ${
                    uploadMethod === 'upload'
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary font-bold'
                      : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <UploadCloud className="w-5 h-5" />
                  <span className="text-xs font-bold">Nahrať zo zariadenia</span>
                </div>
              </div>

              {uploadMethod === 'url' ? (
                <div>
                  <Form.Control
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://priklad.sk/obrazok.jpg"
                    className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium"
                  />
                </div>
              ) : (
                <div className="p-4 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 text-center">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="mb-2 text-xs"
                  />
                  <div className="text-xs text-neutral-500 font-medium">
                    ✨ Obrázky sú automaticky optimalizované do WebP formátu.
                  </div>

                  {imagePreview && (
                    <div className="mt-4 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded-xl shadow-xs border border-neutral-200 max-h-32 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-neutral-200 p-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 transition-all text-sm"
            >
              {t?.blog?.cancel || 'Zrušiť'}
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-600 transition-all text-sm shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {uploading && <Spinner size="sm" />}
              <span>{uploading ? 'Optimalizujem...' : (t?.blog?.create || 'Vytvoriť článok')}</span>
            </button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Post Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-neutral-200">
          <Modal.Title className="font-extrabold text-xl text-foreground">{t?.blog?.editPost || 'Upraviť článok'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdatePost}>
          <Modal.Body className="p-6 space-y-5">
            <Form.Group>
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.titleLabel || 'Názov'}</Form.Label>
              <Form.Control
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium"
              />
            </Form.Group>
            
            <Form.Group>
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.perexLabel || 'Krátky popis (perex)'}</Form.Label>
              <Form.Control
                required
                as="textarea"
                rows={3}
                value={formData.perex}
                onChange={(e) => setFormData({ ...formData, perex: e.target.value })}
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.contentLabel || 'Obsah'}</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">Zdroj (URL)</Form.Label>
              <Form.Control
                type="text"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://priklad.sk"
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">Kategória článku</Form.Label>
              <Form.Select
                value={formData.label_id || ''}
                onChange={(e) => setFormData({ ...formData, label_id: e.target.value ? parseInt(e.target.value) : null })}
                className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium"
              >
                <option value="">Bez kategórie</option>
                {labels.map(label => (
                  <option key={label.id} value={label.id}>
                    {label.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="font-extrabold text-sm text-foreground mb-3">Obrázok článku</Form.Label>

              {formData.image_url && (
                <div className="mb-4 p-4 border border-neutral-200 rounded-2xl bg-neutral-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={api.makeImageUrl(formData.image_url)}
                      alt="Current"
                      className="w-14 h-14 rounded-xl object-cover border border-neutral-200"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <p className="mb-0 text-sm font-bold text-foreground">Aktuálny obrázok</p>
                      <p className="mb-0 text-xs text-neutral-400 truncate max-w-[220px]">{formData.image_url}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    title="Odstrániť obrázok"
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div
                  onClick={() => {
                    setUploadMethod('url');
                    setSelectedFile(null);
                  }}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center ${
                    uploadMethod === 'url' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary font-bold' : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <LinkIcon className="w-5 h-5" />
                  <span className="text-xs font-bold">Vložiť URL odkazu</span>
                </div>
                <div
                  onClick={() => setUploadMethod('upload')}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center ${
                    uploadMethod === 'upload' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary font-bold' : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <UploadCloud className="w-5 h-5" />
                  <span className="text-xs font-bold">Nahrať zo zariadenia</span>
                </div>
              </div>

              {uploadMethod === 'url' ? (
                <Form.Control
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium"
                />
              ) : (
                <div className="p-4 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 text-center">
                  <Form.Control type="file" accept="image/*" onChange={handleFileSelect} className="mb-2 text-xs" />
                  <div className="text-xs text-neutral-500 font-medium">✨ Optimalizácia do WebP formátu.</div>
                  {selectedFile && imagePreview && (
                    <div className="mt-3">
                      <img src={imagePreview} alt="Preview" className="rounded-xl shadow-xs border max-h-32 object-cover mx-auto" />
                    </div>
                  )}
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-neutral-200 p-6">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 transition-all text-sm"
            >
              {t?.blog?.cancel || 'Zrušiť'}
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-600 transition-all text-sm shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {uploading && <Spinner size="sm" />}
              <span>{uploading ? 'Ukladám...' : (t?.blog?.update || 'Uložiť zmeny')}</span>
            </button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Share Modal */}
      <ShareModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        postId={currentPost?.slug}
        postTitle={currentPost?.title}
      />
    </motion.section>
  );
};

export default Blog;