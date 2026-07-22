import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import api from '../api/api';
import ShareModal from './ShareModal';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Share2, ExternalLink } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const BlogArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [label, setLabel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/blog-posts/${slug}`);
        setPost(response.data);

        if (response.data.label_id) {
          try {
            const labelResponse = await api.get(`/api/blog-labels/${response.data.label_id}`);
            setLabel(labelResponse.data);
          } catch (labelError) {
            console.error('Error fetching label:', labelError);
          }
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setError('Článok sa nepodarilo načítať');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner animation="border" className="text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-16 container-custom max-w-3xl mx-auto px-4">
        <Alert variant="danger" className="rounded-2xl border-red-200 bg-red-50 text-red-800 font-medium mb-6">
          {error || 'Článok nebol nájdený'}
        </Alert>
        <button
          type="button"
          onClick={() => navigate('/blog')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary-600 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Späť na blog</span>
        </button>
      </div>
    );
  }

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-16 container-custom max-w-4xl mx-auto px-4 sm:px-6"
    >
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate('/blog')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-200 bg-white text-foreground font-bold hover:bg-neutral-50 transition-all text-sm shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Späť na blog</span>
        </button>
      </div>

      <article className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm p-6 sm:p-12 overflow-hidden">
        {/* Label Badge */}
        {label && (
          <span
            className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold text-white mb-4 shadow-2xs"
            style={{
              backgroundColor: label.color || '#3b82f6',
            }}
          >
            {label.name}
          </span>
        )}

        {/* Titulok */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Meta informácie */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-neutral-100 text-neutral-400 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.created_at)}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-primary hover:text-primary transition-all font-bold"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Zdieľať</span>
          </button>
        </div>

        {/* Obrázok */}
        {post.image_url && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 max-h-[500px]">
            <img
              src={api.makeImageUrl(post.image_url)}
              alt={post.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://picsum.photos/800/400?random=' + post.id;
              }}
            />
          </div>
        )}

        {/* Perex */}
        {post.perex && (
          <p className="text-lg text-neutral-700 font-semibold mb-8 leading-relaxed">
            {post.perex}
          </p>
        )}

        {/* Obsah */}
        <div 
          className="blog-content text-neutral-600 font-medium space-y-4 text-base sm:text-lg leading-relaxed"
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {post.content}
        </div>

        {/* Zdroj */}
        {post.source_url && (
          <div className="mt-10 pt-6 border-t border-neutral-100">
            <p className="text-neutral-500 text-sm font-medium flex items-center gap-2">
              <strong>Zdroj:</strong>{' '}
              <a 
                href={post.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline inline-flex items-center gap-1"
              >
                {post.source_url} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </p>
          </div>
        )}

        {/* Footer s tlačidlom na zdieľanie */}
        <div className="mt-10 pt-8 border-t border-neutral-100 text-center">
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-white font-bold hover:bg-primary-600 transition-all shadow-sm text-sm sm:text-base"
          >
            <Share2 className="w-4 h-4" />
            <span>Zdieľať tento článok</span>
          </button>
        </div>
      </article>

      {/* Share Modal */}
      <ShareModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        postId={post?.slug}
        postTitle={post.title}
      />
    </motion.section>
  );
};

export default BlogArticle;