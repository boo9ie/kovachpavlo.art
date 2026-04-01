import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WorkItem, MediaItem } from '../../types';
import { MetadataLabel } from '../Shared/SharedUI';
import { formatDate } from '../../utils/formatDate';

export const WorkDetail = ({ items }: { items: WorkItem[] }) => {
  const { id } = useParams();
  const item = items.find(i => i.id === id);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (item && item.media && item.media.length > 0) {
      setActiveMedia(item.media[0]);
    }
  }, [item]);

  if (!item) return <div className="p-24 text-center uppercase font-bold text-gray-400">Work not found</div>;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      <div className="mb-12">
        <Link to="/works" className="text-[10px] font-bold uppercase text-gray-400 hover:text-black mb-8 inline-block tracking-widest">← BACK TO WORKS</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <div className="aspect-video bg-gray-50 border border-gray-200 overflow-hidden relative shadow-inner group flex items-center justify-center">
            {activeMedia ? (
              activeMedia.type === 'video' ? (
                <video key={activeMedia.url} controls autoPlay muted playsInline className="w-full h-full object-contain">
                  <source src={activeMedia.url} type={activeMedia.url.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
                </video>
              ) : (
                <img key={activeMedia.url} src={activeMedia.url} alt={item.title} loading="lazy" className="w-full h-full object-contain" />
              )
            ) : (
               <div className="text-gray-400 text-xs font-bold uppercase">No Media Available</div>
            )}
            {activeMedia?.photographer && (
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] px-3 py-1.5 font-bold uppercase tracking-widest">
                Photo: {activeMedia.photographer}
              </div>
            )}
          </div>
          
          <div className="flex gap-4 mt-8 overflow-x-auto pb-4 no-scrollbar">
            {(item.media || []).map((m, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveMedia(m)}
                className={`flex-shrink-0 w-24 md:w-32 aspect-square border-2 transition-all overflow-hidden ${activeMedia?.url === m.url ? 'border-black' : 'border-transparent grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}
              >
                {m.type === 'video' ? (
                   <div className="w-full h-full bg-black flex items-center justify-center relative">
                     <div className="text-white text-[8px] uppercase font-bold p-1 absolute top-0 left-0 bg-red-600">Video</div>
                     <span className="text-white text-[20px]">▶</span>
                   </div>
                ) : (
                  <img src={m.url} loading="lazy" className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 border-t-2 border-black pt-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight tracking-normal">
            {item.title}
          </h2>
          <MetadataLabel label="Project Year" value={formatDate(item.date)} />
          <div className="mt-8 text-xl text-black leading-relaxed font-medium">
            {item.description}
          </div>
        </div>
      </div>
    </div>
  );
};
