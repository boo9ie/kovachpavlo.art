import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '../../types';

const PREVIEW_TIME = 0.1;

export const MetadataLabel = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col mb-2">
    <span className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">{label}</span>
    <span className="text-[12px] uppercase tracking-wide">{value}</span>
  </div>
);

export const FormLabel = ({ children, required = false }: { children?: React.ReactNode, required?: boolean }) => (
  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-widest">
    {children} {required && <span className="text-[#b20000]">*</span>}
  </label>
);

export const AdminInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`w-full p-3 border border-gray-300 text-xs bg-white text-black focus:border-black outline-none transition-colors ${props.className || ''}`} 
  />
);

export const AdminTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
    {...props} 
    className={`w-full p-3 border border-gray-300 text-xs bg-white text-black focus:border-black outline-none transition-colors ${props.className || ''}`} 
  />
);

export const ExpandableText = ({ text, limit = 160, className = "text-sm text-gray-700 leading-relaxed" }: { text: string; limit?: number; className?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const safeText = text || '';
  const shouldTruncate = safeText.length > limit;
  const textClassName = `${className} whitespace-pre-line`;

  if (!shouldTruncate) {
    return <div className={textClassName}>{safeText}</div>;
  }

  return (
    <div className={textClassName}>
      {isExpanded ? safeText : `${safeText.substring(0, limit)}...`}
      <button 
        onClick={(e) => { e.preventDefault(); setIsExpanded(!isExpanded); }}
        className="ml-2 text-[10px] font-bold text-[#b20000] hover:underline uppercase tracking-tighter inline-block align-baseline"
      >
        {isExpanded ? '[ less ]' : '[ more ]'}
      </button>
    </div>
  );
};

export const MediaPreview = ({
  item,
  isHovered,
  objectFit = 'cover',
  disableMonochrome = false
}: {
  item?: MediaItem;
  isHovered: boolean;
  objectFit?: 'contain' | 'cover';
  disableMonochrome?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const getPreviewTime = (duration?: number) => {
    if (!Number.isFinite(duration)) {
      return PREVIEW_TIME;
    }

    return Math.min(PREVIEW_TIME, Math.max(0, (duration ?? 0) - 0.1));
  };

  useEffect(() => {
    setError(false);
    setIsReady(false);
  }, [item?.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (item?.type === 'video' && video) {
      if (isHovered) {
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
        video.currentTime = getPreviewTime(video.duration);
      }
    }
  }, [isHovered, item?.type]);

  if (!item) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] uppercase font-bold text-gray-400 border border-gray-200">
        No Media
      </div>
    );
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = getPreviewTime(video.duration);
    }
  };

  const handleSeeked = () => {
    setIsReady(true);
  };

  const filterClass = disableMonochrome
    ? 'brightness-100 contrast-100'
    : isHovered
      ? 'grayscale-0 brightness-100'
      : 'grayscale brightness-90 contrast-125';

  if (error) {
    return (
      <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center p-4">
        <span className="text-[10px] uppercase font-bold text-[#b20000] mb-2 text-center">Codec Not Supported</span>
        <a 
          href={item.url} 
          download 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[9px] uppercase font-bold text-black border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors mt-2"
        >
          Download File
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#f0f0f0] overflow-hidden">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin"></div>
        </div>
      )}
      
      {item.type === 'video' ? (
        <video 
          key={item.url}
          ref={videoRef}
          muted 
          loop 
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
          onError={() => {
            setError(true);
          }}
          className={`w-full h-full object-${objectFit} transition-opacity duration-1000 ease-in-out ${filterClass} ${isReady ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src={item.url} type={item.url.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
        </video>
      ) : (
        <img 
          src={item.url} 
          alt="Preview" 
          onLoad={() => setIsReady(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-${objectFit} transition-opacity duration-1000 ease-in-out ${filterClass} ${isReady ? 'opacity-100' : 'opacity-0'}`} 
        />
      )}
      
      {item.type === 'video' && isReady && (
        <div className="absolute top-3 right-3 bg-black/80 text-white text-[8px] px-2 py-0.5 font-bold uppercase tracking-[0.2em] pointer-events-none z-20">
          {isHovered ? 'Playing' : 'Video'}
        </div>
      )}
      
      {item.photographer && isReady && (
        <div className={`absolute bottom-3 left-3 bg-black/90 text-white text-[8px] px-2.5 py-1 font-bold uppercase tracking-[0.1em] backdrop-blur-sm transition-opacity duration-500 pointer-events-none z-20 ${isHovered ? 'opacity-100' : 'opacity-40'}`}>
          Photo: {item.photographer}
        </div>
      )}
    </div>
  );
};
