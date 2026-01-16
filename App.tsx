
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  INITIAL_NEWS, 
  INITIAL_EXHIBITIONS, 
  INITIAL_WORKS, 
  INITIAL_ABOUT, 
  INITIAL_CONTACT 
} from './constants';
import { 
  NewsItem, ExhibitionItem, WorkItem, AboutData, ContactData, MediaItem 
} from './types';

// --- SECURITY UTILS ---
async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_PASS_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // hash of "admin"

// --- INDEXED DB STORAGE ENGINE ---
const DB_NAME = 'KovachPortfolioDB';
const STORE_NAME = 'portfolio_data';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const dbGet = async (key: string): Promise<any> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const dbSet = async (key: string, value: any): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const dbClear = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Shared Components
const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="sticky top-0 bg-white z-50 border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 uppercase text-[11px] font-bold tracking-widest">
          <Link 
            to="/" 
            className={`text-xl font-bold tracking-tighter mr-auto ${location.pathname === '/' ? 'text-[#b20000]' : ''}`}
          >
            KOVACH PAVLO
          </Link>
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`${location.pathname === item.path ? 'underline decoration-2 underline-offset-4' : ''} ${item.color || 'hover:text-gray-500'}`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

const NAV_ITEMS = [
  { name: 'Home', path: '/' },
  { name: 'News', path: '/news' },
  { name: 'Works', path: '/works' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
  { name: '[Admin]', path: '/admin', color: 'text-[#b20000]' }
];

const MetadataLabel = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col mb-2">
    <span className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">{label}</span>
    <span className="text-[12px] uppercase tracking-wide">{value}</span>
  </div>
);

const FormLabel = ({ children, required = false }: { children?: React.ReactNode, required?: boolean }) => (
  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-widest">
    {children} {required && <span className="text-[#b20000]">*</span>}
  </label>
);

const AdminInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`w-full p-3 border border-gray-300 text-xs bg-white text-black focus:border-black outline-none transition-colors ${props.className || ''}`} 
  />
);

const AdminTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
    {...props} 
    className={`w-full p-3 border border-gray-300 text-xs bg-white text-black focus:border-black outline-none transition-colors ${props.className || ''}`} 
  />
);

const ExpandableText = ({ text, limit = 160, className = "text-sm text-gray-700 leading-relaxed" }: { text: string; limit?: number; className?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > limit;

  if (!shouldTruncate) {
    return <div className={className}>{text}</div>;
  }

  return (
    <div className={className}>
      {isExpanded ? text : `${text.substring(0, limit)}...`}
      <button 
        onClick={(e) => { e.preventDefault(); setIsExpanded(!isExpanded); }}
        className="ml-2 text-[10px] font-bold text-[#b20000] hover:underline uppercase tracking-tighter inline-block align-baseline"
      >
        {isExpanded ? '[ less ]' : '[ more ]'}
      </button>
    </div>
  );
};

const MediaPreview = ({ item, isHovered }: { item: MediaItem, isHovered: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const PREVIEW_TIME = 0.7;

  useEffect(() => {
    const video = videoRef.current;
    if (item.type === 'video' && video) {
      if (isHovered) {
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
        video.currentTime = PREVIEW_TIME; 
      }
    }
  }, [isHovered, item.type]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = PREVIEW_TIME;
    }
  };

  const handleSeeked = () => {
    setIsReady(true);
  };

  const filterClass = isHovered ? 'grayscale-0 brightness-100' : 'grayscale brightness-90 contrast-125';

  if (error) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[10px] uppercase font-bold text-gray-400">
        Media Error
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
          ref={videoRef}
          src={item.url} 
          muted 
          loop 
          playsInline
          preload="auto"
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${filterClass} ${isReady ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <img 
          src={item.url} 
          alt="Preview" 
          onLoad={() => setIsReady(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${filterClass} ${isReady ? 'opacity-100' : 'opacity-0'}`} 
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

// Pages
const Home = ({ items }: { items: ExhibitionItem[] }) => {
  const sortedItems = [...items].sort((a, b) => {
    const dateA = a.date.split('.').reverse().join('-');
    const dateB = b.date.split('.').reverse().join('-');
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      <div className="space-y-32">
        {sortedItems.map((item) => (
          <div key={item.id} className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-gray-100 pb-24 last:border-0">
            <div className="lg:col-span-8">
              <Link to={`/exhibition/${item.id}`} className="block group overflow-hidden bg-gray-100 border border-gray-200 relative aspect-[16/10]">
                <MediaPreview item={item.photos[0]} isHovered={false} />
              </Link>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-end">
              <div className="border-t-2 border-black pt-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <MetadataLabel label="Date" value={item.date} />
                  <MetadataLabel label="Location" value={item.location} />
                </div>
              </div>
              <Link to={`/exhibition/${item.id}`} className="group inline-block">
                <h2 className="text-4xl md:text-5xl font-bold uppercase mb-4 leading-none tracking-tighter group-hover:text-[#b20000] transition-colors">
                  {item.title}
                </h2>
              </Link>
              <ExpandableText text={item.description} limit={160} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExhibitionDetail = ({ items }: { items: ExhibitionItem[] }) => {
  const { id } = useParams();
  const item = items.find(i => i.id === id);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!item) return <div className="p-24 text-center uppercase font-bold text-gray-400">Exhibition not found</div>;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      <div className="mb-12">
        <Link to="/" className="text-[10px] font-bold uppercase text-gray-400 hover:text-black mb-8 inline-block tracking-widest">← BACK TO LIST</Link>
      </div>

      <div className="relative group">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 pb-8"
        >
          {item.photos.map((photo, idx) => (
            <div 
              key={idx} 
              className="flex-shrink-0 w-full md:w-3/4 lg:w-2/3 snap-center cursor-zoom-in relative group/photo h-[60vh] bg-gray-50 overflow-hidden border border-gray-200"
              onClick={() => setSelectedMedia(photo)}
            >
              {photo.type === 'video' ? (
                <video src={photo.url} muted loop playsInline preload="auto" className="w-full h-full object-cover grayscale group-hover/photo:grayscale-0 transition-all duration-700" onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0.7; }} />
              ) : (
                <img src={photo.url} alt={`${item.title} - ${idx}`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
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

        <button onClick={() => scroll('left')} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 border border-black p-4 uppercase text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">PREV</button>
        <button onClick={() => scroll('right')} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 border border-black p-4 uppercase text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">NEXT</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12 border-t border-black pt-12">
        <div className="lg:col-span-4 space-y-6">
          <MetadataLabel label="Date" value={item.date} />
          <MetadataLabel label="Venue" value={item.location} />
        </div>
        <div className="lg:col-span-8">
          <div className="text-xl md:text-2xl text-black leading-relaxed font-medium">
            {item.description}
          </div>
        </div>
      </div>

      {selectedMedia && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4" onClick={() => setSelectedMedia(null)}>
          <button className="fixed top-8 right-8 text-black font-bold uppercase text-xs border border-black px-4 py-2 hover:bg-black hover:text-white z-10">CLOSE</button>
          <div className="w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            {selectedMedia.type === 'video' ? (
              <video src={selectedMedia.url} controls autoPlay playsInline className="max-w-full max-h-[85vh] object-contain" />
            ) : (
              <img src={selectedMedia.url} alt="Zoomed view" className="max-w-full max-h-[85vh] object-contain" />
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

const WorkDetail = ({ items }: { items: WorkItem[] }) => {
  const { id } = useParams();
  const item = items.find(i => i.id === id);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (item && item.media.length > 0) {
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
            {activeMedia?.type === 'video' ? (
              <video key={activeMedia.url} src={activeMedia.url} controls autoPlay muted playsInline className="w-full h-full object-contain" />
            ) : (
              <img key={activeMedia?.url} src={activeMedia?.url} alt={item.title} className="w-full h-full object-contain" />
            )}
            {activeMedia?.photographer && (
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] px-3 py-1.5 font-bold uppercase tracking-widest">
                Photo: {activeMedia.photographer}
              </div>
            )}
          </div>
          
          <div className="flex gap-4 mt-8 overflow-x-auto pb-4 no-scrollbar">
            {item.media.map((m, idx) => (
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
                  <img src={m.url} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 border-t-2 border-black pt-4">
          <h2 className="text-3xl md:text-4xl font-bold uppercase mb-6 leading-tight tracking-tighter">
            {item.title}
          </h2>
          <MetadataLabel label="Project Year" value={item.date} />
          <div className="mt-8 text-xl text-black leading-relaxed font-medium">
            {item.description}
          </div>
        </div>
      </div>
    </div>
  );
};

const NewsList = ({ items }: { items: NewsItem[] }) => (
  <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-12">
    <div className="space-y-16">
      {[...items].sort((a, b) => {
          const dateA = a.date.split('.').reverse().join('-');
          const dateB = b.date.split('.').reverse().join('-');
          return dateB.localeCompare(dateA);
      }).map((item) => (
        <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="block group">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 aspect-video overflow-hidden bg-gray-100">
              <img src={item.photo} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
            <div className="w-full md:w-2/3 border-t border-black pt-4">
              <div className="text-[10px] uppercase font-bold text-[#b20000] mb-2">/ {item.date}</div>
              <h2 className="text-3xl font-bold uppercase group-hover:underline underline-offset-8">{item.title}</h2>
              <div className="mt-4 text-[11px] uppercase tracking-widest text-gray-500">External Link ↗</div>
            </div>
          </div>
        </a>
      ))}
    </div>
  </div>
);

const WorksPage = ({ items }: { items: WorkItem[] }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-8">
        {items.map((item) => (
          <Link 
            key={item.id} 
            to={`/work/${item.id}`}
            className="flex flex-col group"
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="aspect-square bg-gray-50 mb-6 border border-gray-200 overflow-hidden relative shadow-sm">
              <MediaPreview 
                item={item.media[0]} 
                isHovered={hoveredId === item.id} 
              />
            </div>
            <div className="border-t border-black pt-4">
               <div className="flex justify-between items-start">
                 <h3 className="text-xl font-bold uppercase leading-tight group-hover:text-[#b20000] transition-colors">{item.title}</h3>
                 <span className="text-xs font-bold text-[#b20000]">{item.date}</span>
               </div>
               <ExpandableText 
                  text={item.description} 
                  limit={90} 
                  className="text-xs text-gray-700 mt-4 leading-relaxed" 
               />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const AboutPage = ({ data }: { data: AboutData }) => (
  <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mt-4">
      <div className="md:col-span-4">
        <img src={data.photo} alt="Pavlo Kovach" className="w-full grayscale border border-black p-1 mb-3" />
        <div className="border-t border-black pt-3">
          <MetadataLabel label="Born" value={data.birthDate} />
          <p className="text-[11px] font-bold uppercase mt-3 text-gray-400">Education</p>
          <p className="text-xs uppercase font-medium">Uzhhorod College of Arts</p>
          <p className="text-xs uppercase font-medium">Lviv National Academy of Arts</p>
        </div>
      </div>
      <div className="md:col-span-8">
        <div className="text-lg md:text-xl text-black leading-relaxed space-y-6 whitespace-pre-wrap font-medium border-b border-black pb-12 mb-12">
          {data.text}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-6 tracking-widest">/ Solo Exhibitions</h3>
            <ul className="space-y-3">
              {data.soloExhibitions.map((item, idx) => (
                <li key={idx} className="text-xs uppercase leading-tight font-medium border-l-2 border-[#b20000] pl-4 py-1">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-6 tracking-widest">/ Group Exhibitions</h3>
            <ul className="space-y-3">
              {data.groupExhibitions.map((item, idx) => (
                <li key={idx} className="text-xs uppercase leading-tight font-medium border-l-2 border-black pl-4 py-1">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ContactPage = ({ data }: { data: ContactData }) => (
  <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 h-[70vh] flex items-center justify-center">
    <div className="w-full max-w-lg border border-gray-200 p-12 md:p-16 shadow-sm bg-white relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-black group-hover:bg-[#b20000] transition-colors duration-500"></div>
      
      <div className="mb-12">
        <h2 className="text-2xl font-bold tracking-tighter uppercase mb-1">Kovach Pavlo</h2>
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Artist / Curator</p>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Electronic Mail</span>
          <a 
            href={`mailto:${data.email}`} 
            className="text-base md:text-lg font-medium hover:text-[#b20000] transition-colors duration-300 lowercase"
          >
            {data.email}
          </a>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Mobile / WhatsApp</span>
          <a 
            href={`tel:${data.whatsapp}`} 
            className="text-base md:text-lg font-medium hover:text-[#b20000] transition-colors duration-300"
          >
            {data.whatsapp}
          </a>
        </div>
      </div>
      
      <div className="mt-16 pt-8 border-t border-gray-100 flex justify-end items-end">
        <div className="text-[8px] uppercase font-bold text-gray-300 tracking-tighter">Lviv, Ukraine</div>
      </div>
    </div>
  </div>
);

// ADMIN PANEL
const AdminPanel = ({ 
  news, setNews, 
  exhibitions, setExhibitions, 
  works, setWorks,
  about, setAbout,
  passwordHash, setPasswordHash
}: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('admin_auth') === 'true');
  const [loginInput, setLoginInput] = useState('');
  
  // Persistent Security State
  const [failedAttempts, setFailedAttempts] = useState(() => Number(localStorage.getItem('failed_attempts') || 0));
  const [lockoutUntil, setLockoutUntil] = useState(() => Number(localStorage.getItem('lockout_until') || 0));
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  
  const [activeTab, setActiveTab] = useState('news');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // Form States
  const [newNews, setNewNews] = useState<Partial<NewsItem>>({});
  const [newExhib, setNewExhib] = useState<Partial<ExhibitionItem>>({ photos: [] });
  const [newWork, setNewWork] = useState<Partial<WorkItem>>({ media: [] });
  const [editAbout, setEditAbout] = useState<AboutData>(about);
  
  // Local states for exhibition list management
  const [newSoloExhib, setNewSoloExhib] = useState('');
  const [newGroupExhib, setNewGroupExhib] = useState('');

  useEffect(() => {
    let timer: any;
    const updateLockout = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((lockoutUntil - now) / 1000));
      setLockoutTimeLeft(remaining);
      if (remaining === 0 && lockoutUntil !== 0) {
        setLockoutUntil(0);
        localStorage.removeItem('lockout_until');
      }
    };

    updateLockout();
    timer = setInterval(updateLockout, 1000);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimeLeft > 0) return;

    const inputHash = await hashPassword(loginInput.trim());
    
    if (inputHash === passwordHash) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setFailedAttempts(0);
      localStorage.removeItem('failed_attempts');
      setLoginInput('');
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      localStorage.setItem('failed_attempts', nextAttempts.toString());
      setLoginInput('');

      if (nextAttempts >= 3) {
        const until = Date.now() + 30000;
        setLockoutUntil(until);
        localStorage.setItem('lockout_until', until.toString());
        setFailedAttempts(0);
        localStorage.removeItem('failed_attempts');
        alert("Too many failed attempts. Access locked for 30 seconds.");
      } else {
        alert(`Invalid password. ${3 - nextAttempts} attempts remaining.`);
      }
    }
  };

  const resetForms = () => {
    setShowForm(false);
    setEditingId(null);
    setNewNews({});
    setNewExhib({ photos: [] });
    setNewWork({ media: [] });
    setIsUploading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
  };

  const handleClearStorage = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm("Ця дія ВИДАЛИТЬ УСІ ДАНІ АРХІВУ. Ви впевнені?")) {
      await dbClear();
      localStorage.clear();
      window.location.reload();
    }
  };

  // Immediate Deletion Handlers - No more window.confirm
  const onDeleteNews = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setNews((prev: NewsItem[]) => prev.filter(item => String(item.id) !== String(id)));
  };

  const onDeleteExhibition = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExhibitions((prev: ExhibitionItem[]) => prev.filter(item => String(item.id) !== String(id)));
  };

  const onDeleteWork = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setWorks((prev: WorkItem[]) => prev.filter(item => String(item.id) !== String(id)));
  };

  const handleEditNews = (item: NewsItem) => {
    setNewNews(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleEditExhib = (item: ExhibitionItem) => {
    setNewExhib(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleEditWork = (item: WorkItem) => {
    setNewWork(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'exhib' | 'work' | 'news' | 'about') => {
    const files = e.target.files;
    if (files) {
      setIsUploading(true);
      const fileList = Array.from(files);
      let processed = 0;

      fileList.forEach((file: File) => {
        const MAX_SIZE = 50 * 1024 * 1024; 
        if (file.size > MAX_SIZE) {
          alert(`Файл ${file.name} занадто великий.`);
          processed++;
          if (processed === fileList.length) setIsUploading(false);
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const type = file.type.startsWith('video') ? 'video' : 'image';
          const url = reader.result as string;
          
          if (target === 'exhib') {
            setNewExhib(prev => ({ ...prev, photos: [...(prev.photos || []), { url, type, photographer: '' }] }));
          } else if (target === 'work') {
            setNewWork(prev => ({ ...prev, media: [...(prev.media || []), { url, type, photographer: '' }] }));
          } else if (target === 'news') {
            setNewNews(prev => ({ ...prev, photo: url }));
          } else if (target === 'about') {
            setEditAbout(prev => ({ ...prev, photo: url }));
          }

          processed++;
          if (processed === fileList.length) setIsUploading(false);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSaveNews = () => {
    if (!newNews.title || !newNews.photo) return alert("Обов'язкові поля порожні");
    if (editingId) {
      setNews(news.map((item: NewsItem) => item.id === editingId ? { ...item, ...newNews } : item));
    } else {
      setNews([{ ...newNews, id: Date.now().toString(), date: newNews.date || new Date().toLocaleDateString(), url: newNews.url || '#' } as NewsItem, ...news]);
    }
    resetForms();
  };

  const handleSaveExhib = () => {
    if (!newExhib.title || !newExhib.photos?.length) return alert("Обов'язкові поля порожні");
    if (editingId) {
      setExhibitions(exhibitions.map((item: ExhibitionItem) => item.id === editingId ? { ...item, ...newExhib } : item));
    } else {
      setExhibitions([{ ...newExhib, id: Date.now().toString(), author: 'Pavlo Kovach jr.', date: newExhib.date || new Date().toLocaleDateString(), location: newExhib.location || 'Unknown' } as ExhibitionItem, ...exhibitions]);
    }
    resetForms();
  };

  const handleSaveWork = () => {
    if (!newWork.title || !newWork.media?.length) return alert("Обов'язкові поля порожні");
    if (editingId) {
      setWorks(works.map((item: WorkItem) => item.id === editingId ? { ...item, ...newWork } : item));
    } else {
      setWorks([{ ...newWork, id: Date.now().toString(), author: 'Pavlo Kovach jr.', date: newWork.date || new Date().getFullYear().toString() } as WorkItem, ...works]);
    }
    resetForms();
  };

  const addSoloExhib = () => {
    if (!newSoloExhib.trim()) return;
    setEditAbout({ ...editAbout, soloExhibitions: [...editAbout.soloExhibitions, newSoloExhib.trim()] });
    setNewSoloExhib('');
  };

  const removeSoloExhib = (idx: number) => {
    setEditAbout({ ...editAbout, soloExhibitions: editAbout.soloExhibitions.filter((_, i) => i !== idx) });
  };

  const addGroupExhib = () => {
    if (!newGroupExhib.trim()) return;
    setEditAbout({ ...editAbout, groupExhibitions: [...editAbout.groupExhibitions, newGroupExhib.trim()] });
    setNewGroupExhib('');
  };

  const removeGroupExhib = (idx: number) => {
    setEditAbout({ ...editAbout, groupExhibitions: editAbout.groupExhibitions.filter((_, i) => i !== idx) });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <form onSubmit={handleLogin} className="w-full max-w-sm border-2 border-black p-12 space-y-8 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-center text-black">Admin Access</h2>
          <div className="space-y-4">
            <FormLabel required>Password</FormLabel>
            <input 
              type="password" 
              value={loginInput} 
              disabled={lockoutTimeLeft > 0}
              onChange={e => setLoginInput(e.target.value)}
              className={`w-full p-4 border-2 border-black bg-white text-black outline-none font-bold placeholder:text-gray-300 transition-opacity ${lockoutTimeLeft > 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            disabled={lockoutTimeLeft > 0}
            className={`w-full text-white p-4 font-black uppercase tracking-widest transition-colors ${lockoutTimeLeft > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-[#b20000]'}`}
          >
            {lockoutTimeLeft > 0 ? `LOCKED: ${lockoutTimeLeft}s` : 'ENTER'}
          </button>
          <div className="flex flex-col items-center gap-2">
            {failedAttempts > 0 && <p className="text-[10px] text-[#b20000] font-bold uppercase">Attempts: {failedAttempts}/3</p>}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-baseline border-b border-black mb-4 mt-12">
        <div className="flex gap-4 overflow-x-auto pb-4 uppercase text-[10px] font-bold">
          {['news', 'exhibitions', 'works', 'about', 'settings'].map(tab => (
            <button key={tab} type="button" onClick={() => { setActiveTab(tab); resetForms(); }} className={`px-6 py-3 border border-black transition-all ${activeTab === tab ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>{tab}</button>
          ))}
        </div>
        <div className="pb-4 text-[9px] font-bold uppercase flex items-center gap-6">
          <button type="button" onClick={handleLogout} className="text-gray-500 hover:text-black">Logout Session</button>
          <button type="button" onClick={handleClearStorage} className="text-[#b20000] underline decoration-dotted underline-offset-4">Reset Archive</button>
        </div>
      </div>

      <div className="bg-gray-50 p-8 border border-gray-200 min-h-[500px]">
        {isUploading && (
          <div className="mb-8 p-4 bg-black text-white uppercase text-[10px] font-bold animate-pulse">Processing Files...</div>
        )}

        {activeTab === 'news' && (
          <div>
            {!showForm ? (
              <button type="button" onClick={() => setShowForm(true)} className="mb-8 px-6 py-3 bg-[#b20000] text-white font-bold uppercase text-xs tracking-widest">New News Entry</button>
            ) : (
              <div className="bg-white p-8 border border-black space-y-6 mb-12 shadow-lg">
                <h3 className="font-bold uppercase text-sm border-b-2 border-black pb-2">News Entry</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormLabel required>News Title</FormLabel>
                    <AdminInput placeholder="e.g. Venice Biennale 2024" value={newNews.title || ''} onChange={e => setNewNews({...newNews, title: e.target.value})} />
                    <FormLabel>Publication Date</FormLabel>
                    <AdminInput placeholder="DD.MM.YYYY" value={newNews.date || ''} onChange={e => setNewNews({...newNews, date: e.target.value})} />
                    <FormLabel>External URL</FormLabel>
                    <AdminInput placeholder="https://..." value={newNews.url || ''} onChange={e => setNewNews({...newNews, url: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <FormLabel required>Thumbnail Photo</FormLabel>
                    {newNews.photo ? (
                      <div className="relative"><img src={newNews.photo} className="w-full h-40 object-cover border" /><button type="button" onClick={() => setNewNews({...newNews, photo: undefined})} className="absolute top-2 right-2 bg-black text-white p-1 text-[8px] uppercase">Change</button></div>
                    ) : (
                      <div className="w-full h-40 border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
                        <input type="file" accept="image/*" className="hidden" id="news-up" onChange={e => handleMediaUpload(e, 'news')} />
                        <label htmlFor="news-up" className="cursor-pointer uppercase text-[10px] font-bold text-gray-400">Upload Thumbnail</label>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t">
                  <button type="button" onClick={handleSaveNews} className="px-8 py-3 bg-black text-white font-bold uppercase text-xs tracking-widest">Save</button>
                  <button type="button" onClick={resetForms} className="px-8 py-3 border border-black font-bold uppercase text-xs">Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {news.map((item: NewsItem) => (
                <div key={item.id} className="flex justify-between items-center p-5 bg-white border border-gray-200 uppercase text-xs">
                  <div className="flex gap-4 items-center">
                    <img src={item.photo} className="w-12 h-12 object-cover grayscale" />
                    <span>{item.title}</span>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => handleEditNews(item)} className="font-bold hover:underline">EDIT</button>
                    <button 
                      type="button"
                      onClick={(e) => onDeleteNews(e, item.id)} 
                      className="text-[#b20000] font-bold hover:underline cursor-pointer"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'exhibitions' && (
           <div>
             {!showForm ? (
               <button type="button" onClick={() => setShowForm(true)} className="mb-8 px-6 py-3 bg-[#b20000] text-white font-bold uppercase text-xs tracking-widest">Add Exhibition</button>
             ) : (
               <div className="bg-white p-8 border border-black space-y-6 mb-12 shadow-lg">
                 <h3 className="font-bold uppercase text-sm border-b-2 border-black pb-2">Exhibition Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <FormLabel required>Exhibition Title</FormLabel>
                     <AdminInput placeholder="Enter title" value={newExhib.title || ''} onChange={e => setNewExhib({...newExhib, title: e.target.value})} />
                   </div>
                   <div className="space-y-4">
                     <FormLabel>Exhibition Date</FormLabel>
                     <AdminInput placeholder="DD.MM.YYYY" value={newExhib.date || ''} onChange={e => setNewExhib({...newExhib, date: e.target.value})} />
                   </div>
                   <div className="col-span-2 space-y-4">
                     <FormLabel>Venue & Location</FormLabel>
                     <AdminInput placeholder="Gallery Name, City, Country" value={newExhib.location || ''} onChange={e => setNewExhib({...newExhib, location: e.target.value})} />
                   </div>
                   <div className="col-span-2 space-y-4">
                     <FormLabel>Curator's Text / Description</FormLabel>
                     <AdminTextarea rows={4} placeholder="Full description" value={newExhib.description || ''} onChange={e => setNewExhib({...newExhib, description: e.target.value})} />
                   </div>
                 </div>
                 <div className="border-t pt-6">
                    <FormLabel required>Media Documentation</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {newExhib.photos?.map((p, i) => (
                        <div key={i} className="relative border p-1 bg-white">
                          {p.type === 'video' ? <div className="aspect-square bg-black flex items-center justify-center text-white text-[8px]">VIDEO</div> : <img src={p.url} className="aspect-square object-cover" />}
                          <button type="button" onClick={() => setNewExhib({...newExhib, photos: newExhib.photos?.filter((_, idx) => idx !== i)})} className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-[10px]">×</button>
                        </div>
                      ))}
                      <label className="border-2 border-dashed flex flex-col items-center justify-center aspect-square cursor-pointer bg-white hover:bg-gray-50">
                        <input type="file" multiple className="hidden" onChange={e => handleMediaUpload(e, 'exhib')} />
                        <span className="text-[10px] font-bold text-gray-400">+ ADD MEDIA</span>
                      </label>
                    </div>
                 </div>
                 <div className="flex gap-4 pt-6 border-t">
                   <button type="button" onClick={handleSaveExhib} className="px-8 py-3 bg-black text-white font-bold uppercase text-xs">Save</button>
                   <button type="button" onClick={resetForms} className="px-8 py-3 border border-black font-bold uppercase text-xs">Cancel</button>
                 </div>
               </div>
             )}
             <div className="space-y-4">
                {exhibitions.map((item: ExhibitionItem) => (
                  <div key={item.id} className="flex justify-between items-center p-5 bg-white border border-gray-200 uppercase text-xs">
                    <span>{item.title}</span>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => handleEditExhib(item)} className="font-bold hover:underline">EDIT</button>
                      <button 
                        type="button"
                        onClick={(e) => onDeleteExhibition(e, item.id)} 
                        className="text-[#b20000] font-bold hover:underline cursor-pointer"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        )}

        {activeTab === 'works' && (
          <div>
            {!showForm ? (
               <button type="button" onClick={() => setShowForm(true)} className="mb-8 px-6 py-3 bg-[#b20000] text-white font-bold uppercase text-xs tracking-widest">Register New Work</button>
            ) : (
              <div className="bg-white p-8 border border-black space-y-6 mb-12 shadow-lg">
                 <h3 className="font-bold uppercase text-sm border-b-2 border-black pb-2">Art Work Archive Entry</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <FormLabel required>Work Title</FormLabel>
                     <AdminInput placeholder="Enter title" value={newWork.title || ''} onChange={e => setNewWork({...newWork, title: e.target.value})} />
                   </div>
                   <div className="space-y-4">
                     <FormLabel>Creation Year</FormLabel>
                     <AdminInput placeholder="YYYY" value={newWork.date || ''} onChange={e => setNewWork({...newWork, date: e.target.value})} />
                   </div>
                   <div className="col-span-2 space-y-4">
                     <FormLabel>Conceptual Description</FormLabel>
                     <AdminTextarea rows={6} placeholder="Artistic concept" value={newWork.description || ''} onChange={e => setNewWork({...newWork, description: e.target.value})} />
                   </div>
                 </div>
                 <div className="border-t pt-6">
                    <FormLabel required>Media Documentation</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {newWork.media?.map((p, i) => (
                        <div key={i} className="relative border p-1 bg-white flex flex-col">
                          {p.type === 'video' ? (
                            <div className="aspect-square bg-black flex items-center justify-center text-white text-[8px] uppercase">Video</div>
                          ) : (
                            <img src={p.url} className="aspect-square object-cover" />
                          )}
                          <button type="button" onClick={() => setNewWork({...newWork, media: newWork.media?.filter((_, idx) => idx !== i)})} className="absolute top-1 right-1 bg-[#b20000] text-white w-5 h-5 flex items-center justify-center text-[10px] font-bold">×</button>
                        </div>
                      ))}
                      <label className="border-2 border-dashed flex flex-col items-center justify-center aspect-square cursor-pointer bg-white hover:bg-gray-50">
                        <input type="file" multiple className="hidden" onChange={e => handleMediaUpload(e, 'work')} />
                        <span className="text-[10px] font-bold text-gray-400">+ ADD FILE</span>
                      </label>
                    </div>
                 </div>
                 <div className="flex gap-4 pt-6 border-t">
                   <button type="button" onClick={handleSaveWork} className="px-8 py-3 bg-black text-white font-bold uppercase text-xs tracking-widest">Commit</button>
                   <button type="button" onClick={resetForms} className="px-8 py-3 border border-black font-bold uppercase text-xs">Cancel</button>
                 </div>
              </div>
            )}
            <div className="space-y-4">
              {works.map((item: WorkItem) => (
                <div key={item.id} className="flex justify-between items-center p-5 bg-white border border-gray-200 uppercase text-xs">
                  <span>{item.title} <span className="text-[#b20000] ml-4">[{item.date}]</span></span>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => handleEditWork(item)} className="font-bold hover:underline">EDIT</button>
                    <button 
                      type="button"
                      onClick={(e) => onDeleteWork(e, item.id)} 
                      className="text-[#b20000] font-bold hover:underline cursor-pointer"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-12 bg-white p-8 border border-black">
            <div className="flex flex-col md:flex-row gap-12">
              <div className="w-full md:w-1/3">
                 <FormLabel>Artist Identity Photo</FormLabel>
                 <div className="relative border border-black overflow-hidden group">
                    <img src={editAbout.photo} className="w-full grayscale" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <input type="file" id="about-photo" className="hidden" onChange={e => handleMediaUpload(e, 'about')} />
                       <label htmlFor="about-photo" className="cursor-pointer bg-white px-4 py-2 text-[10px] font-bold uppercase">Change Image</label>
                    </div>
                 </div>
                 <div className="mt-8 border-t border-black pt-4">
                    <FormLabel>Birth Date Record</FormLabel>
                    <AdminInput value={editAbout.birthDate} onChange={e => setEditAbout({...editAbout, birthDate: e.target.value})} />
                 </div>
              </div>
              <div className="w-full md:w-2/3 space-y-8">
                 <div className="space-y-4">
                    <FormLabel>Biographical Record</FormLabel>
                    <AdminTextarea rows={12} className="text-sm leading-relaxed" value={editAbout.text} onChange={e => setEditAbout({...editAbout, text: e.target.value})} />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Solo Exhibitions Management */}
                    <div className="space-y-4">
                       <FormLabel>/ Solo Exhibitions</FormLabel>
                       <div className="space-y-2 mb-4">
                          {editAbout.soloExhibitions.map((item, idx) => (
                             <div key={idx} className="flex items-start justify-between gap-4 p-2 border border-gray-100 bg-gray-50 text-[10px] uppercase font-medium">
                                <span>{item}</span>
                                <button type="button" onClick={() => removeSoloExhib(idx)} className="text-[#b20000] font-bold shrink-0">REMOVE</button>
                             </div>
                          ))}
                       </div>
                       <div className="flex gap-2">
                          <AdminInput placeholder="YYYY - Title, Location" value={newSoloExhib} onChange={e => setNewSoloExhib(e.target.value)} />
                          <button type="button" onClick={addSoloExhib} className="px-4 bg-black text-white text-[10px] font-bold uppercase">ADD</button>
                       </div>
                    </div>

                    {/* Group Exhibitions Management */}
                    <div className="space-y-4">
                       <FormLabel>/ Group Exhibitions</FormLabel>
                       <div className="space-y-2 mb-4">
                          {editAbout.groupExhibitions.map((item, idx) => (
                             <div key={idx} className="flex items-start justify-between gap-4 p-2 border border-gray-100 bg-gray-50 text-[10px] uppercase font-medium">
                                <span>{item}</span>
                                <button type="button" onClick={() => removeGroupExhib(idx)} className="text-[#b20000] font-bold shrink-0">REMOVE</button>
                             </div>
                          ))}
                       </div>
                       <div className="flex gap-2">
                          <AdminInput placeholder="YYYY - Title, Location" value={newGroupExhib} onChange={e => setNewGroupExhib(e.target.value)} />
                          <button type="button" onClick={addGroupExhib} className="px-4 bg-black text-white text-[10px] font-bold uppercase">ADD</button>
                       </div>
                    </div>
                 </div>

                 <button type="button" onClick={() => setAbout(editAbout)} className="w-full py-4 bg-black text-white font-bold uppercase text-xs tracking-widest hover:bg-[#b20000] transition-colors">Commit Data</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-md mx-auto space-y-12 py-12">
            <div className="space-y-6 border-b border-black pb-12">
              <h3 className="font-black uppercase text-sm tracking-widest">Security: Admin Password</h3>
              <div className="space-y-4">
                <FormLabel>New Password</FormLabel>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-4 border-2 border-black bg-white text-black font-bold outline-none"
                  placeholder="Enter new password"
                />
                <button 
                  type="button"
                  onClick={async () => {
                    if(newPassword.length < 4) return alert("Password too short (min 4 chars)");
                    const hash = await hashPassword(newPassword);
                    setPasswordHash(hash);
                    setNewPassword('');
                    alert("Password hashed and updated successfully");
                  }}
                  className="w-full py-4 bg-black text-white font-black uppercase text-xs tracking-widest hover:bg-[#b20000]"
                >
                  Update & Hash Password
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black uppercase text-sm tracking-widest">Current Session</h3>
              <button 
                type="button"
                onClick={handleLogout}
                className="w-full py-4 border-2 border-black bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-black hover:text-white transition-all"
              >
                Logout Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [exhibitions, setExhibitions] = useState<ExhibitionItem[]>([]);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [about, setAbout] = useState<AboutData>(INITIAL_ABOUT);
  const [contact] = useState<ContactData>(INITIAL_CONTACT);
  const [passwordHash, setPasswordHash] = useState(DEFAULT_PASS_HASH);

  // --- INITIAL LOAD & MIGRATION ---
  useEffect(() => {
    const loadData = async () => {
      try {
        let n = await dbGet('news');
        let e = await dbGet('exhibitions');
        let w = await dbGet('works');
        let a = await dbGet('about');
        let ph = await dbGet('admin_password_hash');

        if (!n && !e && !w && !a) {
          n = INITIAL_NEWS;
          e = INITIAL_EXHIBITIONS;
          w = INITIAL_WORKS;
          a = INITIAL_ABOUT;
        }

        setNews(n || INITIAL_NEWS);
        setExhibitions(e || INITIAL_EXHIBITIONS);
        setWorks(w || INITIAL_WORKS);
        setAbout(a || INITIAL_ABOUT);
        setPasswordHash(ph || DEFAULT_PASS_HASH);
      } catch (err) {
        console.error("Storage loading error:", err);
        setPasswordHash(DEFAULT_PASS_HASH); 
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => {
    if (!isLoaded) return;
    const persist = async () => {
      try {
        await dbSet('news', news);
        await dbSet('exhibitions', exhibitions);
        await dbSet('works', works);
        await dbSet('about', about);
        await dbSet('admin_password_hash', passwordHash);
      } catch (err) {}
    };
    persist();
  }, [news, exhibitions, works, about, passwordHash, isLoaded]);

  if (!isLoaded) return <div className="min-h-screen bg-white flex items-center justify-center uppercase font-bold text-[10px] tracking-widest text-black">Decrypting Archive...</div>;

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-white text-black selection:bg-black selection:text-white">
        <Navigation />
        <main className="flex-grow pb-24">
          <Routes>
            <Route path="/" element={<Home items={exhibitions} />} />
            <Route path="/exhibition/:id" element={<ExhibitionDetail items={exhibitions} />} />
            <Route path="/news" element={<NewsList items={news} />} />
            <Route path="/works" element={<WorksPage items={works} />} />
            <Route path="/work/:id" element={<WorkDetail items={works} />} />
            <Route path="/about" element={<AboutPage data={about} />} />
            <Route path="/contact" element={<ContactPage data={contact} />} />
            <Route path="/admin" element={
              <AdminPanel 
                news={news} setNews={setNews}
                exhibitions={exhibitions} setExhibitions={setExhibitions}
                works={works} setWorks={setWorks}
                about={about} setAbout={setAbout}
                passwordHash={passwordHash} setPasswordHash={setPasswordHash}
              />
            } />
          </Routes>
        </main>
        <footer className="bg-black text-white py-12 px-4 md:px-8 mt-auto">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
            <Link to="/" className="text-xl font-bold tracking-tighter uppercase leading-none hover:text-[#b20000]">KOVACH PAVLO</Link>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {NAV_ITEMS.map((item) => (
                <Link key={item.path} to={item.path} className={`text-[11px] font-bold uppercase tracking-widest ${item.color || 'hover:text-gray-400'}`}>{item.name}</Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
}
