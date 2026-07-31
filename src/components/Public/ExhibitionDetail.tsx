import React, { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExhibitionItem, MediaItem } from '../../types';
import { MetadataLabel } from '../Shared/SharedUI';
import { NotFound } from './NotFound';
import { formatDate } from '../../utils/formatDate';

export const ExhibitionDetail = ({ items }: { items: ExhibitionItem[] }) => {
  const { id } = useParams();
  const item = items.find(i => i.id === id);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Same treatment as any unknown URL: index.php answers 404 for a missing id,
  // so the rendered page should match it (and carry an h1).
  if (!item) return <NotFound />;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      {/* This layout shows no title anywhere, so the page had no h1 at all.
          Kept visually hidden to leave the design untouched; mirrors
          public/_prerender.php. */}
      <h1 className="sr-only">{item.title}</h1>
      <div className="mb-12">
        <Link to="/" className="text-[10px] font-bold uppercase text-gray-400 hover:text-black mb-8 inline-block tracking-widest">← BACK TO LIST</Link>
      </div>

      <div className="relative group">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 pb-8"
        >
          {(item.photos || []).map((photo, idx) => (
            <div 
              key={idx} 
              className="flex-shrink-0 w-full md:w-3/4 lg:w-2/3 snap-center cursor-zoom-in relative group/photo h-[60vh] bg-gray-50 overflow-hidden border border-gray-200"
              onClick={() => setSelectedMedia(photo)}
            >
              {photo.type === 'video' ? (
                <video key={photo.url} muted loop playsInline preload="none" className="w-full h-full object-cover transition-all duration-700" onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0.7; }}>
                  <source src={photo.url} type={photo.url.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
                </video>
              ) : (
                <img src={photo.url} alt={`${item.title} - ${idx}`} loading="lazy" className="w-full h-full object-cover transition-all duration-700" />
              )}
              {photo.photographer && (
                <div className="absolute bottom-4 left-4 bg-black/60 text-white text-[9px] px-3 py-1.5 font-bold uppercase tracking-widest transition-opacity duration-300">
                  Photo: {photo.photographer}
                </div>
              )}
              {photo.type === 'video' && (
                <div className="absolute top-4 right-4 bg-black/40 text-white text-[8px] px-2 py-1 font-bold uppercase tracking-widest">Video</div>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => scroll('left')} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 border border-black px-3 py-2 md:px-3.5 md:py-2.5 uppercase text-[9px] font-bold tracking-[0.18em] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">PREV</button>
        <button onClick={() => scroll('right')} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 border border-black px-3 py-2 md:px-3.5 md:py-2.5 uppercase text-[9px] font-bold tracking-[0.18em] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">NEXT</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12 border-t border-black pt-12">
        <div className="lg:col-span-4 space-y-6">
          <MetadataLabel label="Date" value={formatDate(item.date)} />
          <MetadataLabel label="Venue" value={item.location} />
        </div>
        <div className="lg:col-span-8">
          <div className="text-xl md:text-2xl text-black leading-relaxed font-medium whitespace-pre-line">
            {item.description}
          </div>
        </div>
      </div>

      {selectedMedia && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4" onClick={() => setSelectedMedia(null)}>
          <button className="fixed top-8 right-8 text-black font-bold uppercase text-xs border border-black px-4 py-2 hover:bg-black hover:text-white z-10">CLOSE</button>
          <div className="w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            {selectedMedia.type === 'video' ? (
              <video key={selectedMedia.url} controls autoPlay playsInline className="max-w-full max-h-[85vh] object-contain">
                <source src={selectedMedia.url} type={selectedMedia.url.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
              </video>
            ) : (
              <img src={selectedMedia.url} alt="Zoomed view" loading="lazy" className="max-w-full max-h-[85vh] object-contain" />
            )}
            {selectedMedia.photographer && (
              <div className="mt-4 text-[11px] uppercase font-bold tracking-[0.2em] text-black">
                PHOTO BY {selectedMedia.photographer}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
