import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { Copy, Check, Share2 } from 'lucide-react';

const ShareModal = ({ show, onHide, postId, postTitle }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (show && postId) {
      // postId je v skutočnosti slug[cite: 17]
      const url = `${window.location.origin}/blog/${postId}`;
      setShareUrl(url);
      setCopied(false);
    }
  }, [show, postId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Nepodarilo sa skopírovať:', err);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md" className="flex items-center justify-center" dialogClassName="modal-dialog-centered mx-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl border-0 overflow-hidden">
        <Modal.Header closeButton className="border-b border-neutral-100 p-6 pb-4">
          <Modal.Title className="text-xl font-black text-foreground flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <span>Zdieľať článok</span>
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="p-6 sm:p-8">
          <p className="text-neutral-500 font-medium text-sm mb-4">
            Skopírujte odkaz nižšie a pošlite ho priateľom:
            {postTitle && <span className="block font-bold text-foreground mt-1 text-base">"{postTitle}"</span>}
          </p>

          {/* Kontajner pre input a ikonu */}
          <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-2xl p-2.5 shadow-sm">
            
            <input
              type="text"
              value={shareUrl}
              readOnly
              onClick={(e) => e.target.select()} // Auto-select po kliknutí[cite: 17]
              className="flex-grow bg-transparent border-0 text-neutral-600 font-mono text-sm outline-none focus:ring-0 overflow-hidden text-ellipsis px-2"
            />

            <button
              type="button"
              onClick={handleCopy}
              className="cursor-pointer p-2.5 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-all duration-200 flex-shrink-0 shadow-sm flex items-center justify-center text-neutral-600 hover:text-primary"
              title={copied ? "Skopírované!" : "Kopírovať do schránky"}
            >
              {copied ? (
                <Check className="w-5 h-5 text-emerald-600 transition-all duration-300 scale-110" /> 
              ) : (
                <Copy className="w-5 h-5 transition-all duration-300" /> 
              )}
            </button>
          </div>
          
          {/* Potvrdenie "Skopírované!" pod poľom */}
          <div className="mt-2.5 h-5 text-right pe-2">
              {copied && (
                  <span className="text-emerald-600 text-xs font-bold transition-opacity duration-300">
                      Skopírované do schránky!
                  </span>
              )}
          </div>

        </Modal.Body>
      </div>
    </Modal>
  );
};

export default ShareModal;