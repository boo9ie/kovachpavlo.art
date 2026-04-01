import React, { useState, useEffect } from 'react';
import { NewsItem, ExhibitionItem, WorkItem, AboutData, ContactData } from '../../types';
import { API_SAVE_URL, API_UPLOAD_URL, API_LOGIN_URL, API_LOGOUT_URL, API_AUTH_STATUS_URL, apiPost, apiGet } from '../../utils/api';
import { FormLabel, AdminInput, AdminTextarea } from '../Shared/SharedUI';

const isValidNewsUrl = (value: string) => {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export const AdminPanel = ({ 
  news, setNews, 
  exhibitions, setExhibitions, 
  works, setWorks,
  about, setAbout,
  contact, setContact
}: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState('news');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form States
  const [newNews, setNewNews] = useState<Partial<NewsItem>>({});
  const [newExhib, setNewExhib] = useState<Partial<ExhibitionItem>>({ photos: [] });
  const [newWork, setNewWork] = useState<Partial<WorkItem>>({ media: [] });
  const [editAbout, setEditAbout] = useState<AboutData>(about);
  const [editContact, setEditContact] = useState<ContactData>(contact);
  
  // Local states for exhibition list management
  const [newSoloExhib, setNewSoloExhib] = useState('');
  const [newGroupExhib, setNewGroupExhib] = useState('');

  useEffect(() => {
    // Check server session
    apiGet(API_AUTH_STATUS_URL).then((res: any) => {
      setIsAuthenticated(res?.authenticated === true);
      setAuthChecking(false);
    });
  }, []);

  useEffect(() => {
    setEditAbout(about);
  }, [about]);

  useEffect(() => {
    setEditContact(contact);
  }, [contact]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(API_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: loginInput.trim() })
      });
      const res = await response.json();
      
      if (res.success) {
        setIsAuthenticated(true);
        setLoginError('');
        setLoginInput('');
      } else {
        throw new Error(res.error || 'Invalid password');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to log in';
      setLoginError(message);
      setLoginInput('');
    }
  };

  const resetForms = () => {
    setShowForm(false);
    setEditingId(null);
    setNewNews({});
    setNewExhib({ photos: [] });
    setNewWork({ media: [] });
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleLogout = async () => {
    await fetch(API_LOGOUT_URL, { method: 'POST', credentials: 'include' });
    setIsAuthenticated(false);
    setLoginError('');
    setLoginInput('');
  };

  const handleClearStorage = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm("This action will DELETE ALL ARCHIVE DATA. Are you sure?")) {
      await apiPost(API_SAVE_URL, {
        news: [],
        exhibitions: [],
        works: [],
        about: { photo: '', text: '', birthDate: '', soloExhibitions: [], groupExhibitions: [] },
        contact: { email: '', facebook: '', whatsapp: '' }
      });
      window.location.reload();
    }
  };

  // Deletion Handlers with confirmation
  const onDeleteNews = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this news event?")) {
      setNews((prev: NewsItem[]) => prev.filter(item => String(item.id) !== String(id)));
    }
  };

  const onDeleteExhibition = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this exhibition event?")) {
      setExhibitions((prev: ExhibitionItem[]) => prev.filter(item => String(item.id) !== String(id)));
    }
  };

  const onDeleteWork = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this work event?")) {
      setWorks((prev: WorkItem[]) => prev.filter(item => String(item.id) !== String(id)));
    }
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

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'exhib' | 'work' | 'news' | 'about') => {
    const files = e.target.files;
    if (files) {
      setIsUploading(true);
      const fileList = Array.from(files) as File[];
      let processed = 0;

      for (const file of fileList) {
        const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
        if (file.size > MAX_SIZE) {
          alert(`File ${file.name} is too large.`);
          processed++;
          if (processed === fileList.length) setIsUploading(false);
          continue;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          setUploadProgress(0);
          const res = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', API_UPLOAD_URL);
            xhr.withCredentials = true;
            
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percentComplete);
              }
            };
            
            xhr.onload = () => {
              if (xhr.status === 200) {
                try {
                  resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                  reject(new Error("Invalid JSON response"));
                }
              } else {
                reject(new Error(xhr.statusText));
              }
            };
            
            xhr.onerror = () => reject(new Error('Network Error'));
            xhr.send(formData);
          });
          
          const data: any = res;
          
          if (data.success && data.url) {
            const url = data.url;
            const type = file.type.startsWith('video') ? 'video' : 'image';
            
            if (target === 'exhib') {
              setNewExhib((prev: any) => ({ ...prev, photos: [...(prev.photos || []), { url, type, photographer: '' }] }));
            } else if (target === 'work') {
              setNewWork((prev: any) => ({ ...prev, media: [...(prev.media || []), { url, type, photographer: '' }] }));
            } else if (target === 'news') {
              setNewNews((prev: any) => ({ ...prev, photo: url }));
            } else if (target === 'about') {
              setEditAbout((prev: any) => ({ ...prev, photo: url }));
            }
          } else {
             alert(`Failed to upload ${file.name}`);
          }
        } catch (err: any) {
          if (err.message === 'Unauthorized' || err.message.includes('401')) {
            alert("Сесія завершилася. Будь ласка, увійдіть знову.");
            handleLogout();
            return;
          }
          alert(`Error uploading ${file.name}: ${err.message || 'Unknown network error. File may be too large.'}`);
        }

        processed++;
        setUploadProgress(0);
        if (processed === fileList.length) setIsUploading(false);
      }
    }
  };

  const handleSaveNews = () => {
    const trimmedUrl = (newNews.url || '').trim();

    if (!newNews.title || !newNews.photo || !trimmedUrl) {
      return alert("News title, URL, and cover image are required.");
    }

    if (!isValidNewsUrl(trimmedUrl)) {
      return alert("Please enter a valid news URL starting with http:// or https://");
    }

    if (editingId) {
      setNews(news.map((item: NewsItem) => item.id === editingId ? { ...item, ...newNews, url: trimmedUrl } : item));
    } else {
      setNews([{ ...newNews, id: Date.now().toString(), date: newNews.date || new Date().toLocaleDateString(), url: trimmedUrl } as NewsItem, ...news]);
    }
    resetForms();
  };

  const handleSaveExhib = () => {
    if (!newExhib.title || !newExhib.photos?.length) return alert("Required fields are empty");
    if (editingId) {
      setExhibitions(exhibitions.map((item: ExhibitionItem) => item.id === editingId ? { ...item, ...newExhib } : item));
    } else {
      setExhibitions([{ ...newExhib, id: Date.now().toString(), author: 'Pavlo Kovach', date: newExhib.date || new Date().toLocaleDateString(), location: newExhib.location || 'Unknown' } as ExhibitionItem, ...exhibitions]);
    }
    resetForms();
  };

  const handleSaveWork = () => {
    if (!newWork.title || !newWork.media?.length) return alert("Required fields are empty");
    if (editingId) {
      setWorks(works.map((item: WorkItem) => item.id === editingId ? { ...item, ...newWork } : item));
    } else {
      setWorks([{ ...newWork, id: Date.now().toString(), author: 'Pavlo Kovach', date: newWork.date || new Date().getFullYear().toString() } as WorkItem, ...works]);
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

  if (authChecking) {
    return <div className="min-h-screen bg-white flex items-center justify-center uppercase font-bold text-[10px] tracking-widest text-black">Verifying Access...</div>;
  }

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
              onChange={e => setLoginInput(e.target.value)}
              className="w-full p-4 border-2 border-black bg-white text-black outline-none font-bold placeholder:text-gray-300 transition-opacity"
              placeholder="••••••••"
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            className="w-full text-white p-4 font-black uppercase tracking-widest transition-colors bg-black hover:bg-[#b20000]"
          >
            ENTER
          </button>
          <div className="flex flex-col items-center gap-2">
            {loginError && <p className="text-[10px] text-[#b20000] font-bold uppercase text-center">{loginError}</p>}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-baseline border-b border-black mb-4 mt-12">
        <div className="flex gap-4 overflow-x-auto pb-4 uppercase text-[10px] font-bold">
          {['news', 'exhibitions', 'works', 'about', 'contact'].map(tab => (
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
          <div className="mb-8 p-4 bg-black text-white uppercase text-[10px] font-bold text-center">
            <div className="mb-2 animate-pulse">Uploading Media... {uploadProgress}%</div>
            <div className="w-full bg-gray-800 h-1">
              <div className="bg-[#b20000] h-1 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
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
                    <FormLabel>News Date</FormLabel>
                    <AdminInput placeholder="YYYY-MMM-DD" value={newNews.date || ''} onChange={e => setNewNews({...newNews, date: e.target.value})} />
                    <FormLabel required>External URL</FormLabel>
                    <AdminInput placeholder="https://..." value={newNews.url || ''} onChange={e => setNewNews({...newNews, url: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <FormLabel required>Thumbnail Photo</FormLabel>
                    {newNews.photo ? (
                      <div className="relative"><img src={newNews.photo} className="w-full h-40 object-cover border" /><button type="button" onClick={() => setNewNews({...newNews, photo: undefined})} className="absolute top-2 right-2 bg-black text-white p-1 text-[8px] uppercase">Change</button></div>
                    ) : (
                      <div className="w-full h-40 border-2 border-dashed border-gray-300 flex flex-col gap-2 items-center justify-center bg-white">
                        <input type="file" accept="image/*" className="hidden" id="news-up" onChange={e => handleMediaUpload(e, 'news')} />
                        <label htmlFor="news-up" className="cursor-pointer uppercase text-[10px] font-bold text-gray-400 hover:text-black transition-colors">Upload Thumbnail</label>
                        <span className="text-[9px] text-gray-400 text-center uppercase leading-tight font-medium px-2">Max: 2GB<br/>Formats: JPG, PNG, WEBP</span>
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
                     <AdminInput placeholder="YYYY-MMM-DD" value={newExhib.date || ''} onChange={e => setNewExhib({...newExhib, date: e.target.value})} />
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
                      <label className="border-2 border-dashed flex flex-col items-center justify-center aspect-square cursor-pointer bg-white hover:bg-gray-50 p-2 text-center transition-colors">
                        <input type="file" multiple className="hidden" onChange={e => handleMediaUpload(e, 'exhib')} />
                        <span className="text-[10px] font-bold text-gray-400 mb-1.5 hover:text-black transition-colors">+ ADD MEDIA</span>
                        <span className="text-[8px] text-gray-400 uppercase leading-tight font-medium">Max: 2GB per file<br/>Photo: JPG, PNG<br/>Video: MP4 (H.264), WEBM</span>
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
                      <label className="border-2 border-dashed flex flex-col items-center justify-center aspect-square cursor-pointer bg-white hover:bg-gray-50 p-2 text-center transition-colors">
                        <input type="file" multiple className="hidden" onChange={e => handleMediaUpload(e, 'work')} />
                        <span className="text-[10px] font-bold text-gray-400 mb-1.5 hover:text-black transition-colors">+ ADD FILE</span>
                        <span className="text-[8px] text-gray-400 uppercase leading-tight font-medium">Max: 2GB per file<br/>Photo: JPG, PNG<br/>Video: MP4 (H.264), WEBM</span>
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
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                       <input type="file" id="about-photo" accept="image/*" className="hidden" onChange={e => handleMediaUpload(e, 'about')} />
                       <label htmlFor="about-photo" className="cursor-pointer bg-white px-4 py-2 text-[10px] font-bold uppercase transition-colors hover:bg-gray-200">Change Image</label>
                       <span className="text-[9px] text-white/90 text-center uppercase leading-tight font-medium px-2">Max: 2GB<br/>Formats: JPG, PNG, WEBP</span>
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

                 <button
                   type="button"
                   onClick={() => {
                     setAbout(editAbout);
                   }}
                   className="w-full py-4 bg-black text-white font-bold uppercase text-xs tracking-widest hover:bg-[#b20000] transition-colors"
                 >
                   Commit About Data
                 </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-8 bg-white p-8 border border-black max-w-3xl">
            <div className="space-y-2">
              <h3 className="font-bold uppercase text-sm border-b-2 border-black pb-2">Public Contact Details</h3>
              <p className="text-xs text-gray-500">These fields are saved into `private/content.json` and rendered on the public contact page.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FormLabel required>Email</FormLabel>
                <AdminInput
                  type="email"
                  value={editContact.email}
                  onChange={e => setEditContact({ ...editContact, email: e.target.value })}
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-2">
                <FormLabel required>WhatsApp / Phone</FormLabel>
                <AdminInput
                  value={editContact.whatsapp}
                  onChange={e => setEditContact({ ...editContact, whatsapp: e.target.value })}
                  placeholder="+380..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <FormLabel>Facebook Username or URL</FormLabel>
                <AdminInput
                  value={editContact.facebook}
                  onChange={e => setEditContact({ ...editContact, facebook: e.target.value })}
                  placeholder="pavlo.kovach or https://facebook.com/pavlo.kovach"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setContact(editContact)}
              className="w-full py-4 bg-black text-white font-bold uppercase text-xs tracking-widest hover:bg-[#b20000] transition-colors"
            >
              Commit Contact Data
            </button>
          </div>
        )}


      </div>
    </div>
  );
};
