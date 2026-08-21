import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Modal, Button, Form, Spinner, Alert, Pagination } from 'react-bootstrap';
import api from '../api/api';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';
import ShareModal from './ShareModal';
import { HexColorPicker } from 'react-colorful';
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

const POSTS_PER_PAGE = 9;

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
        <div className="relative w-full bg-white">
        <section className="py-12 md:py-16 container-custom max-w-6xl mx-auto px-3 sm:px-6">
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
            <div className="mb-10 bg-white card-glass border-2 border-neutral-300 rounded-[2rem] p-6 sm:p-8 shadow-md relative overflow-hidden" style={{ isolation: 'isolate' }}>
                <FlakPink className="absolute pointer-events-none" style={{ width: 190, top: 10, right: -20, opacity: 0.30, zIndex: -1, transform: 'rotate(15deg)' }} />
                <FlakCream className="absolute pointer-events-none" style={{ width: 170, bottom: 10, left: -15, opacity: 0.28, zIndex: -1, transform: 'rotate(-20deg)' }} />
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
                <div className="text-center py-16 bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md">
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
                            <div 
                                key={post.id} 
                                className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group"
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
                            </div>
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
        </section>
        </div>
    );
};

export default BlogPage;