import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap'; // Button a InputGroup už nepotrebujeme
import { Clipboard, Check } from 'react-bootstrap-icons';

const ShareModal = ({ show, onHide, postId, postTitle }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (show && postId) {
      // postId je v skutočnosti slug
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
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-5 fw-bold">Zdieľať článok</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="pt-3 pb-4">
        <p className="text-muted small mb-3">
          Skopírujte odkaz nižšie a pošlite ho priateľom:
        </p>

        {/* NOVÝ DIZAJN: Spoločný kontajner pre input a ikonu */}
        <div className="d-flex align-items-center justify-content-between bg-gray-50 border rounded p-2">
          
          {/* 1. Textové pole (bez vlastného rámika, aby splynulo) */}
          <input
            type="text"
            value={shareUrl}
            readOnly
            onClick={(e) => e.target.select()} // Auto-select po kliknutí
            // Tailwind triedy pre čistý vzhľad:
            // flex-grow-1: zaberie všetko dostupné miesto
            // bg-transparent border-0: žiadne pozadie ani rámik
            // focus:ring-0: žiadny modrý obrys pri kliknutí
            className="flex-grow-1 bg-transparent border-0 text-gray-600 font-mono text-sm outline-none focus:ring-0 overflow-hidden text-ellipsis"
          />

          {/* 2. Klikateľná ikona (bez pozadia tlačidla) */}
          <div 
            onClick={handleCopy}
            // Tailwind triedy pre interaktivitu:
            // cursor-pointer: ručička
            // p-2 hover:bg-gray-200 rounded-full: okrúhle pozadie pri hoveri
            className="cursor-pointer ml-2 p-2 hover:bg-gray-200 rounded-full transition-colors duration-200 flex-shrink-0"
            title={copied ? "Skopírované!" : "Kopírovať do schránky"}
          >
            {copied ? (
              <Check size={24} className="text-green-600 transition-all duration-300 scale-110" /> 
            ) : (
              <Clipboard size={20} className="text-gray-500 hover:text-gray-700 transition-all duration-300" /> 
            )}
          </div>
        </div>
        
        {/* Potvrdenie "Skopírované!" pod poľom */}
        <div className="mt-2 h-5 text-right pe-2">
            {copied && (
                <span className="text-green-600 text-xs font-bold transition-opacity duration-300">
                    Skopírované!
                </span>
            )}
        </div>

      </Modal.Body>
    </Modal>
  );
};

export default ShareModal;