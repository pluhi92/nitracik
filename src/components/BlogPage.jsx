// BlogPage.jsx - Samostatná stránka so všetkými článkami + LABELS + FILTER
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Modal, Button, Form, Spinner, Alert, Pagination } from 'react-bootstrap';
import api from '../api/api';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';
import ShareModal from './ShareModal';
import { ArrowRightCircle, Share, Pencil, Trash, Link45deg, CloudArrowUp, Tag } from 'react-bootstrap-icons';
import { HexColorPicker } from 'react-colorful';

const POSTS_PER_PAGE = 9; // 9 článkov na stránku (3x3 grid)

const BlogPage = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // LABEL states
    const [labels, setLabels] = useState([]);
    const [selectedFilterLabel, setSelectedFilterLabel] = useState(null);
    const [showLabelManager, setShowLabelManager] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#3b82f6');
    const [isCreatingNewLabel, setIsCreatingNewLabel] = useState(false);
    const [editingLabelId, setEditingLabelId] = useState(null);
    const [editingLabelColor, setEditingLabelColor] = useState('');

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

    const fetchLabels = useCallback(async () => {
        try {
            const response = await api.get('/api/blog-labels');
            setLabels(response.data);
        } catch (error) {
            console.error('Error fetching labels:', error);
        }
    }, []);

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/blog-posts');
            setPosts(response.data);
            setFilteredPosts(response.data);
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            setError(t?.blog?.fetchError || 'Failed to load blog posts');
        } finally {
            setLoading(false);
        }
    }, [t?.blog?.fetchError]);

    useEffect(() => {
        fetchPosts();
        fetchLabels();
        checkAdminStatus();
    }, [fetchPosts, fetchLabels, checkAdminStatus]);

    // Filter posts by label
    useEffect(() => {
        if (selectedFilterLabel === null) {
            setFilteredPosts(posts);
        } else {
            setFilteredPosts(posts.filter(post => post.label_id === selectedFilterLabel));
        }
        setCurrentPage(1); // Reset to first page when filter changes
    }, [selectedFilterLabel, posts]);

    const handleCreateLabel = async () => {
        if (!newLabelName.trim()) {
            setError('Prosím zadajte názov labelu');
            return;
        }

        try {
            await api.post('/api/admin/blog-labels', {
                name: newLabelName.trim(),
                color: newLabelColor
            });
            setNewLabelName('');
            setNewLabelColor('#3b82f6');
            setIsCreatingNewLabel(false);
            fetchLabels();
        } catch (error) {
            console.error('Error creating label:', error);
            setError('Nepodarilo sa vytvoriť label');
        }
    };

    const handleDeleteLabel = async (labelId) => {
        if (window.confirm('Naozaj chcete zmazať tento label? Články s týmto labelom stratia priradenie.')) {
            try {
                await api.delete(`/api/admin/blog-labels/${labelId}`);
                fetchLabels();
                fetchPosts();
            } catch (error) {
                console.error('Error deleting label:', error);
                setError('Nepodarilo sa zmazať label');
            }
        }
    };

    const handleUpdateLabelColor = async (labelId, newColor) => {
        const label = labels.find(l => l.id === labelId);
        if (!label) return;

        try {
            await api.put(`/api/admin/blog-labels/${labelId}`, {
                name: label.name,
                color: newColor
            });
            setEditingLabelId(null);
            setEditingLabelColor('');
            fetchLabels();
        } catch (error) {
            console.error('Error updating label color:', error);
            setError('Nepodarilo sa aktualizovať farbu labelu');
        }
    };

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
            setFormData({ title: '', perex: '', content: '', image_url: '', label_id: null });
            setSelectedFile(null);
            setImagePreview(null);
            setCompressionInfo(null);
            fetchPosts();
        } catch (error) {
            console.error('Error creating blog post:', error);
            setError(t?.blog?.createError || 'Failed to create blog post');
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
                image_url: finalImageUrl
            });
            setShowEditModal(false);
            setCurrentPost(null);
            setFormData({ title: '', perex: '', content: '', source_url: '', image_url: '', label_id: null });
            setSelectedFile(null);
            setImagePreview(null);
            setCompressionInfo(null);
            fetchPosts();
        } catch (error) {
            console.error('Error updating blog post:', error);
            setError(t?.blog?.updateError || 'Failed to update blog post');
        }
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm(t?.blog?.deleteConfirm || 'Are you sure you want to delete this post?')) {
            try {
                await api.delete(`/api/admin/blog-posts/${postId}`);
                fetchPosts();
            } catch (error) {
                console.error('Error deleting blog post:', error);
                setError(t?.blog?.deleteError || 'Failed to delete blog post');
            }
        }
    };

    const openEditModal = (post) => {
        setCurrentPost(post);
        setFormData({
            title: post.title,
            perex: post.perex,
            content: post.content || '',
            source_url: post.source_url || '',
            image_url: post.image_url || '',
            label_id: post.label_id || null
        });
        setImagePreview(null);
        setSelectedFile(null);
        setUploadMethod('url');
        setCompressionInfo(null);
        setShowEditModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('sk-SK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getLabelById = (labelId) => {
        return labels.find(label => label.id === labelId);
    };

    // Pagination
    const indexOfLastPost = currentPage * POSTS_PER_PAGE;
    const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
    const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">{t?.blog?.loading || 'Loading...'}</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="container mx-auto px-4">
                {/* Back Button */}
                <div className="mb-4">
                    <Link to="/about">
                        <Button variant="outline-secondary">
                            ← Späť
                        </Button>
                    </Link>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-3">
                        {t?.blog?.title || 'Novinky & blog'}
                    </h1>
                    <p className="text-gray-600">
                        {t?.blog?.subtitle || 'Najnovšie články a novinky'}
                    </p>
                </div>

                {error && (
                    <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-4">
                        {error}
                    </Alert>
                )}

                {/* FILTER SECTION */}
                <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0 d-flex align-items-center gap-2">
                            <Tag size={20} />
                            Filter podľa kategórie
                        </h5>
                        {isAdmin && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setShowLabelManager(true)}
                            >
                                Spravovať kategórie
                            </Button>
                        )}
                    </div>
                    
                    <div className="d-flex flex-wrap gap-2">
                        {/* All posts button */}
                        <Button
                            variant={selectedFilterLabel === null ? 'primary' : 'outline-secondary'}
                            size="sm"
                            onClick={() => setSelectedFilterLabel(null)}
                            className="d-flex align-items-center gap-1"
                        >
                            Všetky ({posts.length})
                        </Button>

                        {/* Label filter buttons */}
                        {labels.map(label => {
                            const count = posts.filter(p => p.label_id === label.id).length;
                            return (
                                <Button
                                    key={label.id}
                                    variant={selectedFilterLabel === label.id ? 'primary' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => setSelectedFilterLabel(label.id)}
                                    style={{
                                        backgroundColor: selectedFilterLabel === label.id ? label.color : 'transparent',
                                        borderColor: label.color,
                                        color: selectedFilterLabel === label.id ? '#fff' : label.color
                                    }}
                                    className="d-flex align-items-center gap-1"
                                >
                                    {label.name} ({count})
                                </Button>
                            );
                        })}
                    </div>

                    {selectedFilterLabel !== null && (
                        <div className="mt-3 text-sm text-gray-600">
                            Zobrazených: {filteredPosts.length} {filteredPosts.length === 1 ? 'článok' : filteredPosts.length < 5 ? 'články' : 'článkov'}
                        </div>
                    )}
                </div>

                {/* Admin Create Button */}
                {isAdmin && (
                    <div className="text-end mb-4">
                        <Button variant="success" onClick={() => {
                            setFormData({ title: '', perex: '', content: '', source_url: '', image_url: '', label_id: null });
                            setUploadMethod('url');
                            setSelectedFile(null);
                            setImagePreview(null);
                            setCompressionInfo(null);
                            setShowCreateModal(true);
                        }}>
                            + {t?.blog?.createNew || 'Vytvoriť nový článok'}
                        </Button>
                    </div>
                )}

                {/* Blog Posts Grid */}
                {currentPosts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                            {selectedFilterLabel !== null 
                                ? 'V tejto kategórii zatiaľ nie sú žiadne články'
                                : t?.blog?.noPosts || 'Zatiaľ nie sú žiadne články'}
                        </p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {currentPosts.map((post) => {
                            return (
                                <div key={post.id} className="col-12 col-md-6 col-lg-4">
                                    <div className="card h-100 border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                                        {/* Image */}
                                        {post.image_url && (
                                            <img
                                                src={api.makeImageUrl(post.image_url)}
                                                className="card-img-top"
                                                alt={post.title}
                                                style={{ height: '200px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.src = 'https://picsum.photos/400/200?random=' + post.id;
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

                                            {/* Title */}
                                            <h5 className="card-title mb-2">{post.title}</h5>

                                            {/* Perex */}
                                            <p className="card-text text-muted small flex-grow-1">
                                                {post.perex?.substring(0, 120)}{post.perex?.length > 120 ? '...' : ''}
                                            </p>

                                            {/* Date */}
                                            <div className="text-muted small mb-3">
                                                📅 {formatDate(post.created_at)}
                                            </div>

                                            {/* Zdroj */}
                                            {post.source_url && (
                                                <div className="text-muted small mb-3">
                                                    <strong>Zdroj:</strong>{' '}
                                                    <a 
                                                        href={post.source_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-primary text-decoration-none hover:underline"
                                                    >
                                                        {post.source_url.length > 40 ? post.source_url.substring(0, 40) + '...' : post.source_url}
                                                    </a>
                                                </div>
                                            )}

                                            {/* Actions */}
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
                                                    onClick={() => { setCurrentPost(post); setShowShareModal(true); }}
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
                                                            onClick={() => openEditModal(post)}
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
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-5">
                        <Pagination>
                            <Pagination.First
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                            />
                            <Pagination.Prev
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            />

                            {[...Array(totalPages)].map((_, index) => {
                                const pageNumber = index + 1;
                                if (
                                    pageNumber === 1 ||
                                    pageNumber === totalPages ||
                                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                ) {
                                    return (
                                        <Pagination.Item
                                            key={pageNumber}
                                            active={pageNumber === currentPage}
                                            onClick={() => handlePageChange(pageNumber)}
                                        >
                                            {pageNumber}
                                        </Pagination.Item>
                                    );
                                } else if (
                                    pageNumber === currentPage - 2 ||
                                    pageNumber === currentPage + 2
                                ) {
                                    return <Pagination.Ellipsis key={pageNumber} disabled />;
                                }
                                return null;
                            })}

                            <Pagination.Next
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            />
                            <Pagination.Last
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                            />
                        </Pagination>
                    </div>
                )}

                {/* LABEL MANAGER MODAL */}
                <Modal show={showLabelManager} onHide={() => setShowLabelManager(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Správa kategórií</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {/* Create new label section */}
                        <div className="mb-4 p-3 bg-light rounded">
                            <h6 className="mb-3">Vytvoriť novú kategóriu</h6>
                            {!isCreatingNewLabel ? (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setIsCreatingNewLabel(true)}
                                >
                                    + Pridať kategóriu
                                </Button>
                            ) : (
                                <div>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Názov kategórie</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={newLabelName}
                                            onChange={(e) => setNewLabelName(e.target.value)}
                                            placeholder="napr. Novinky, Blog, Dôležité..."
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Farba kategórie</Form.Label>
                                        <div className="d-flex align-items-center gap-3">
                                            <HexColorPicker
                                                color={newLabelColor}
                                                onChange={setNewLabelColor}
                                                style={{ width: '200px', height: '150px' }}
                                            />
                                            <div>
                                                <div
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        backgroundColor: newLabelColor,
                                                        border: '2px solid #ddd',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Form.Control
                                                    type="text"
                                                    value={newLabelColor}
                                                    onChange={(e) => setNewLabelColor(e.target.value)}
                                                    className="mt-2"
                                                    style={{ width: '80px' }}
                                                />
                                            </div>
                                        </div>
                                    </Form.Group>

                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={handleCreateLabel}
                                        >
                                            Uložiť kategóriu
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setIsCreatingNewLabel(false);
                                                setNewLabelName('');
                                                setNewLabelColor('#3b82f6');
                                            }}
                                        >
                                            Zrušiť
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Existing labels list */}
                        <h6 className="mb-3">Existujúce kategórie</h6>
                        {labels.length === 0 ? (
                            <p className="text-muted">Zatiaľ nie sú vytvorené žiadne kategórie</p>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {labels.map(label => {
                                    const count = posts.filter(p => p.label_id === label.id).length;
                                    const isEditing = editingLabelId === label.id;

                                    return (
                                        <div
                                            key={label.id}
                                            className={`d-flex align-items-${isEditing ? 'start' : 'center'} justify-content-between p-3 border rounded`}
                                        >
                                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                                                <div
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        backgroundColor: label.color,
                                                        borderRadius: '6px',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => {
                                                        setEditingLabelId(label.id);
                                                        setEditingLabelColor(label.color);
                                                    }}
                                                    title="Kliknite na farbu na zmenu"
                                                />
                                                <div>
                                                    <strong>{label.name}</strong>
                                                    <div className="text-muted small">
                                                        {count} {count === 1 ? 'článok' : count < 5 ? 'články' : 'článkov'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Edit color section */}
                                            {isEditing && (
                                                <div className="ms-3 d-flex align-items-end gap-2">
                                                    <div>
                                                        <small className="d-block mb-2">Zmeniť farbu:</small>
                                                        <div className="d-flex gap-2 align-items-end">
                                                            <HexColorPicker
                                                                color={editingLabelColor}
                                                                onChange={setEditingLabelColor}
                                                                style={{ width: '150px', height: '120px' }}
                                                            />
                                                            <div>
                                                                <div
                                                                    style={{
                                                                        width: '50px',
                                                                        height: '50px',
                                                                        backgroundColor: editingLabelColor,
                                                                        border: '2px solid #ddd',
                                                                        borderRadius: '6px',
                                                                        marginBottom: '8px'
                                                                    }}
                                                                />
                                                                <Form.Control
                                                                    type="text"
                                                                    value={editingLabelColor}
                                                                    onChange={(e) => setEditingLabelColor(e.target.value)}
                                                                    style={{ width: '70px', fontSize: '12px' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => handleUpdateLabelColor(label.id, editingLabelColor)}
                                                        >
                                                            Uložiť
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingLabelId(null);
                                                                setEditingLabelColor('');
                                                            }}
                                                        >
                                                            Zrušiť
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Delete button */}
                                            {!isEditing && (
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteLabel(label.id)}
                                                >
                                                    <Trash size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowLabelManager(false)}>
                            Zavrieť
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* CREATE POST MODAL */}
                <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                    <Form onSubmit={handleCreatePost}>
                        <Modal.Header closeButton>
                            <Modal.Title>{t?.blog?.createNew || 'Vytvoriť nový článok'}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>{t?.blog?.titleLabel || 'Názov'}</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
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
                                <Form.Label>Zdroj (URL)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.source_url}
                                    onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                                    placeholder="https://priklad.sk"
                                />
                                <Form.Text className="text-muted">
                                    Voliteľné: URL zdroja článku. Ak je vyplnené, zobrazí sa ako odkaz na konci článku.
                                </Form.Text>
                            </Form.Group>

                            {/* LABEL SELECTOR */}
                            <Form.Group className="mb-3">
                                <Form.Label className="d-flex align-items-center gap-2">
                                    <Tag size={18} />
                                    Kategória článku
                                </Form.Label>
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
                                                backgroundColor: getLabelById(formData.label_id)?.color || '#3b82f6',
                                                color: '#fff',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                            }}
                                        >
                                            {getLabelById(formData.label_id)?.name}
                                        </span>
                                    </div>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold mb-3">Obrázok článku</Form.Label>

                                <div className="d-flex gap-3 mb-3">
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

                                        {selectedFile && imagePreview && (
                                            <div className="mt-3 relative inline-block">
                                                <p className="text-xs font-bold text-green-600 mb-1">Náhľad:</p>
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="rounded shadow-sm border"
                                                    style={{ maxHeight: '150px', objectFit: 'cover' }}
                                                />
                                            </div>
                                        )}

                                        {compressionInfo && (
                                            <Alert variant="success" className="mt-3 py-2">
                                                <small>
                                                    ✅ Optimalizované: {compressionInfo.originalSize} MB → {compressionInfo.processedSize} KB
                                                    ({compressionInfo.compression} redukcia)
                                                </small>
                                            </Alert>
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

                {/* EDIT POST MODAL */}
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                    <Form onSubmit={handleUpdatePost}>
                        <Modal.Header closeButton>
                            <Modal.Title>{t?.blog?.edit || 'Upraviť článok'}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>{t?.blog?.titleLabel || 'Názov'}</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
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
                                <Form.Label>Zdroj (URL)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.source_url}
                                    onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                                    placeholder="https://priklad.sk"
                                />
                                <Form.Text className="text-muted">
                                    Voliteľné: URL zdroja článku. Ak je vyplnené, zobrazí sa ako odkaz na konci článku.
                                </Form.Text>
                            </Form.Group>

                            {/* LABEL SELECTOR */}
                            <Form.Group className="mb-3">
                                <Form.Label className="d-flex align-items-center gap-2">
                                    <Tag size={18} />
                                    Kategória článku
                                </Form.Label>
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
                                                backgroundColor: getLabelById(formData.label_id)?.color || '#3b82f6',
                                                color: '#fff',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                            }}
                                        >
                                            {getLabelById(formData.label_id)?.name}
                                        </span>
                                    </div>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold mb-3">Obrázok článku</Form.Label>

                                {formData.image_url && (
                                    <div className="mb-4 p-3 border rounded bg-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={api.makeImageUrl(formData.image_url)}
                                                alt="Current"
                                                className="w-16 h-16 rounded object-cover border"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            <div>
                                                <p className="mb-0 text-sm font-bold text-gray-700">Aktuálny obrázok</p>
                                                <p className="mb-0 text-xs text-gray-500 truncate max-w-[200px]">
                                                    {formData.image_url}
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={handleDeleteImage}
                                            title="Odstrániť obrázok"
                                            className="cursor-pointer p-2 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-full transition-all duration-200"
                                        >
                                            <Trash size={20} />
                                        </div>
                                    </div>
                                )}

                                <div className="d-flex gap-3 mb-3">
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