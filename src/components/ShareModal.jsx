import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Copy, Check, Share2 } from 'lucide-react';

const ShareModal = ({ show, onHide, postId, postTitle }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const copyResetTimeoutRef = useRef(null);

  useEffect(() => {
    if (show && postId) {
      const url = `${window.location.origin}/blog/${postId}`;
      setShareUrl(url);
      setCopied(false);
    }

    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, [show, postId]);

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);

      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Nepodarilo sa skopírovať:', err);
      setCopied(true);

      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="flex items-center justify-center" dialogClassName="modal-dialog-centered mx-2 mx-sm-auto max-w-[calc(100%-1rem)] sm:max-w-[500px]">
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
              className={`cursor-pointer p-2.5 rounded-xl border transition-all duration-200 flex-shrink-0 shadow-sm flex items-center justify-center ${
                copied
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-primary'
              }`}
              title={copied ? 'Skopírované!' : 'Kopírovať do schránky'}
            >
              {copied ? (
                <Check className="w-5 h-5 transition-all duration-300 scale-110" />
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