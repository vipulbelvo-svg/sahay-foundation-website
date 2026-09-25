import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, ImagePlus, CheckCircle2, AlertCircle } from 'lucide-react';

const CATEGORIES = ['Community', 'Education', 'Healthcare', 'Volunteers', 'Events'];
const SPANS = [
  { value: 'normal', label: 'Normal' },
  { value: 'wide',   label: 'Wide (2 cols)' },
  { value: 'tall',   label: 'Tall (2 rows)' },
];

const STORAGE_KEY = 'sahay_gallery_images';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadStoredImages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveImages(images) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch {
    // localStorage quota exceeded – silently ignore
  }
}

// ---------------------------------------------------------------------------
// GalleryUploader
// ---------------------------------------------------------------------------
export default function GalleryUploader({ categories, onImagesChange }) {
  const [open,        setOpen]        = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [preview,     setPreview]     = useState(null);  // { dataUrl, file }
  const [form,        setForm]        = useState({ title: '', description: '', category: CATEGORIES[0], span: 'normal' });
  const [status,      setStatus]      = useState(null);  // 'success' | 'error'
  const [submitting,  setSubmitting]  = useState(false);
  const inputRef = useRef(null);

  const allCategories = categories ?? CATEGORIES;

  // ── drag-and-drop ────────────────────────────────────────────────────────
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) await loadPreview(file);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await loadPreview(file);
    e.target.value = '';
  };

  const loadPreview = async (file) => {
    const dataUrl = await readFileAsDataURL(file);
    setPreview({ dataUrl, file });
    setStatus(null);
  };

  const clearPreview = () => {
    setPreview(null);
    setStatus(null);
  };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!preview) return;
    if (!form.title.trim()) { setStatus('error'); return; }

    setSubmitting(true);

    const newImage = {
      id:          Date.now(),
      src:         preview.dataUrl,
      srcLarge:    preview.dataUrl,
      category:    form.category,
      title:       form.title.trim(),
      description: form.description.trim(),
      span:        form.span,
    };

    const stored = loadStoredImages();
    const updated = [...stored, newImage];
    saveImages(updated);
    onImagesChange(updated);

    setStatus('success');
    setSubmitting(false);

    // reset form after short delay
    setTimeout(() => {
      setPreview(null);
      setForm({ title: '', description: '', category: allCategories[0], span: 'normal' });
      setStatus(null);
    }, 1400);
  };

  // ── remove a stored image ────────────────────────────────────────────────
  const handleRemove = (id) => {
    const updated = loadStoredImages().filter((img) => img.id !== id);
    saveImages(updated);
    onImagesChange(updated);
  };

  const stored = loadStoredImages();

  return (
    <div className="mt-12" data-gallery-reveal>

      {/* ── Toggle button ──────────────────────────────────────────────── */}
      <button
        onClick={() => { setOpen((v) => !v); setStatus(null); }}
        className="flex items-center gap-2 rounded-full border border-ember/60 bg-ember/10 px-6 py-2.5 text-xs font-black uppercase tracking-[0.22em] text-ember transition hover:bg-ember/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember"
      >
        <ImagePlus className="size-4" aria-hidden="true" />
        {open ? 'Close uploader' : 'Upload your photos'}
      </button>

      {/* ── Upload panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 rounded-[1.5rem] border border-cream/10 bg-pine/60 p-6 backdrop-blur-sm sm:p-8"
          >
            <h3 className="font-display text-lg font-bold text-cream">Add a photo</h3>
            <p className="mt-1 text-sm text-cream/50">
              Images are stored in your browser. They'll be here when you come back.
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">

              {/* ── Drop zone ────────────────────────────────────────── */}
              <div>
                {preview ? (
                  <div className="relative overflow-hidden rounded-xl border border-cream/10">
                    <img
                      src={preview.dataUrl}
                      alt="Preview"
                      className="h-56 w-full object-cover"
                    />
                    <button
                      onClick={clearPreview}
                      aria-label="Remove preview"
                      className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-ink/70 text-cream backdrop-blur-sm transition hover:bg-ink"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember ${
                      dragOver
                        ? 'border-ember bg-ember/10'
                        : 'border-cream/20 bg-cream/4 hover:border-cream/40 hover:bg-cream/8'
                    }`}
                  >
                    <UploadCloud className="size-8 text-cream/40" aria-hidden="true" />
                    <span className="text-sm text-cream/50">
                      Drag &amp; drop or <span className="text-ember underline">browse</span>
                    </span>
                    <span className="text-xs text-cream/30">JPG, PNG, WEBP — max 10 MB</span>
                  </button>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  aria-label="Upload image file"
                />
              </div>

              {/* ── Meta fields ──────────────────────────────────────── */}
              <div className="flex flex-col gap-4">

                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-cream/60">
                    Title <span className="text-ember">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Community gathering"
                    className="w-full rounded-xl border border-cream/14 bg-ink/40 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:border-ember/60 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-cream/60">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="A short caption for the lightbox…"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-cream/14 bg-ink/40 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:border-ember/60 focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-cream/60">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-cream/14 bg-ink/80 px-4 py-2.5 text-sm text-cream focus:border-ember/60 focus:outline-none"
                  >
                    {allCategories.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Span */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-cream/60">
                    Grid size
                  </label>
                  <div className="flex gap-2">
                    {SPANS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, span: value }))}
                        className={`flex-1 rounded-lg border px-2 py-2 text-xs font-bold transition ${
                          form.span === value
                            ? 'border-ember bg-ember/20 text-ember'
                            : 'border-cream/14 text-cream/50 hover:border-cream/40 hover:text-cream'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add button + status */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!preview || submitting}
                    className="rounded-full bg-ember px-6 py-2.5 text-xs font-black uppercase tracking-[0.22em] text-ink transition hover:bg-ember/80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add to gallery
                  </button>

                  <AnimatePresence mode="wait">
                    {status === 'success' && (
                      <motion.span
                        key="ok"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-xs font-bold text-green-400"
                      >
                        <CheckCircle2 className="size-4" /> Added!
                      </motion.span>
                    )}
                    {status === 'error' && (
                      <motion.span
                        key="err"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-xs font-bold text-red-400"
                      >
                        <AlertCircle className="size-4" /> Title is required.
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* ── Uploaded images list ──────────────────────────────── */}
            {stored.length > 0 && (
              <div className="mt-8">
                <h4 className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cream/50">
                  Uploaded ({stored.length})
                </h4>
                <div className="flex flex-wrap gap-3">
                  {stored.map((img) => (
                    <div key={img.id} className="group relative">
                      <img
                        src={img.src}
                        alt={img.title}
                        className="h-20 w-20 rounded-xl object-cover ring-1 ring-cream/10"
                      />
                      {/* overlay on hover */}
                      <div className="absolute inset-0 flex flex-col items-start justify-end rounded-xl bg-ink/70 p-1.5 opacity-0 transition group-hover:opacity-100">
                        <p className="line-clamp-1 text-[10px] font-bold text-cream">{img.title}</p>
                        <span className="text-[9px] text-cream/60">{img.category}</span>
                      </div>
                      {/* delete */}
                      <button
                        onClick={() => handleRemove(img.id)}
                        aria-label={`Remove ${img.title}`}
                        className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-400"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
