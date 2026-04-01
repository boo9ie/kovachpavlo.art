
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { 
  INITIAL_NEWS, 
  INITIAL_EXHIBITIONS, 
  INITIAL_WORKS, 
  INITIAL_ABOUT, 
  INITIAL_CONTACT 
} from './constants';
import { 
  NewsItem, ExhibitionItem, WorkItem, AboutData, ContactData 
} from './types';

import { API_DATA_URL, API_SAVE_URL, apiPost, apiGet } from './utils/api';

import { Navigation } from './components/Shared/Navigation';
import { SeoManager } from './components/Shared/SeoManager';
import { Home } from './components/Public/Home';
import { ExhibitionDetail } from './components/Public/ExhibitionDetail';
import { WorkDetail } from './components/Public/WorkDetail';
import { NewsList } from './components/Public/NewsList';
import { WorksPage } from './components/Public/WorksPage';
import { AboutPage } from './components/Public/AboutPage';
import { ContactPage } from './components/Public/ContactPage';
import { AdminPanel } from "./components/Admin/AdminPanel";

const IS_DEVELOPMENT = import.meta.env.DEV;

const EMPTY_ABOUT: AboutData = {
  photo: '',
  text: '',
  birthDate: '',
  soloExhibitions: [],
  groupExhibitions: []
};

const EMPTY_CONTACT: ContactData = {
  email: '',
  facebook: '',
  whatsapp: ''
};

const DEVELOPMENT_CONTENT = {
  news: INITIAL_NEWS,
  exhibitions: INITIAL_EXHIBITIONS,
  works: INITIAL_WORKS,
  about: INITIAL_ABOUT,
  contact: INITIAL_CONTACT
};

const EMPTY_CONTENT = {
  news: [] as NewsItem[],
  exhibitions: [] as ExhibitionItem[],
  works: [] as WorkItem[],
  about: EMPTY_ABOUT,
  contact: EMPTY_CONTACT
};

const isValidContentPayload = (value: any): value is {
  news: NewsItem[];
  exhibitions: ExhibitionItem[];
  works: WorkItem[];
  about: AboutData;
  contact: ContactData;
} => {
  return Boolean(
    value &&
    Array.isArray(value.news) &&
    Array.isArray(value.exhibitions) &&
    Array.isArray(value.works) &&
    value.about &&
    typeof value.about === 'object' &&
    value.contact &&
    typeof value.contact === 'object'
  );
};

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [exhibitions, setExhibitions] = useState<ExhibitionItem[]>([]);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [about, setAbout] = useState<AboutData>(IS_DEVELOPMENT ? INITIAL_ABOUT : EMPTY_ABOUT);
  const [contact, setContact] = useState<ContactData>(IS_DEVELOPMENT ? INITIAL_CONTACT : EMPTY_CONTACT);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const applyContent = (content: {
      news: NewsItem[];
      exhibitions: ExhibitionItem[];
      works: WorkItem[];
      about: AboutData;
      contact: ContactData;
    }) => {
      setNews(content.news);
      setExhibitions(content.exhibitions);
      setWorks(content.works);
      setAbout(content.about);
      setContact(content.contact);
    };

    const loadData = async () => {
      try {
        const data = await apiGet(API_DATA_URL);

        if (isValidContentPayload(data) && !data.error) {
          applyContent(data);
          setLoadError(null);
        } else if (IS_DEVELOPMENT) {
          applyContent(DEVELOPMENT_CONTENT);
          setLoadError(null);
        } else {
          applyContent(EMPTY_CONTENT);
          setLoadError('Unable to load live site content right now. Please try again later.');
        }
      } catch {
        if (IS_DEVELOPMENT) {
          applyContent(DEVELOPMENT_CONTENT);
          setLoadError(null);
        } else {
          applyContent(EMPTY_CONTENT);
          setLoadError('Unable to load live site content right now. Please try again later.');
        }
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // --- PERSISTENCE ---
  const initialLoadRef = useRef(true);
  
  useEffect(() => {
    if (!isLoaded || loadError) return;
    if (initialLoadRef.current) {
        initialLoadRef.current = false;
        return;
    }
    const persist = async () => {
      try {
        const payload = {
            news,
            exhibitions,
            works,
            about,
            contact
        };
        await apiPost(API_SAVE_URL, payload);
      } catch (err) {}
    };
    persist();
  }, [news, exhibitions, works, about, contact, isLoaded, loadError]);

  if (!isLoaded) return <div className="min-h-screen bg-white flex items-center justify-center uppercase font-bold text-[10px] tracking-widest text-black">Decrypting Archive...</div>;
  if (loadError) {
    return (
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-white text-black selection:bg-black selection:text-white">
          <Navigation />
          <main className="flex-grow flex items-center justify-center px-4 md:px-8">
            <div className="max-w-xl border-2 border-black bg-white p-10 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#b20000] mb-4">Content Error</p>
              <h1 className="text-3xl font-black uppercase tracking-tight mb-4">Live Content Is Temporarily Unavailable</h1>
              <p className="text-sm leading-relaxed text-gray-700">{loadError}</p>
            </div>
          </main>
        </div>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-white text-black selection:bg-black selection:text-white">
        <SeoManager exhibitions={exhibitions} works={works} />
        <Navigation />
        <main className="flex-grow pb-24">
          <Routes>
            <Route path="/" element={<Home items={exhibitions} />} />
            <Route path="/exhibitions" element={<Home items={exhibitions} />} />
            <Route path="/exhibition/:id" element={<ExhibitionDetail items={exhibitions} />} />
            <Route path="/news" element={<NewsList items={news} />} />
            <Route path="/works" element={<WorksPage items={works} />} />
            <Route path="/works/:id" element={<WorkDetail items={works} />} />
            <Route path="/about" element={<AboutPage data={about} />} />
            <Route path="/contact" element={<ContactPage data={contact} />} />
            <Route path="/admin" element={
              <AdminPanel 
                news={news} setNews={setNews}
                exhibitions={exhibitions} setExhibitions={setExhibitions}
                works={works} setWorks={setWorks}
                about={about} setAbout={setAbout}
                contact={contact} setContact={setContact}
              />
            } />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}
