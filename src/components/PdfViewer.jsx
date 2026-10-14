import { useCallback, useEffect, useRef, useState } from 'react';

// pdf.js is split into its own chunk and loaded once, on the first manual
// opened. The legacy build keeps older phones working.
let pdfjsPromise = null;

function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist/legacy/build/pdf.min.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
    ]).then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    });
  }
  return pdfjsPromise;
}

// Bitmap width of a rail thumbnail. Roughly the CSS width times a 2x screen.
const THUMB_WIDTH = 208;

/**
 * One page in the rail. Renders itself only once it scrolls into view, so
 * opening a long manual doesn't queue a hundred renders up front.
 */
function Thumbnail({ doc, pageNumber, active, onSelect }) {
  const canvasRef = useRef(null);
  const buttonRef = useRef(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const button = buttonRef.current;
    if (!doc || !button || drawn) return undefined;

    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        doc.getPage(pageNumber).then((pdfPage) => {
          const canvas = canvasRef.current;
          if (cancelled || !canvas) return;
          const unscaled = pdfPage.getViewport({ scale: 1 });
          const viewport = pdfPage.getViewport({ scale: THUMB_WIDTH / unscaled.width });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          pdfPage
            .render({ canvasContext: canvas.getContext('2d'), viewport })
            .promise.then(() => !cancelled && setDrawn(true))
            .catch(() => {});
        });
      },
      { root: button.closest('.pdf-rail'), rootMargin: '200px' }
    );
    observer.observe(button);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [doc, pageNumber, drawn]);

  // Keep the current page visible when it changes by keyboard or Next/Previous.
  useEffect(() => {
    if (active) buttonRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`pdf-thumb${active ? ' is-active' : ''}`}
      aria-label={`Page ${pageNumber}`}
      aria-current={active ? 'true' : undefined}
      onClick={() => onSelect(pageNumber)}
    >
      <canvas ref={canvasRef} className="pdf-thumb-canvas" />
      <span className="pdf-thumb-number">{pageNumber}</span>
    </button>
  );
}

/**
 * Draws the manual to a canvas, one page at a time, with a rail of page
 * thumbnails to jump around by.
 *
 * The point is that the browser's own PDF viewer never opens: no Download, no
 * Print, no Save as, and no text layer to select and copy. A canvas also keeps
 * memory bounded — every page of a long manual at once does not fit on a phone.
 */
export default function PdfViewer({ url, title, onClose }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const docRef = useRef(null);
  const [doc, setDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [stageWidth, setStageWidth] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let task = null;

    loadPdfjs()
      .then((pdfjs) => {
        if (cancelled) return null;
        // isEvalSupported:false — a manual should never be able to run script.
        task = pdfjs.getDocument({ url, isEvalSupported: false });
        return task.promise;
      })
      .then((doc) => {
        if (!doc) return;
        if (cancelled) {
          doc.destroy();
          return;
        }
        docRef.current = doc;
        setDoc(doc);
        setPageCount(doc.numPages);
        setPage(1);
      })
      .catch((err) => {
        if (cancelled) return;
        // Don't claim expiry for what might be a network or script failure —
        // say what's known, and leave the real cause in the console.
        console.error('Manual failed to open', err);
        setError(
          err?.status === 403
            ? 'This manual link has expired. Go back and search again for a fresh one.'
            : "Sorry — this manual couldn't be opened. Go back and try again."
        );
      });

    return () => {
      cancelled = true;
      docRef.current = null;
      setDoc(null);
      task?.destroy();
    };
  }, [url]);

  // Measure the canvas's own CSS width — it honours the stage's padding and the
  // 900px max-width, which is exactly the box the page has to fill. Measured
  // once up front rather than waiting on the observer, which doesn't fire until
  // the document renders, then again on rotation or resize so it stays sharp.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const measure = () => {
      const canvas = canvasRef.current;
      if (canvas) setStageWidth(Math.round(canvas.getBoundingClientRect().width));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [error]);

  useEffect(() => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas || !pageCount || !stageWidth) return undefined;

    let render = null;
    let cancelled = false;

    doc.getPage(page).then((pdfPage) => {
      if (cancelled) return;
      // Render at the CSS width times the device pixel ratio, so small print is
      // legible on a phone rather than an upscaled blur.
      const unscaled = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({
        scale: (stageWidth / unscaled.width) * (window.devicePixelRatio || 1),
      });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      render = pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport });
      render.promise.catch(() => {});
    });

    return () => {
      cancelled = true;
      render?.cancel();
    };
  }, [page, pageCount, stageWidth]);

  const step = useCallback(
    (by) => setPage((current) => Math.min(Math.max(current + by, 1), pageCount || 1)),
    [pageCount]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'PageDown') step(1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  return (
    <div className="pdf-viewer" onContextMenu={(e) => e.preventDefault()}>
      <header className="pdf-bar">
        <button className="pdf-close" onClick={onClose}>
          ← Back
        </button>
        <span className="pdf-title">{title}</span>
        <span className="pdf-count">{pageCount ? `Page ${page} of ${pageCount}` : ''}</span>
      </header>

      {error ? (
        <p className="pdf-error">{error}</p>
      ) : (
        <div className="pdf-body">
          {pageCount > 1 && (
            <nav className="pdf-rail" aria-label="Pages">
              {Array.from({ length: pageCount }, (_, i) => (
                <Thumbnail
                  key={i + 1}
                  doc={doc}
                  pageNumber={i + 1}
                  active={i + 1 === page}
                  onSelect={setPage}
                />
              ))}
            </nav>
          )}
          <div className="pdf-stage" ref={stageRef}>
            <canvas ref={canvasRef} className="pdf-page" />
          </div>
        </div>
      )}

      {!error && pageCount > 1 && (
        <nav className="pdf-nav">
          <button className="primary-button" onClick={() => step(-1)} disabled={page <= 1}>
            Previous
          </button>
          <button className="primary-button" onClick={() => step(1)} disabled={page >= pageCount}>
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
