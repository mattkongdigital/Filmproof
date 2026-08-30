'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// A run of images in a post body. The track is a scroll-snapping row, so it
// works before this component hydrates and on touch without any of the code
// below — swipe, trackpad and shift-scroll are the browser's. The buttons,
// counter and arrow keys are the enhancement on top.
export function Carousel({ images }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);

  // Which slide is nearest the middle of the viewport. Read from scroll
  // position rather than tracked separately, so a swipe and a button press
  // update the counter the same way.
  const syncIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const middle = track.scrollLeft + track.clientWidth / 2;
    const slides = [...track.children];
    let nearest = 0;
    let best = Infinity;
    slides.forEach((slide, i) => {
      const distance = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - middle);
      if (distance < best) { best = distance; nearest = i; }
    });
    setIndex(nearest);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(syncIndex);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    syncIndex();
    return () => { cancelAnimationFrame(frame); track.removeEventListener('scroll', onScroll); };
  }, [syncIndex]);

  const goTo = useCallback((i) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[Math.max(0, Math.min(i, images.length - 1))];
    if (!slide) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: slide.offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
  }, [images.length]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
  };

  return (
    <div
      className="carousel"
      role="group"
      aria-roledescription="carousel"
      aria-label={`${images.length} photographs`}
      onKeyDown={onKeyDown}
    >
      <div className="carousel-track" ref={trackRef} tabIndex={0}>
        {images.map((img, i) => (
          <figure
            className="carousel-slide"
            key={img.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${images.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
          </figure>
        ))}
      </div>

      <div className="carousel-controls">
        <button
          type="button"
          className="carousel-btn"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Previous photograph"
        >
          ←
        </button>

        <div className="carousel-dots">
          {images.map((img, i) => (
            <button
              type="button"
              key={img.src}
              className={i === index ? 'carousel-dot current' : 'carousel-dot'}
              onClick={() => goTo(i)}
              aria-label={`Go to photograph ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
            />
          ))}
        </div>

        <span className="carousel-count" aria-live="polite">{index + 1} / {images.length}</span>

        <button
          type="button"
          className="carousel-btn"
          onClick={() => goTo(index + 1)}
          disabled={index === images.length - 1}
          aria-label="Next photograph"
        >
          →
        </button>
      </div>
    </div>
  );
}
