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

const Blob = ({ color, className }) => (
  <svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={color}
      d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,
      90,-16.3,88.5,-0.9C87,14.6,81.5,29.2,73.2,42.1C64.9,55,53.8,66.3,40.4,73.5
      C27,80.7,11.2,83.8,-3.8,82.5C-18.8,81.2,-32.9,75.5,-46.1,67.3C-59.3,59.2,
      -71.5,48.5,-77.3,35.1C-83.1,21.7,-82.5,5.7,-79.4,-9.4C-76.3,-24.6,-70.7,
      -38.9,-61.4,-50.7C-52.1,-62.5,-39.1,-71.8,-25.3,-78.4C-11.5,-85,3,-89,
      17.3,-87.7C31.5,-86.3,30.6,-83.5,44.7,-76.4Z"
      transform="translate(100 100)"
    />
  </svg>
);

const ScaledCertificateWrapper = ({ children, cardWidth, cardHeight, isPreview }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(null);

  useLayoutEffect(() => {
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

    updateScale();
    window.addEventListener('resize', updateScale);

    const ro = new ResizeObserver(() => updateScale());
    if (containerRef.current?.parentElement) {
      ro.observe(containerRef.current.parentElement);
    }

    return () => {
      window.removeEventListener('resize', updateScale);
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
      <div className="absolute -left-10 -top-10 z-0 w-[170px] opacity-50 pointer-events-none">
        <Blob color="#F4A5A5" className="h-full w-full" />
      </div>
      <div
        className="absolute -right-10 -top-10 z-0 w-[170px] opacity-50 pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      >
        <Blob color="#F4A5A5" className="h-full w-full" />
      </div>
      <div className="absolute -bottom-14 -right-14 z-0 w-[210px] pointer-events-none">
        <Blob color="#EFE4C8" className="h-full w-full" />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center px-10 pb-4 pt-3">
        <div className="mb-1 flex h-28 w-full flex-shrink-0 items-center justify-center">
          <img
            src={nitracikLogo}
            alt="Nitráčik MESSY SENSORY PLAY"
            className="h-28 w-auto max-w-[250px] object-contain mix-blend-multiply"
          />
        </div>

        <div className="mb-2 text-center text-[2.05rem] font-black leading-none tracking-[0.04em] text-[#3D3D4E] sm:text-[2.45rem]">
          DARČEKOVÝ POUKAZ
        </div>

        <div className="h-[2px] w-full bg-[#F4A5A5]" />

        <div className="mt-3 flex w-full flex-col">
          <div className="flex items-baseline gap-3 border-b border-[#F3F4F6] py-1.5">
            <span className="w-[84px] flex-shrink-0 text-[9px] font-black uppercase tracking-[0.12em] text-[#7A7A8C]">
              OD:
            </span>
            <span className="min-w-0 truncate text-[11px] font-bold text-[#3D3D4E]">
              {displayFrom}
            </span>
          </div>
          <div className="flex items-baseline gap-3 border-b border-[#F3F4F6] py-1.5">
            <span className="w-[84px] flex-shrink-0 text-[9px] font-black uppercase tracking-[0.12em] text-[#7A7A8C]">
              PRE:
            </span>
            <span className="min-w-0 truncate text-[11px] font-bold text-[#3D3D4E]">
              {displayTo}
            </span>
          </div>
          {message && (
            <div className="flex items-baseline gap-3 border-b border-[#F3F4F6] py-1.5">
              <span className="w-[84px] flex-shrink-0 text-[9px] font-black uppercase tracking-[0.12em] text-[#7A7A8C]">
                VENOVANIE:
              </span>
              <span className="min-w-0 truncate text-[11px] font-bold italic text-[#7A7A8C]">
                {message}
              </span>
            </div>
          )}
        </div>

        <div className="mb-1 mt-2 flex w-full items-center justify-between text-[9px] font-bold text-[#9CA3AF]">
          <span>No. {displaySerialNumber}</span>
          <span>Platnosť do: {formatDate(expiresAt)}</span>
        </div>

        <div className="h-[2px] w-full bg-[#F4A5A5]" />

        <div className="mb-2 mt-2 text-center text-[2.05rem] font-black leading-none text-[#3D3D4E] sm:text-[2.45rem]">
          {displayAmount}
        </div>

        <div className="mb-2 flex justify-center">
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