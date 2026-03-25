
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
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

import { DEFAULT_PASS_HASH } from './utils/auth';
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
  const [passwordHash, setPasswordHash] = useState(DEFAULT_PASS_HASH);

  // --- INITIAL LOAD & MIGRATION ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiGet(API_DATA_URL);
        
        if (data) {
          setNews(data.news || INITIAL_NEWS);
          setExhibitions(data.exhibitions || INITIAL_EXHIBITIONS);
          setWorks(data.works || INITIAL_WORKS);
          setAbout(data.about || INITIAL_ABOUT);
          setContact(data.contact || INITIAL_CONTACT);
          setPasswordHash(data.admin_password_hash || DEFAULT_PASS_HASH);
        } else {
          setNews(INITIAL_NEWS);
          setExhibitions(INITIAL_EXHIBITIONS);
          setWorks(INITIAL_WORKS);
          setAbout(INITIAL_ABOUT);
          setPasswordHash(DEFAULT_PASS_HASH);
        }
      } catch (err) {
        console.error("Data loading error:", err);
        setPasswordHash(DEFAULT_PASS_HASH); 
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
            contact,
            admin_password_hash: passwordHash
        };
        await apiPost(API_SAVE_URL, payload);
      } catch (err) {}
    };
    persist();
  }, [news, exhibitions, works, about, contact, passwordHash, isLoaded]);

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
            <Link to="/" className="text-xl font-bold tracking-tighter uppercase leading-none hover:text-[#b20000]">PAVLO KOVACH</Link>
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
