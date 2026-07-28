import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import nitracikLogo from '../assets/nitracik_svg2.svg';

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    d.getFullYear(),
  ].join(".");
};

const formatCode = (code) => {
  if (!code) return "XXXX-XXXX-XXXX";
  const dashed = code.replace(/(.{4})/g, "$1-").trim();
  return dashed.endsWith("-") ? dashed.slice(0, -1) : dashed;
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

const GiftCertificate = ({
  mode = "full",
  code = null,
  amount = null,
  recipientName = "",
  buyerEmail = "",
  message = "",
  expiresAt = null,
}) => {
  const isPreview = mode === "preview";
  const isCompact = isPreview;

  // Base width at which the card looks perfect (desktop size)
  const CARD_WIDTH = 640;
  const CARD_HEIGHT = CARD_WIDTH / 1.586; // ~404px

  const card = (
    <div
      className="relative overflow-hidden rounded-[2rem] border border-neutral-100 bg-white shadow-md"
      style={{
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-10 -left-10 opacity-50 pointer-events-none z-0 w-[220px]">
        <Blob color="#F4A5A5" className="w-full h-full" />
      </div>
      <div
        className="absolute -top-10 -right-10 opacity-50 pointer-events-none z-0 w-[220px]"
        style={{ transform: "scaleX(-1)" }}
      >
        <Blob color="#F4A5A5" className="w-full h-full" />
      </div>
      <div className="absolute -bottom-12 -right-12 pointer-events-none z-0 w-[280px]">
        <Blob color="#EFE4C8" className="w-full h-full" />
      </div>

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col ${isCompact ? "p-4 sm:p-5 gap-2" : "p-6 sm:p-8 gap-3"}`}
      >
        {/* Header row */}
        <div className={`flex items-center justify-center ${isCompact ? "mb-1" : "mb-2"}`}>
          <img
            src={nitracikLogo}
            alt="Nitráčik MESSY SENSORY PLAY"
            className={`${isCompact ? "h-16" : "h-24"} w-auto object-contain`}
          />
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className={`font-black text-[#3D3D4E] ${isCompact ? "text-2xl sm:text-3xl tracking-normal" : "text-3xl sm:text-4xl tracking-wide"}`}>
            DARČEKOVÝ POUKAZ
          </h2>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#F4A5A5]" />

        {/* Fields */}
        <div className="divide-y divide-neutral-100">
          <div className={`flex gap-2 items-baseline ${isCompact ? "py-2" : "py-3"}`}>
            <span className="text-xs font-bold text-[#7A7A8C] uppercase tracking-wider w-28 flex-shrink-0">
              OD:
            </span>
            <span className={`${isCompact ? "text-sm" : "text-base"} font-bold text-[#3D3D4E] truncate`}>
              {buyerEmail || "—"}
            </span>
          </div>
          <div className={`flex gap-2 items-baseline ${isCompact ? "py-2" : "py-3"}`}>
            <span className="text-xs font-bold text-[#7A7A8C] uppercase tracking-wider w-28 flex-shrink-0">
              PRE:
            </span>
            <span className={`${isCompact ? "text-sm" : "text-base"} font-bold text-[#3D3D4E] truncate`}>
              {recipientName || "—"}
            </span>
          </div>
          {message && (
            <div className={`flex gap-2 items-baseline ${isCompact ? "py-2" : "py-3"}`}>
              <span className="text-xs font-bold text-[#7A7A8C] uppercase tracking-wider w-28 flex-shrink-0">
                VENOVANIE:
              </span>
              <span className={`${isCompact ? "text-sm" : "text-base"} font-bold text-[#7A7A8C] italic truncate`}>
                {message}
              </span>
            </div>
          )}
        </div>

        {/* Bottom metadata row */}
        <div className={`flex justify-between items-center ${isCompact ? "text-xs" : "text-sm"} font-bold text-[#7A7A8C]`}>
          <span
            className={`inline-flex items-center justify-center bg-[#FFFBEB] border border-[#FDE68A] rounded-full ${isCompact ? "px-3 py-1 text-sm" : "px-4 py-1.5 text-base"} font-black text-[#3D3D4E]`}
          >
            VÁŠ KÓD
          </span>
          <span>Platnosť do: {formatDate(expiresAt)}</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#F4A5A5]" />

        {/* Amount */}
        <div className={`text-center ${isCompact ? "mt-2" : ""}`}>
          <span className="font-black text-4xl sm:text-5xl text-[#3D3D4E]">
            {amount ? `${amount}€` : "—€"}
          </span>
        </div>

        {/* Code box */}
        {code && (
          <div className="flex justify-center">
            <div className="inline-block bg-[#FFFBEB] border-2 border-dashed border-[#F59E0B] rounded-xl px-6 py-3 text-center">
              <div className="font-mono font-black text-xl sm:text-2xl text-[#92400E] tracking-[0.15em]">
                {formatCode(code)}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[#B45309] mt-1">
                Váš unikátny kód
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Determine final render based on container width vs card base width
  const cardElement = card;

  // Wrapper that scales the card down to fit on smaller screens
  const ScaledWrapper = ({ children }) => {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(null);

    useLayoutEffect(() => {
      const updateScale = () => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.parentElement?.clientWidth || containerRef.current.clientWidth;
          const widthScale = Math.min(1, containerWidth / CARD_WIDTH);

          // In modal preview we also respect available viewport height.
          let heightScale = 1;
          if (isPreview) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight || 0;
            const bottomSafeSpace = 24;
            const availableHeight = viewportHeight - rect.top - bottomSafeSpace;
            if (availableHeight > 0) {
              heightScale = Math.min(1, availableHeight / CARD_HEIGHT);
            }
          }

          const newScale = Math.max(0.01, Math.min(widthScale, heightScale));
          setScale((prev) => {
            if (prev !== null && Math.abs(prev - newScale) < 0.002) {
              return prev;
            }
            return newScale;
          });
        }
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
    }, []);

    const effectiveScale = scale ?? 1;
    const scaledHeight = CARD_HEIGHT * effectiveScale;

    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: `${scaledHeight}px`,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: `translateX(-50%) scale(${effectiveScale})`,
            transformOrigin: 'top center',
            width: `${CARD_WIDTH}px`,
            opacity: scale === null ? 0 : 1,
          }}
        >
          {children}
        </div>
      </div>
    );
  };

  if (isPreview) {
    return (
      <div className="w-full max-w-[520px] mx-auto px-1 sm:px-2">
        <ScaledWrapper>{cardElement}</ScaledWrapper>
      </div>
    );
  }

  return <ScaledWrapper>{cardElement}</ScaledWrapper>;
};

export default GiftCertificate;