// Blog.js - WITH IMAGE DELETE & THUMBNAIL SUPPORT & SHARE BUTTON
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../api/api';
import { useUser } from '../contexts/UserContext';
import ShareModal from './ShareModal';
import { ArrowRightCircle, Share, Pencil, Trash, PlusCircle, Link45deg, CloudArrowUp } from 'react-bootstrap-icons';

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
      console.log(`📤 Vybraný obrázok: ${file.name} (${fileSizeMB} MB)`);

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
        console.log(`✅ Kompresia: ${response.data.compression} úspora`);
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
          console.log('🗑️ Obrázok zmazaný zo servera');
        }

        await api.put(`/api/admin/blog-posts/${currentPost.id}`, {
          ...formData,
          image_url: null
        });

        setFormData({ ...formData, image_url: '' });
        setImagePreview(null);
        setSelectedFile(null);
        fetchPosts();

        console.log('✅ Obrázok úspešne odstránený');
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
      setFormData({ title: '', perex: '', content: '', image_url: '', label_id: null });
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
    setFormData({ title: '', perex: '', content: '', image_url: '', label_id: null });
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
      image_url: post.image_url || '',
      label_id: post.label_id || null
    });
    setSelectedFile(null);
    setImagePreview(post.image_url);
    setUploadMethod('url');
    setCompressionInfo(null);
    setShowEditModal(true);
  };

  const handleOpenShareModal = (post) => {
    setCurrentPost(post);
    setShowShareModal(true);
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
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="blog-section">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/blog" className="section-title" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>{t?.blog?.title || 'Aktuality & Blog'}</h2>
        </Link>
        {isAdmin && (
          <div
            onClick={handleOpenCreateModal}
            title={t?.blog?.newPost || 'Nový článok'}
            className="cursor-pointer text-secondary-500 hover:text-secondary-800 transition-all duration-300 hover:drop-shadow-md"
          >
            {/* Veľkosť 40, aby to bolo výrazné vedľa nadpisu */}
            <PlusCircle size={40} />
          </div>
        )}
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {compressionInfo && (
        <Alert variant="success" dismissible onClose={() => setCompressionInfo(null)}>
          <strong>🎉 Obrázok úspešne optimalizovaný!</strong>
          <ul className="mb-0 mt-2">
            <li>Pôvodná veľkosť: {compressionInfo.originalSize} MB</li>
            <li>Po kompresii: {compressionInfo.processedSize} KB</li>
            <li>Úspora: {compressionInfo.compression}</li>
          </ul>
        </Alert>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">{t?.blog?.noPosts || 'Žiadne články na zobrazenie'}</p>
          {isAdmin && (
            <Button
              variant="outline-primary"
              onClick={handleOpenCreateModal}
            >
              {t?.blog?.createFirstPost || 'Vytvoriť prvý článok'}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="row">
            {(limit ? posts.slice(0, limit) : posts).map(post => (
              <div key={post.id} className="col-lg-4 col-md-6 mb-4">
                <div className="card h-100 shadow-sm">
                  {post.image_url && (
                    <img
                      src={api.makeImageUrl(getThumbnailUrl(post.image_url))}
                      className="card-img-top"
                      alt={post.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = api.makeImageUrl(post.image_url);
                        e.target.onerror = () => {
                          e.target.src = 'https://picsum.photos/400/200?random=' + post.id;
                        };
                      }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    {/* Label Badge */}
                    {post.label_id && (
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: getLabelById(post.label_id)?.color || '#3b82f6',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          marginBottom: '8px',
                          width: 'fit-content',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                        }}
                      >
                        {getLabelById(post.label_id)?.name || 'Label'}
                      </span>
                    )}
                    <h5 className="card-title">{post.title}</h5>
                    <p className="card-text text-muted">{post.perex}</p>
                    <div className="mt-auto">
                      <small className="text-muted">
                        {formatDate(post.created_at)}
                      </small>
                      <div className="mt-4 flex justify-center items-center gap-6">

                        {/* 1. Ikona Čítať viac (Šedá -> Tmavšia + Tieň) */}
                        <Link
                          to={`/blog/${post.slug}`}
                          title={t?.blog?.readMore || 'Čítať viac'}
                          className="text-gray-400 hover:text-gray-600 hover:drop-shadow-md transition-all duration-300"
                        >
                          <ArrowRightCircle size={28} />
                        </Link>

                        {/* 2. Ikona Zdieľať (Šedá -> Tmavšia + Tieň) */}
                        <div
                          title="Zdieľať článok"
                          onClick={() => {
                            setCurrentPost(post);
                            setShowShareModal(true);
                          }}
                          className="cursor-pointer text-gray-400 hover:text-gray-600 hover:drop-shadow-md transition-all duration-300"
                        >
                          <Share size={26} />
                        </div>

                        {/* 3. Admin nástroje */}
                        {isAdmin && (
                          <>
                            {/* Zvislá čiara (Tailwind verzia) */}
                            <div className="w-px h-6 bg-gray-300 mx-2"></div>

                            {/* Ikona Upraviť (Zelená -> Tmavšia) */}
                            <div
                              title={t?.blog?.edit || 'Upraviť'}
                              onClick={() => handleOpenEditModal(post)}
                              className="cursor-pointer text-green-600 hover:text-green-800 hover:drop-shadow-md transition-all duration-300"
                            >
                              <Pencil size={24} />
                            </div>

                            {/* Ikona Zmazať (Červená -> Tmavšia) */}
                            <div
                              title={t?.blog?.delete || 'Zmazať'}
                              onClick={() => handleDeletePost(post.id)}
                              className="cursor-pointer text-red-600 hover:text-red-800 hover:drop-shadow-md transition-all duration-300"
                            >
                              <Trash size={24} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showViewAll && limit && posts.length > limit && (
            <div className="text-center mt-4">
              <Link
                to="/blog"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                style={{ textDecoration: 'none', display: 'inline-flex' }}
              >
                📚 Pozrieť všetky články ({posts.length})
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </>
      )}

      {/* Create Post Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{t?.blog?.createPost || 'Vytvoriť nový článok'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreatePost}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{t?.blog?.titleLabel || 'Názov'}</Form.Label>
              <Form.Control
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t?.blog?.perexLabel || 'Krátky popis (perex)'}</Form.Label>
              <Form.Control
                required
                as="textarea"
                rows={3}
                value={formData.perex}
                onChange={(e) => setFormData({ ...formData, perex: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t?.blog?.contentLabel || 'Obsah'}</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </Form.Group>
            {/* LABEL SELECTOR */}
            <Form.Group className="mb-3">
              <Form.Label>Kategória článku</Form.Label>
              <Form.Select
                value={formData.label_id || ''}
                onChange={(e) => setFormData({ ...formData, label_id: e.target.value ? parseInt(e.target.value) : null })}
              >
                <option value="">Bez kategórie</option>
                {labels.map(label => (
                  <option key={label.id} value={label.id}>
                    {label.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold mb-3">Obrázok článku</Form.Label>

              {/* Výber metódy - Dizajn dlaždíc */}
              <div className="d-flex gap-3 mb-3">

                {/* 1. Karta: URL Adresa */}
                <div
                  onClick={() => {
                    setUploadMethod('url');
                    setSelectedFile(null);
                  }}
                  className={`flex-1 p-3 border rounded cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2
        ${uploadMethod === 'url'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                >
                  <Link45deg size={24} />
                  <span className="text-sm font-medium">Vložiť URL odkazu</span>
                </div>

                {/* 2. Karta: Upload zo zariadenia */}
                <div
                  onClick={() => {
                    setUploadMethod('upload');
                    setFormData({ ...formData, image_url: '' });
                  }}
                  className={`flex-1 p-3 border rounded cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2
        ${uploadMethod === 'upload'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                >
                  <CloudArrowUp size={24} />
                  <span className="text-sm font-medium">Nahrať zo zariadenia</span>
                </div>
              </div>

              {/* Obsah podľa výberu */}
              {uploadMethod === 'url' ? (
                <div className="animate-fadeIn">
                  <Form.Control
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://priklad.sk/obrazok.jpg"
                    className="bg-gray-50 border-gray-300 focus:bg-white transition-colors"
                  />
                  <Form.Text className="text-muted">
                    Vložte priamy odkaz na obrázok z internetu.
                  </Form.Text>
                </div>
              ) : (
                <div className="animate-fadeIn p-3 bg-gray-50 rounded border border-dashed border-gray-300">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="mb-2"
                  />

                  <div className="text-xs text-gray-500 mt-2">
                    ✨ Obrázky sú automaticky optimalizované do WebP formátu.
                  </div>

                  {/* Preview obrázka */}
                  {imagePreview && (
                    <div className="mt-3 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded shadow-sm border"
                        style={{ maxHeight: '150px', objectFit: 'cover' }}
                      />
                      {selectedFile && (
                        <div className="mt-1 text-xs font-mono text-gray-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          {selectedFile.size > 1024 * 1024 && <span className="text-green-600 ml-1">→ Auto-kompresia</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              {t?.blog?.cancel || 'Zrušiť'}
            </Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Optimalizujem a nahrávam...
                </>
              ) : (
                t?.blog?.create || 'Vytvoriť článok'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Read-Only Modal */}
      <Modal show={showReadModal} onHide={() => setShowReadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{currentPost?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentPost?.image_url && (
            <img
              src={api.makeImageUrl(currentPost.image_url)}
              alt={currentPost.title}
              className="img-fluid mb-4 rounded"
              onError={(e) => {
                e.target.src = 'https://picsum.photos/800/400?random=' + currentPost.id;
              }}
            />
          )}
          <div className="text-muted mb-4">
            <small>{formatDate(currentPost?.created_at)}</small>
          </div>
          <div className="blog-content"
            style={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              maxWidth: '100%',
              overflowX: 'hidden'
            }}
          >
            {currentPost?.content}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => handleOpenShareModal(currentPost)}
          >
            🔗 Zdieľať
          </Button>
          <Button variant="secondary" onClick={() => setShowReadModal(false)}>
            {t?.blog?.close || 'Zavrieť'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Post Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{t?.blog?.editPost || 'Upraviť článok'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdatePost}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{t?.blog?.titleLabel || 'Názov'}</Form.Label>
              <Form.Control
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t?.blog?.perexLabel || 'Krátky popis (perex)'}</Form.Label>
              <Form.Control
                required
                as="textarea"
                rows={3}
                value={formData.perex}
                onChange={(e) => setFormData({ ...formData, perex: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t?.blog?.contentLabel || 'Obsah'}</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </Form.Group>
            {/* LABEL SELECTOR */}
            <Form.Group className="mb-3">
              <Form.Label>Kategória články</Form.Label>
              <Form.Select
                value={formData.label_id || ''}
                onChange={(e) => setFormData({ ...formData, label_id: e.target.value ? parseInt(e.target.value) : null })}
              >
                <option value="">Bez kategórie</option>
                {labels.map(label => (
                  <option key={label.id} value={label.id}>
                    {label.name}
                  </option>
                ))}
              </Form.Select>
              {formData.label_id && (
                <div className="mt-2">
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: getLabelById(parseInt(formData.label_id))?.color || '#3b82f6',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                    }}
                  >
                    {getLabelById(parseInt(formData.label_id))?.name}
                  </span>
                </div>
              )}
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold mb-3">Obrázok článku</Form.Label>

              {/* 1. Zobrazenie AKTUÁLNEHO obrázka (ak existuje) */}
              {formData.image_url && (
                <div className="mb-4 p-3 border rounded bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Náhľad */}
                    <img
                      src={api.makeImageUrl(formData.image_url)}
                      alt="Current"
                      className="w-16 h-16 rounded object-cover border"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    {/* Info */}
                    <div>
                      <p className="mb-0 text-sm font-bold text-gray-700">Aktuálny obrázok</p>
                      <p className="mb-0 text-xs text-gray-500 truncate max-w-[200px]">
                        {formData.image_url}
                      </p>
                    </div>
                  </div>

                  {/* Tlačidlo Zmazať (Ikona) */}
                  <div
                    onClick={handleDeleteImage}
                    title="Odstrániť obrázok"
                    className="cursor-pointer p-2 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-full transition-all duration-200"
                  >
                    <Trash size={20} />
                  </div>
                </div>
              )}

              {/* 2. Výber metódy pre NOVÝ obrázok (Dlaždice) */}
              <div className="d-flex gap-3 mb-3">
                {/* Karta: URL */}
                <div
                  onClick={() => {
                    setUploadMethod('url');
                    setSelectedFile(null);
                  }}
                  className={`flex-1 p-3 border rounded cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2
        ${uploadMethod === 'url'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                >
                  <Link45deg size={24} />
                  <span className="text-sm font-medium">Vložiť URL odkazu</span>
                </div>

                {/* Karta: Upload */}
                <div
                  onClick={() => {
                    setUploadMethod('upload');
                  }}
                  className={`flex-1 p-3 border rounded cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2
        ${uploadMethod === 'upload'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                >
                  <CloudArrowUp size={24} />
                  <span className="text-sm font-medium">Nahrať zo zariadenia</span>
                </div>
              </div>

              {/* 3. Vstupy podľa výberu */}
              {uploadMethod === 'url' ? (
                <div className="animate-fadeIn">
                  <Form.Control
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="bg-gray-50 border-gray-300 focus:bg-white transition-colors"
                  />
                </div>
              ) : (
                <div className="animate-fadeIn p-3 bg-gray-50 rounded border border-dashed border-gray-300">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="mb-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    ✨ Obrázky sú automaticky optimalizované do WebP.
                  </div>

                  {/* Preview NOVÉHO súboru */}
                  {selectedFile && imagePreview && (
                    <div className="mt-3 relative inline-block">
                      <p className="text-xs font-bold text-green-600 mb-1">Nový výber:</p>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded shadow-sm border"
                        style={{ maxHeight: '150px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              {t?.blog?.cancel || 'Zrušiť'}
            </Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Optimalizujem a nahrávam...
                </>
              ) : (
                t?.blog?.update || 'Uložiť zmeny'
              )}
            </Button>
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
    </div>
  );
};

export default Blog;