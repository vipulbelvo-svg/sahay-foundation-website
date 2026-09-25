import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useGsapReveal } from '../hooks/useGsapReveal.js';
import SectionKicker from './SectionKicker.jsx';

// ---------------------------------------------------------------------------
// GallerySection
// ---------------------------------------------------------------------------
// To add a photo: append an entry to content.photoGalleryItems in siteContent.js.
// span values: 'normal' | 'wide' (2 cols) | 'tall' (2 rows)
// ---------------------------------------------------------------------------

export default function GallerySection({ content }) {
  const { photoGallery: ui, photoGalleryItems: allItems } = content;

  const [activeCategory, setActiveCategory] = useState('All');
  const [lightbox, setLightbox]             = useState(null); // index into filtered list
  const [imgLoaded, setImgLoaded]           = useState({});

  const sectionRef  = useGsapReveal('[data-gallery-reveal]', { stagger: 0.06, y: 28 });
  const filterRef   = useRef(null);

  // ── filtered items ──────────────────────────────────────────────────────
  const filtered = activeCategory === 'All'
    ? allItems
    : allItems.filter((item) => item.category === activeCategory);

  // ── lightbox helpers ────────────────────────────────────────────────────
  const openLightbox  = useCallback((index) => setLightbox(index), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevImage     = useCallback(() =>
    setLightbox((i) => (i - 1 + filtered.length) % filtered.length), [filtered.length]);
  const nextImage     = useCallback(() =>
    setLightbox((i) => (i + 1) % filtered.length), [filtered.length]);

  // ── keyboard navigation ─────────────────────────────────────────────────
  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e) => {
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, closeLightbox, prevImage, nextImage]);

  // ── lock body scroll when lightbox open ─────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  // ── reset lightbox when filter changes ──────────────────────────────────
  useEffect(() => { setLightbox(null); }, [activeCategory]);

  const currentItem = lightbox !== null ? filtered[lightbox] : null;

  return (
    <section
      id="photo-gallery"
      ref={sectionRef}
      className="relative overflow-hidden bg-ink py-24 sm:py-32"
      aria-label="Photo gallery"
    >
      {/* subtle background grain */}
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-60" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">

        {/* ── section heading ───────────────────────────────────────────── */}
        <div data-gallery-reveal>
          <SectionKicker
            eyebrow={ui.eyebrow}
            title={ui.title}
            copy={ui.copy}
          />
        </div>

        {/* ── category filters ──────────────────────────────────────────── */}
        <div
          ref={filterRef}
          data-gallery-reveal
          className="mt-10 flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap"
          role="tablist"
          aria-label="Filter gallery by category"
        >
          {ui.categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full border px-5 py-2 text-xs font-black uppercase tracking-[0.22em] transition duration-250 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
                activeCategory === cat
                  ? 'border-ember bg-ember text-ink shadow-ember'
                  : 'border-cream/14 bg-cream/6 text-cream/70 hover:border-cream/40 hover:text-cream'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── image grid ────────────────────────────────────────────────── */}
        <motion.div
          layout
          className="mt-10 grid auto-rows-[14rem] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((item, index) => (
              <GalleryCard
                key={item.id}
                item={item}
                index={index}
                onOpen={() => openLightbox(index)}
                viewLabel={ui.viewLabel}
                imgLoaded={imgLoaded}
                setImgLoaded={setImgLoaded}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <p className="mt-16 text-center text-sm text-cream/44">
            No images in this category yet.
          </p>
        )}
      </div>

      {/* ── lightbox ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox !== null && currentItem && (
          <Lightbox
            item={currentItem}
            onClose={closeLightbox}
            onPrev={prevImage}
            onNext={nextImage}
            ui={ui}
            total={filtered.length}
            current={lightbox}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ---------------------------------------------------------------------------
// GalleryCard
// ---------------------------------------------------------------------------
function GalleryCard({ item, index, onOpen, viewLabel, imgLoaded, setImgLoaded }) {
  const spanClass = {
    wide: 'sm:col-span-2',
    tall: 'sm:row-span-2',
    normal: '',
  }[item.span] ?? '';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-[1.5rem] border border-cream/8 bg-pine ${spanClass}`}
    >
      {/* image */}
      <img
        src={item.src}
        alt={item.title}
        loading="lazy"
        decoding="async"
        onLoad={() => setImgLoaded((prev) => ({ ...prev, [item.id]: true }))}
        className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
          imgLoaded[item.id] ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionProperty: 'transform, opacity' }}
      />

      {/* skeleton shimmer while loading */}
      {!imgLoaded[item.id] && (
        <div className="absolute inset-0 animate-pulse bg-pine" aria-hidden="true" />
      )}

      {/* gradient overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,28,23,0.08)_0%,rgba(15,28,23,0.72)_100%)] opacity-0 transition duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* hover content */}
      <div className="absolute inset-0 flex flex-col items-start justify-end p-5 opacity-0 transition duration-300 group-hover:opacity-100">
        <span className="mb-1 text-[0.65rem] font-black uppercase tracking-[0.28em] text-gold">
          {item.category}
        </span>
        <p className="font-display text-lg font-bold leading-snug text-cream">
          {item.title}
        </p>
      </div>

      {/* clickable button */}
      <button
        onClick={onOpen}
        aria-label={`${viewLabel}: ${item.title}`}
        className="absolute inset-0 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ember"
      >
        <span className="grid size-10 translate-y-2 place-items-center rounded-full border border-cream/30 bg-ink/50 text-cream opacity-0 backdrop-blur-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ZoomIn className="size-4" aria-hidden="true" />
        </span>
      </button>
    </motion.article>
  );
}

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------
function Lightbox({ item, onClose, onPrev, onNext, ui, total, current }) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/95 px-4 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/* image container — stop propagation so clicking image doesn't close */}
      <motion.div
        className="relative flex max-h-[90vh] max-w-5xl flex-col items-center"
        initial={{ scale: 0.94, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 18 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={item.srcLarge}
          alt={item.title}
          className="max-h-[75vh] w-auto max-w-full rounded-[1.5rem] object-contain shadow-soft"
          loading="eager"
        />

        {/* caption */}
        <div className="mt-4 flex w-full items-start justify-between gap-4 px-1">
          <div>
            <span className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-gold">
              {item.category}
            </span>
            <p className="mt-1 font-display text-xl font-bold text-cream">
              {item.title}
            </p>
            <p className="mt-1 max-w-lg text-sm leading-6 text-cream/60">
              {item.description}
            </p>
          </div>
          <span className="shrink-0 text-xs font-bold tabular-nums text-cream/40">
            {current + 1} / {total}
          </span>
        </div>
      </motion.div>

      {/* close */}
      <button
        onClick={onClose}
        aria-label={ui.close}
        className="round-control absolute right-5 top-5"
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      {/* prev */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label={ui.previous}
        className="round-control absolute left-4 top-1/2 -translate-y-1/2 sm:left-6"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>

      {/* next */}
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label={ui.next}
        className="round-control absolute right-4 top-1/2 -translate-y-1/2 sm:right-6"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </motion.div>
  );
}
