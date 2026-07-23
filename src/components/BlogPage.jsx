import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Modal, Button, Form, Spinner, Alert, Pagination } from 'react-bootstrap';
import api from '../api/api';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';
import ShareModal from './ShareModal';
import { HexColorPicker } from 'react-colorful';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  ArrowRight, 
  Share2, 
  Pencil, 
  Trash2, 
  Link as LinkIcon, 
  UploadCloud, 
  Tag, 
  Calendar, 
  ArrowLeft,
  Settings,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const POSTS_PER_PAGE = 9;

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

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

    useEffect(() => {
        if (selectedFilterLabel === null) {
            setFilteredPosts(posts);
        } else {
            setFilteredPosts(posts.filter(post => post.label_id === selectedFilterLabel));
        }
        setCurrentPage(1);
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
            <div className="min-h-[60vh] flex items-center justify-center">
                <Spinner animation="border" className="text-primary" />
            </div>
        );
    }

    return (
        <motion.section 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="py-12 md:py-16 container-custom max-w-6xl mx-auto px-3 sm:px-6"
        >
            {/* Back Button */}
            <div className="mb-8">
                <Link to="/about" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-200 bg-white text-foreground font-bold hover:bg-neutral-50 transition-all text-sm no-underline shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Späť</span>
                </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
                    {t?.blog?.title || 'Novinky & blog'}
                </h1>
                <p className="text-neutral-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                    {t?.blog?.subtitle || 'Najnovšie články a novinky'}
                </p>
            </div>

            {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible className="rounded-2xl border-red-200 bg-red-50 text-red-800 font-medium mb-6">
                    {error}
                </Alert>
            )}

            {/* FILTER SECTION */}
            <div className="mb-10 bg-white border border-neutral-200 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2 m-0">
                        <Tag className="w-5 h-5 text-primary" />
                        <span>Filter podľa kategórie</span>
                    </h3>
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => setShowLabelManager(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 bg-neutral-50 text-foreground font-bold hover:bg-neutral-100 transition-all text-xs"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Spravovať kategórie</span>
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                    <button
                        type="button"
                        onClick={() => setSelectedFilterLabel(null)}
                        className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                            selectedFilterLabel === null
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                    >
                        Všetky ({posts.length})
                    </button>

                    {labels.map(label => {
                        const count = posts.filter(p => p.label_id === label.id).length;
                        const isSelected = selectedFilterLabel === label.id;
                        return (
                            <button
                                key={label.id}
                                type="button"
                                onClick={() => setSelectedFilterLabel(label.id)}
                                style={{
                                    backgroundColor: isSelected ? label.color : 'transparent',
                                    borderColor: label.color,
                                    color: isSelected ? '#fff' : label.color
                                }}
                                className="px-5 py-2 rounded-full text-xs font-bold border transition-all shadow-2xs"
                            >
                                {label.name} ({count})
                            </button>
                        );
                    })}
                </div>

                {selectedFilterLabel !== null && (
                    <div className="mt-4 text-xs font-bold text-neutral-400">
                        Zobrazených: {filteredPosts.length} {filteredPosts.length === 1 ? 'článok' : filteredPosts.length < 5 ? 'články' : 'článkov'}
                    </div>
                )}
            </div>

            {/* Admin Create Button */}
            {isAdmin && (
                <div className="flex justify-end mb-8">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({ title: '', perex: '', content: '', source_url: '', image_url: '', label_id: null });
                            setUploadMethod('url');
                            setSelectedFile(null);
                            setImagePreview(null);
                            setCompressionInfo(null);
                            setShowCreateModal(true);
                        }}
                        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold text-sm shadow-sm hover:bg-primary-600 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{t?.blog?.createNew || 'Vytvoriť nový článok'}</span>
                    </button>
                </div>
            )}

            {/* Blog Posts Grid */}
            {currentPosts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[2rem] border border-neutral-200 shadow-sm">
                    <p className="text-neutral-500 font-medium text-base">
                        {selectedFilterLabel !== null 
                            ? 'V tejto kategórii zatiaľ nie sú žiadne články'
                            : t?.blog?.noPosts || 'Zatiaľ nie sú žiadne články'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
                    {currentPosts.map((post) => {
                        return (
                            <motion.div 
                                key={post.id} 
                                className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group"
                                whileHover={{ y: -4 }}
                            >
                                {post.image_url && (
                                    <div className="h-48 overflow-hidden bg-neutral-100 relative">
                                        <img
                                            src={api.makeImageUrl(post.image_url)}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            alt={post.title}
                                            onError={(e) => {
                                                e.target.src = 'https://picsum.photos/400/200?random=' + post.id;
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="p-3 sm:p-8 flex flex-col flex-grow">
                                    {post.label_id && (
                                        <span
                                            className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-3 w-fit shadow-2xs"
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

                                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 mb-4">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{formatDate(post.created_at)}</span>
                                    </div>

                                    {post.source_url && (
                                        <div className="text-xs text-neutral-500 mb-6 truncate">
                                            <strong>Zdroj:</strong>{' '}
                                            <a 
                                                href={post.source_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-primary font-bold hover:underline"
                                            >
                                                {post.source_url.length > 35 ? post.source_url.substring(0, 35) + '...' : post.source_url}
                                            </a>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-6 border-t border-neutral-100 flex items-center justify-center gap-2">
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
                                            onClick={() => { setCurrentPost(post); setShowShareModal(true); }}
                                            className="w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>

                                        {isAdmin && (
                                            <>
                                                <button
                                                    type="button"
                                                    title={t?.blog?.edit || 'Upraviť'}
                                                    onClick={() => openEditModal(post)}
                                                    className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    title={t?.blog?.delete || 'Zmazať'}
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="w-9 h-9 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 hover:bg-red-100 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-12">
                    <Pagination className="custom-pagination gap-1">
                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />

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
                                        className={pageNumber === currentPage ? 'bg-primary text-white border-primary rounded-xl' : ''}
                                    >
                                        {pageNumber}
                                    </Pagination.Item>
                                );
                            } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                return <Pagination.Ellipsis key={pageNumber} disabled />;
                            }
                            return null;
                        })}

                        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                </div>
            )}

            {/* LABEL MANAGER MODAL */}
            <Modal show={showLabelManager} onHide={() => setShowLabelManager(false)} size="lg" centered>
                <Modal.Header closeButton className="border-neutral-200">
                    <Modal.Title className="font-extrabold text-xl text-foreground">Správa kategórií</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-6 space-y-6">
                    <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200/60">
                        <h6 className="font-extrabold text-foreground mb-4 text-sm uppercase tracking-wider">Vytvoriť novú kategóriu</h6>
                        {!isCreatingNewLabel ? (
                            <button
                                type="button"
                                onClick={() => setIsCreatingNewLabel(true)}
                                className="px-5 py-2.5 rounded-full bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-600 transition-all"
                            >
                                + Pridať kategóriu
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <Form.Group>
                                    <Form.Label className="font-bold text-xs text-neutral-700 mb-1">Názov kategórie</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newLabelName}
                                        onChange={(e) => setNewLabelName(e.target.value)}
                                        placeholder="napr. Novinky, Blog, Dôležité..."
                                        className="rounded-xl border-neutral-200 py-2.5 text-sm"
                                    />
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label className="font-bold text-xs text-neutral-700 mb-2">Farba kategórie</Form.Label>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <HexColorPicker color={newLabelColor} onChange={setNewLabelColor} style={{ width: '180px', height: '120px' }} />
                                        <div className="flex items-center gap-3">
                                            <div style={{ width: '50px', height: '50px', backgroundColor: newLabelColor, border: '2px solid #e5e7eb', borderRadius: '12px' }} />
                                            <Form.Control
                                                type="text"
                                                value={newLabelColor}
                                                onChange={(e) => setNewLabelColor(e.target.value)}
                                                className="rounded-xl border-neutral-200 text-sm font-mono w-24"
                                            />
                                        </div>
                                    </div>
                                </Form.Group>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCreateLabel}
                                        className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all"
                                    >
                                        Uložiť kategóriu
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreatingNewLabel(false);
                                            setNewLabelName('');
                                            setNewLabelColor('#3b82f6');
                                        }}
                                        className="px-5 py-2 rounded-full border border-neutral-200 text-neutral-700 font-bold text-xs hover:bg-neutral-100 transition-all"
                                    >
                                        Zrušiť
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <h6 className="font-extrabold text-foreground text-sm uppercase tracking-wider mb-3">Existujúce kategórie</h6>
                    {labels.length === 0 ? (
                        <p className="text-neutral-500 text-sm font-medium">Zatiaľ nie sú vytvorené žiadne kategórie</p>
                    ) : (
                        <div className="space-y-3">
                            {labels.map(label => {
                                const count = posts.filter(p => p.label_id === label.id).length;
                                const isEditing = editingLabelId === label.id;

                                return (
                                    <div key={label.id} className="p-4 border border-neutral-200 rounded-2xl bg-white shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                style={{ width: '36px', height: '36px', backgroundColor: label.color, borderRadius: '10px', cursor: 'pointer' }}
                                                onClick={() => {
                                                    setEditingLabelId(label.id);
                                                    setEditingLabelColor(label.color);
                                                }}
                                                title="Kliknite na farbu na zmenu"
                                            />
                                            <div>
                                                <strong className="text-foreground text-sm">{label.name}</strong>
                                                <div className="text-neutral-400 text-xs font-semibold">
                                                    {count} {count === 1 ? 'článok' : count < 5 ? 'články' : 'článkov'}
                                                </div>
                                            </div>
                                        </div>

                                        {isEditing && (
                                            <div className="w-full pt-3 border-t border-neutral-100 flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <HexColorPicker color={editingLabelColor} onChange={setEditingLabelColor} style={{ width: '140px', height: '100px' }} />
                                                    <div style={{ width: '40px', height: '40px', backgroundColor: editingLabelColor, border: '2px solid #e5e7eb', borderRadius: '10px' }} />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateLabelColor(label.id, editingLabelColor)}
                                                        className="px-4 py-1.5 rounded-full bg-emerald-600 text-white font-bold text-xs"
                                                    >
                                                        Uložiť
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingLabelId(null);
                                                            setEditingLabelColor('');
                                                        }}
                                                        className="px-4 py-1.5 rounded-full border border-neutral-200 text-neutral-700 font-bold text-xs"
                                                    >
                                                        Zrušiť
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {!isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteLabel(label.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-red-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-neutral-200 p-6">
                    <button
                        type="button"
                        onClick={() => setShowLabelManager(false)}
                        className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 transition-all text-sm"
                    >
                        Zavrieť
                    </button>
                </Modal.Footer>
            </Modal>

            {/* CREATE POST MODAL */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
                <Form onSubmit={handleCreatePost}>
                    <Modal.Header closeButton className="border-neutral-200">
                        <Modal.Title className="font-extrabold text-xl text-foreground">{t?.blog?.createNew || 'Vytvoriť nový článok'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-6 space-y-5">
                        <Form.Group>
                            <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.titleLabel || 'Názov'}</Form.Label>
                            <Form.Control required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium" />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.perexLabel || 'Krátky popis (perex)'}</Form.Label>
                            <Form.Control required as="textarea" rows={3} value={formData.perex} onChange={(e) => setFormData({ ...formData, perex: e.target.value })} className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium" />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.contentLabel || 'Obsah'}</Form.Label>
                            <Form.Control as="textarea" rows={6} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium" />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">Zdroj (URL)</Form.Label>
                            <Form.Control type="text" value={formData.source_url} onChange={(e) => setFormData({ ...formData, source_url: e.target.value })} placeholder="https://priklad.sk" className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium" />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">Kategória článku</Form.Label>
                            <Form.Select value={formData.label_id || ''} onChange={(e) => setFormData({ ...formData, label_id: e.target.value ? parseInt(e.target.value) : null })} className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium">
                                <option value="">Bez kategórie</option>
                                {labels.map(label => (
                                    <option key={label.id} value={label.id}>{label.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="font-extrabold text-sm text-foreground mb-3">Obrázok článku</Form.Label>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div onClick={() => { setUploadMethod('url'); setSelectedFile(null); }} className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center ${uploadMethod === 'url' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary font-bold' : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:bg-neutral-100'}`}>
                                    <LinkIcon className="w-5 h-5" />
                                    <span className="text-xs font-bold">Vložiť URL odkazu</span>
                                </div>
                                <div onClick={() => setUploadMethod('upload')} className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center ${uploadMethod === 'upload' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary font-bold' : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:bg-neutral-100'}`}>
                                    <UploadCloud className="w-5 h-5" />
                                    <span className="text-xs font-bold">Nahrať zo zariadenia</span>
                                </div>
                            </div>

                            {uploadMethod === 'url' ? (
                                <Form.Control type="text" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://example.com/image.jpg" className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium" />
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
                        <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 transition-all text-sm">Zrušiť</button>
                        <button type="submit" disabled={uploading} className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-600 transition-all text-sm shadow-sm disabled:opacity-50 flex items-center gap-2">
                            {uploading && <Spinner size="sm" />}
                            <span>{uploading ? 'Nahrávam...' : (t?.blog?.create || 'Vytvoriť článok')}</span>
                        </button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* EDIT POST MODAL */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                <Form onSubmit={handleUpdatePost}>
                    <Modal.Header closeButton className="border-neutral-200">
                        <Modal.Title className="font-extrabold text-xl text-foreground">{t?.blog?.edit || 'Upraviť článok'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-6 space-y-5">
                        <Form.Group>
                            <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.titleLabel || 'Názov'}</Form.Label>
                            <Form.Control required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium" />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.perexLabel || 'Krátky popis (perex)'}</Form.Label>
                            <Form.Control required as="textarea" rows={3} value={formData.perex} onChange={(e) => setFormData({ ...formData, perex: e.target.value })} className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium" />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">{t?.blog?.contentLabel || 'Obsah'}</Form.Label>
                            <Form.Control as="textarea" rows={6} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium" />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">Zdroj (URL)</Form.Label>
                            <Form.Control type="text" value={formData.source_url} onChange={(e) => setFormData({ ...formData, source_url: e.target.value })} placeholder="https://priklad.sk" className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium" />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="font-bold text-sm text-neutral-700 mb-1.5">Kategória článku</Form.Label>
                            <Form.Select value={formData.label_id || ''} onChange={(e) => setFormData({ ...formData, label_id: e.target.value ? parseInt(e.target.value) : null })} className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium">
                                <option value="">Bez kategórie</option>
                                {labels.map(label => (
                                    <option key={label.id} value={label.id}>{label.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="font-extrabold text-sm text-foreground mb-3">Obrázok článku</Form.Label>
                            {formData.image_url && (
                                <div className="mb-4 p-4 border border-neutral-200 rounded-2xl bg-neutral-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={api.makeImageUrl(formData.image_url)} alt="Current" className="w-14 h-14 rounded-xl object-cover border border-neutral-200" onError={(e) => { e.target.style.display = 'none'; }} />
                                        <div>
                                            <p className="mb-0 text-sm font-bold text-foreground">Aktuálny obrázok</p>
                                            <p className="mb-0 text-xs text-neutral-400 truncate max-w-[220px]">{formData.image_url}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={handleDeleteImage} title="Odstrániť obrázok" className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-red-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div onClick={() => { setUploadMethod('url'); setSelectedFile(null); }} className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center ${uploadMethod === 'url' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary font-bold' : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:bg-neutral-100'}`}>
                                    <LinkIcon className="w-5 h-5" />
                                    <span className="text-xs font-bold">Vložiť URL odkazu</span>
                                </div>
                                <div onClick={() => setUploadMethod('upload')} className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center ${uploadMethod === 'upload' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary font-bold' : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:bg-neutral-100'}`}>
                                    <UploadCloud className="w-5 h-5" />
                                    <span className="text-xs font-bold">Nahrať zo zariadenia</span>
                                </div>
                            </div>

                            {uploadMethod === 'url' ? (
                                <Form.Control type="text" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://example.com/image.jpg" className="rounded-xl border-neutral-200 py-3 bg-neutral-50/50 text-sm font-medium" />
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
                        <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 transition-all text-sm">Zrušiť</button>
                        <button type="submit" disabled={uploading} className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-600 transition-all text-sm shadow-sm disabled:opacity-50 flex items-center gap-2">
                            {uploading && <Spinner size="sm" />}
                            <span>{uploading ? 'Ukladám...' : (t?.blog?.update || 'Uložiť zmeny')}</span>
                        </button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Share Modal */}
            <ShareModal show={showShareModal} onHide={() => setShowShareModal(false)} postId={currentPost?.slug} postTitle={currentPost?.title} />
        </motion.section>
    );
};

export default BlogPage;