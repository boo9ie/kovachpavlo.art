
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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

import { Navigation, NAV_ITEMS } from './components/Shared/Navigation';



import { Home } from './components/Public/Home';
import { ExhibitionDetail } from './components/Public/ExhibitionDetail';
import { WorkDetail } from './components/Public/WorkDetail';
import { NewsList } from './components/Public/NewsList';
import { WorksPage } from './components/Public/WorksPage';
import { AboutPage } from './components/Public/AboutPage';
import { ContactPage } from './components/Public/ContactPage';
import { AdminPanel } from "./components/Admin/AdminPanel";


export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [exhibitions, setExhibitions] = useState<ExhibitionItem[]>([]);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [about, setAbout] = useState<AboutData>(INITIAL_ABOUT);
  const [contact, setContact] = useState<ContactData>(INITIAL_CONTACT);


  // --- INITIAL LOAD & MIGRATION ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiGet(API_DATA_URL);
        
        if (data && !data.error) {
          setNews(data.news || INITIAL_NEWS);
          setExhibitions(data.exhibitions || INITIAL_EXHIBITIONS);
          setWorks(data.works || INITIAL_WORKS);
          setAbout(data.about || INITIAL_ABOUT);
          setContact(data.contact || INITIAL_CONTACT);
        } else {
          setNews(INITIAL_NEWS);
          setExhibitions(INITIAL_EXHIBITIONS);
          setWorks(INITIAL_WORKS);
          setAbout(INITIAL_ABOUT);
          setContact(INITIAL_CONTACT);
        }
      } catch (err) {
        console.error("Data loading error:", err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // --- PERSISTENCE ---
  const initialLoadRef = useRef(true);
  
  useEffect(() => {
    if (!isLoaded) return;
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
  }, [news, exhibitions, works, about, contact, isLoaded]);

  if (!isLoaded) return <div className="min-h-screen bg-white flex items-center justify-center uppercase font-bold text-[10px] tracking-widest text-black">Decrypting Archive...</div>;

  return (
    <BrowserRouter>
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
              />
            } />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}
