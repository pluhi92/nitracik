// BlogArticle.js - Samostatná stránka pre jeden článok
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import api from '../api/api';
import ShareModal from './ShareModal';

const BlogArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        
        // 2. ZMENA: V API volaní použi premennú slug
        // Log pre kontrolu (uvidíš ho v konzole prehliadača - F12)
        console.log("Fetching slug:", slug); 

        const response = await api.get(`/api/blog-posts/${slug}`);
        setPost(response.data);
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setError('Článok sa nepodarilo načítať');
      } finally {
        setLoading(false);
      }
    };

    // 3. ZMENA: Kontrolujeme slug, nie id
    if (slug) {
      fetchPost();
    }
  }, [slug]); // 4. ZMENA: Dependency array

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
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Načítavam...</span>
        </Spinner>
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'Článok nebol nájdený'}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/blog')}>
          ← Späť na blog
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/blog')}
          className="mb-3"
        >
          ← Späť na blog
        </Button>
      </div>

      <article className="bg-white rounded shadow-sm p-4">
        {/* Titulok */}
        <h1 className="mb-3">{post.title}</h1>

        {/* Meta informácie */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div className="text-muted">
            <small>📅 {formatDate(post.created_at)}</small>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowShareModal(true)}
          >
            🔗 Zdieľať
          </Button>
        </div>

        {/* Obrázok */}
        {post.image_url && (
          <img
            src={api.makeImageUrl(post.image_url)}
            alt={post.title}
            className="img-fluid mb-4 rounded"
            style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
            onError={(e) => {
              e.target.src = 'https://picsum.photos/800/400?random=' + post.id;
            }}
          />
        )}

        {/* Perex */}
        {post.perex && (
          <div className="lead mb-4 text-muted">
            {post.perex}
          </div>
        )}

        {/* Obsah */}
        <div 
          className="blog-content"
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.8',
            fontSize: '1.1rem'
          }}
        >
          {post.content}
        </div>

        {/* Footer s tlačidlom na zdieľanie */}
        <div className="mt-5 pt-4 border-top text-center">
          <Button
            variant="primary"
            onClick={() => setShowShareModal(true)}
          >
            🔗 Zdieľať tento článok
          </Button>
        </div>
      </article>

      {/* Share Modal */}
      <ShareModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        postId={post.id}
        postTitle={post.title}
      />
    </Container>
  );
};

export default BlogArticle;