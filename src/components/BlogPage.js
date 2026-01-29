// BlogPage.js - Samostatná stránka so všetkými článkami + SHARE BUTTON
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Modal, Button, Form, Spinner, Alert, Pagination } from 'react-bootstrap';
import api from '../api/api';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import ShareModal from './ShareModal';
import { ArrowRightCircle, Share, Pencil, Trash, Link45deg, CloudArrowUp } from 'react-bootstrap-icons';


const POSTS_PER_PAGE = 9; // 9 článkov na stránku (3x3 grid)

const BlogPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

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
                headers: { 'Content-Type': 'multipart/form-data' },
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
                if (uploadedUrl) finalImageUrl = uploadedUrl;
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
                if (uploadedUrl) finalImageUrl = uploadedUrl;
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

    const indexOfLastPost = currentPage * POSTS_PER_PAGE;
    const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
    const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800">
                                {t?.blog?.title || 'Blog & Aktuality'}
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Všetky naše články a novinky na jednom mieste
                            </p>
                        </div>
                        {isAdmin && (
                            <Button variant="primary" onClick={handleOpenCreateModal}>
                                + {t?.blog?.newPost || 'Nový článok'}
                            </Button>
                        )}
                    </div>
                    <nav className="text-sm">
                        <Button variant="link" onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-800 p-0">
                            ← Späť na hlavnú stránku
                        </Button>
                    </nav>
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

                <div className="mb-6 text-center">
                    <p className="text-gray-600">
                        Celkom článkov: <strong>{posts.length}</strong>
                        {totalPages > 1 && (
                            <span className="ml-3">
                                Strana {currentPage} z {totalPages}
                            </span>
                        )}
                    </p>
                </div>

                {currentPosts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-500 mb-4">
                            {t?.blog?.noPosts || 'Žiadne články na zobrazenie'}
                        </p>
                        {isAdmin && (
                            <Button variant="outline-primary" onClick={handleOpenCreateModal}>
                                {t?.blog?.createFirstPost || 'Vytvoriť prvý článok'}
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="row">
                            {currentPosts.map(post => (
                                <div key={post.id} className="col-lg-4 col-md-6 mb-4">
                                    <div className="card h-100 shadow-sm hover:shadow-lg transition-shadow">
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
                                                <div className="mt-4 flex justify-center items-center gap-6">

                                                {/* 1. Ikona Čítať viac (Šedá -> Tmavšia + Tieň) */}
                                                <div
                                                    title={t?.blog?.readMore || 'Čítať viac'}
                                                    onClick={() => navigate(`/blog/${post.slug}`)}
                                                    className="cursor-pointer text-gray-400 hover:text-gray-600 hover:drop-shadow-md transition-all duration-300"
                                                >
                                                    <ArrowRightCircle size={28} />
                                                </div>

                                                {/* 2. Ikona Zdieľať (Šedá -> Tmavšia + Tieň) */}
                                                <div
                                                    title="Zdieľať článok"
                                                    onClick={() => handleOpenShareModal(post)}
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

                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-6">
                                <Pagination>
                                    <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                                    <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                                    {[...Array(totalPages)].map((_, index) => (
                                        <Pagination.Item
                                            key={index + 1}
                                            active={index + 1 === currentPage}
                                            onClick={() => paginate(index + 1)}
                                        >
                                            {index + 1}
                                        </Pagination.Item>
                                    ))}
                                    <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                                    <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
                                </Pagination>
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
                                    rows={6}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Obrázok</Form.Label>
                                <div className="mb-2">
                                    <Form.Check
                                        type="radio"
                                        id="page-upload-method-url"
                                        label="📎 Vložiť URL adresu obrázka"
                                        checked={uploadMethod === 'url'}
                                        onChange={() => {
                                            setUploadMethod('url');
                                            setSelectedFile(null);
                                            setImagePreview(null);
                                        }}
                                    />
                                    <Form.Check
                                        type="radio"
                                        id="page-upload-method-upload"
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
                                            ✨ Obrázky sú automaticky optimalizované do WebP formátu.
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
                            🔗 {t?.blog?.share || 'Zdieľať'}
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
        </div>

    );
};

export default BlogPage;