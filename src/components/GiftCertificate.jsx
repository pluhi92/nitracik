import React, { useRef, useState, useLayoutEffect } from 'react';
import nitracikLogo from '../assets/nitracik_svg2.svg';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('.');
};

const formatCode = (code) => {
  if (!code) return 'XXXX-XXXX-XXXX';
  const cleaned = code.replace(/-/g, '');
  const dashed = cleaned.replace(/(.{4})/g, '$1-').trim();
  return dashed.endsWith('-') ? dashed.slice(0, -1) : dashed;
};

const formatCodeCompact = (code) => {
  if (!code) return 'XXXXXXXXXXXX';
  return code.replace(/-/g, '');
};

const formatSerialNumber = (code) => {
  return formatCodeCompact(code).substring(0, 8) || 'XXXXXXXX';
};

// Statické obrázky pre flaky - lepší výkon na iOS (cachovateľné)
const FlakPink = ({ className }) => (
  <img 
    src="/images/flak-pink.svg" 
    alt="" 
    aria-hidden="true"
    loading="lazy"
    decoding="async"
    className={className}
    style={{ pointerEvents: 'none' }}
  />
);

const FlakCream = ({ className }) => (
  <img 
    src="/images/flak-cream.svg" 
    alt="" 
    aria-hidden="true"
    loading="lazy"
    decoding="async"
    className={className}
    style={{ pointerEvents: 'none' }}
  />
);

const ScaledCertificateWrapper = ({ children, cardWidth, cardHeight, isPreview }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(null);

  useLayoutEffect(() => {
    let rafId = null;
    let timeoutId = null;
    
    const updateScale = () => {
      if (!containerRef.current) return;

      const containerWidth =
        containerRef.current.parentElement?.clientWidth || containerRef.current.clientWidth;
      const widthScale = Math.min(1, containerWidth / cardWidth);

      let heightScale = 1;
      if (isPreview) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 0;
        const bottomSafeSpace = 24;
        const availableHeight = viewportHeight - rect.top - bottomSafeSpace;
        if (availableHeight > 0) {
          heightScale = Math.min(1, availableHeight / cardHeight);
        }
      }

      const newScale = Math.max(0.01, Math.min(widthScale, heightScale));
      setScale((prev) => {
        if (prev !== null && Math.abs(prev - newScale) < 0.002) {
          return prev;
        }
        return newScale;
      });
    };

    // Debounced update pre iOS výkon
    const debouncedUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(updateScale);
      }, 16); // ~60fps
    };

    updateScale();
    window.addEventListener('resize', debouncedUpdate, { passive: true });

    const ro = new ResizeObserver(debouncedUpdate);
    if (containerRef.current?.parentElement) {
      ro.observe(containerRef.current.parentElement);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', debouncedUpdate);
      ro.disconnect();
    };
  }, [cardWidth, cardHeight, isPreview]);

  const effectiveScale = scale ?? 1;
  const scaledHeight = cardHeight * effectiveScale + 4; // +4px buffer to prevent sub-pixel clipping

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${scaledHeight}px`,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: `translateX(-50%) scale(${effectiveScale})`,
          transformOrigin: 'top center',
          width: `${cardWidth}px`,
          opacity: scale === null ? 0 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const GiftCertificate = ({
  mode = 'full',
  code = null,
  amount = null,
  recipientName = '',
  buyerEmail = '',
  message = '',
  expiresAt = null,
  previewClassName = '',
  cardWidth = 640,
}) => {
  const isPreview = mode === 'preview';
  const displayFrom = buyerEmail || '—';
  const displayTo = recipientName || '—';
  const displayAmount = amount ? `${amount}€` : '—€';
  const displayCode = formatCodeCompact(code);
  const displaySerialNumber = formatSerialNumber(code);

  const CARD_WIDTH = cardWidth;
  const CARD_HEIGHT = Math.round((CARD_WIDTH * 595) / 842);

  const card = (
    <div
      className="relative overflow-hidden rounded-[2rem] border border-neutral-100 bg-white shadow-md"
      style={{
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
      }}
    >
      <div className="absolute -left-14 -top-14 z-0 w-[230px] opacity-65 pointer-events-none">
        <FlakPink className="h-full w-full" />
      </div>
      <div
        className="absolute -right-14 -top-14 z-0 w-[230px] opacity-65 pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      >
        <FlakPink className="h-full w-full" />
      </div>
      <div className="absolute -bottom-16 -right-16 z-0 w-[270px] opacity-65 pointer-events-none">
        <FlakCream className="h-full w-full" />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center px-10 pb-3 pt-2">
        <div className="mb-1 flex h-28 w-full flex-shrink-0 items-center justify-center">
          <img
            src={nitracikLogo}
            alt="Nitráčik MESSY SENSORY PLAY"
            className="h-28 w-auto max-w-[260px] object-contain mix-blend-multiply"
          />
        </div>

        <div className="mb-1 text-center text-[1.9rem] font-black leading-none tracking-[0.04em] text-[#3D3D4E] sm:text-[2.2rem]">
          DARČEKOVÝ POUKAZ
        </div>

        <div className="h-[2px] w-full bg-[#F4A5A5]" />

        <div className="mt-2 flex w-full flex-col">
          <div className="flex items-baseline gap-3 border-b border-[#F3F4F6] py-1">
            <span className="w-[84px] flex-shrink-0 text-[9px] font-black uppercase tracking-[0.12em] text-[#7A7A8C]">
              OD:
            </span>
            <span className="min-w-0 truncate text-[11px] font-bold text-[#3D3D4E]">
              {displayFrom}
            </span>
          </div>
          <div className="flex items-baseline gap-3 border-b border-[#F3F4F6] py-1">
            <span className="w-[84px] flex-shrink-0 text-[9px] font-black uppercase tracking-[0.12em] text-[#7A7A8C]">
              PRE:
            </span>
            <span className="min-w-0 truncate text-[11px] font-bold text-[#3D3D4E]">
              {displayTo}
            </span>
          </div>
          {message && (
            <div className="flex items-baseline gap-3 border-b border-[#F3F4F6] py-1">
              <span className="w-[84px] flex-shrink-0 text-[9px] font-black uppercase tracking-[0.12em] text-[#7A7A8C]">
                VENOVANIE:
              </span>
              <span className="min-w-0 truncate text-[11px] font-bold italic text-[#7A7A8C]">
                {message}
              </span>
            </div>
          )}
        </div>

        <div className="mb-1 mt-1 flex w-full items-center justify-between text-[9px] font-bold text-[#9CA3AF]">
          <span>No. {displaySerialNumber}</span>
          <span>Platnosť do: {formatDate(expiresAt)}</span>
        </div>

        <div className="h-[2px] w-full bg-[#F4A5A5]" />

        <div className="mb-1 mt-1 text-center text-[2.05rem] font-black leading-none text-[#3D3D4E] sm:text-[2.45rem]">
          {displayAmount}
        </div>

        <div className="mb-1 flex justify-center">
          <div className="rounded-[14px] border-[2.5px] border-dashed border-[#F59E0B] bg-[#FFFBEB] px-7 py-2 text-center">
            <div className="font-mono text-[1.35rem] font-black tracking-[0.08em] text-[#92400E] sm:text-[1.5rem]">
              {displayCode}
            </div>
            <div className="mt-0.5 text-[8px] uppercase tracking-[0.2em] text-[#B45309]">
              Váš unikátny kód · zadajte pri rezervácii
            </div>
          </div>
        </div>

        <div className="w-full px-4 text-center text-[9px] italic text-[#9CA3AF]">
          * Poukaz je platný na všetky aktivity dostupné na nitracik.sk a nie je možné ho vymeniť za hotovosť.
        </div>

        <div className="mt-auto pt-1 text-center text-[8px] text-[#C4C4CC]">
          © Nitráčik – Messy Sensory Play | nitracik.sk
        </div>
      </div>
    </div>
  );

  if (isPreview) {
    return (
      <div className={`w-full mx-auto px-1 sm:px-2 ${previewClassName}`.trim()}>
        <ScaledCertificateWrapper
          cardWidth={CARD_WIDTH}
          cardHeight={CARD_HEIGHT}
          isPreview={isPreview}
        >
          {card}
        </ScaledCertificateWrapper>
      </div>
    );
  }

  return (
    <ScaledCertificateWrapper cardWidth={CARD_WIDTH} cardHeight={CARD_HEIGHT} isPreview={isPreview}>
      {card}
    </ScaledCertificateWrapper>
  );
};

export default GiftCertificate;