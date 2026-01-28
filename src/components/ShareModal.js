// ShareModal.js - Modal pre zdieľanie článkov
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';

const ShareModal = ({ show, onHide, postId, postTitle }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (show && postId) {
      // Generuj URL pre článok
      const url = `${window.location.origin}/blog/${postId}`;
      setShareUrl(url);
      setCopied(false);
    }
  }, [show, postId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      // Reset na pôvodný stav po 2 sekundách
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Nepodarilo sa skopírovať:', err);
      // Fallback pre staršie prehliadače
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback kópie zlyhalo:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>🔗 Zdieľať článok</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3 text-muted">
          Zdieľaj tento článok s priateľmi:
        </p>
        <h6 className="mb-3">{postTitle}</h6>
        
        <InputGroup>
          <Form.Control
            type="text"
            value={shareUrl}
            readOnly
            onClick={(e) => e.target.select()}
            style={{
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}
          />
          <Button 
            variant={copied ? 'success' : 'primary'}
            onClick={handleCopy}
            style={{ minWidth: '120px' }}
          >
            {copied ? (
              <>
                ✅ Skopírované!
              </>
            ) : (
              <>
                📋 Kopírovať
              </>
            )}
          </Button>
        </InputGroup>
        
        {copied && (
          <div className="mt-3 text-success small">
            ✓ Link bol skopírovaný do schránky
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Zavrieť
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ShareModal;