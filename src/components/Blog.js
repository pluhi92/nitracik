// Blog.js - WITH IMAGE DELETE & THUMBNAIL SUPPORT & SHARE BUTTON
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../api/api';
import { useUser } from '../contexts/UserContext';
import ShareModal from './ShareModal';

const Blog = ({ limit = null, showViewAll = true }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
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
    image_url: ''
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
      if (response.data.email === process.env.REACT_APP_ADMIN_EMAIL) {
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
      console.log('📥 Loaded posts:', response.data);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setError(t?.blog?.fetchError || 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, [t?.blog?.fetchError]);

  useEffect(() => {
    fetchPosts();
    checkAdminStatus();
  }, [fetchPosts, checkAdminStatus]);

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
      setFormData({ title: '', perex: '', content: '', image_url: '' });
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

  const handleOpenCreateModal = () => {
    setFormData({ title: '', perex: '', content: '', image_url: '' });
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
      image_url: post.image_url || ''
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
        <h2 className="section-title">{t?.blog?.title || 'Blog & Aktuality'}</h2>
        {isAdmin && (
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
          >
            + {t?.blog?.newPost || 'Nový článok'}
          </Button>
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
                    <h5 className="card-title">{post.title}</h5>
                    <p className="card-text text-muted">{post.perex}</p>
                    <div className="mt-auto">
                      <small className="text-muted">
                        {formatDate(post.created_at)}
                      </small>
                      <div className="mt-2 d-flex flex-wrap gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setCurrentPost(post);
                            setShowReadModal(true);
                          }}
                        >
                          {t?.blog?.readMore || 'Čítať viac'}
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleOpenShareModal(post)}
                          title="Zdieľať článok"
                        >
                          🔗
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleOpenEditModal(post)}
                            >
                              {t?.blog?.edit || 'Upraviť'}
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              {t?.blog?.delete || 'Zmazať'}
                            </Button>
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

            <Form.Group className="mb-3">
              <Form.Label>Obrázok</Form.Label>
              <div className="mb-2">
                <Form.Check
                  type="radio"
                  id="create-upload-method-url"
                  label="📎 Vložiť URL adresu obrázka"
                  checked={uploadMethod === 'url'}
                  onChange={() => {
                    setUploadMethod('url');
                    setSelectedFile(null);
                  }}
                />
                <Form.Check
                  type="radio"
                  id="create-upload-method-upload"
                  label="📱 Nahrať obrázok zo zariadenia"
                  checked={uploadMethod === 'upload'}
                  onChange={() => {
                    setUploadMethod('upload');
                    setFormData({ ...formData, image_url: '' });
                  }}
                />
              </div>

              {uploadMethod === 'url' ? (
                <Form.Control
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              ) : (
                <div>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  <Form.Text className="text-muted">
                    ✨ Obrázky sú automaticky optimalizované do WebP formátu. Nahrajte ľubovoľne veľkú fotku - náš systém ju bezpečne spracuje!
                  </Form.Text>

                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                      />
                      {selectedFile && (
                        <p className="text-muted small mt-2">
                          📦 Veľkosť: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          {selectedFile.size > 1024 * 1024 && (
                            <span className="text-success ms-2">
                              → Bude automaticky skomprimovaný ✓
                            </span>
                          )}
                        </p>
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

            <Form.Group className="mb-3">
              <Form.Label>Obrázok</Form.Label>

              {formData.image_url && (
                <div className="mb-3 p-3 border rounded bg-light">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <img
                        src={api.makeImageUrl(formData.image_url)}
                        alt="Current"
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="ms-3">
                        <p className="mb-0 text-muted small">Aktuálny obrázok:</p>
                        <p className="mb-0 small text-truncate" style={{ maxWidth: '200px' }}>
                          {formData.image_url}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleDeleteImage}
                      title="Odstrániť obrázok"
                    >
                      🗑️ Zmazať
                    </Button>
                  </div>
                </div>
              )}

              <div className="mb-2">
                <Form.Check
                  type="radio"
                  id="edit-upload-method-url"
                  label="📎 Vložiť URL adresu obrázka"
                  checked={uploadMethod === 'url'}
                  onChange={() => {
                    setUploadMethod('url');
                    setSelectedFile(null);
                  }}
                />
                <Form.Check
                  type="radio"
                  id="edit-upload-method-upload"
                  label="📱 Nahrať nový obrázok zo zariadenia"
                  checked={uploadMethod === 'upload'}
                  onChange={() => {
                    setUploadMethod('upload');
                  }}
                />
              </div>

              {uploadMethod === 'url' ? (
                <Form.Control
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              ) : (
                <div>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  <Form.Text className="text-muted">
                    ✨ Obrázky sú automaticky optimalizované do WebP formátu
                  </Form.Text>

                  {selectedFile && imagePreview && (
                    <div className="mt-3">
                      <p className="text-muted small">Nový obrázok (preview):</p>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
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
        postId={currentPost?.id}
        postTitle={currentPost?.title}
      />
    </div>
  );
};

export default Blog;