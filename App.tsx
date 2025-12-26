import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Book, Bookmark, Map, X, ChevronLeft, 
  Settings, Check, Download, Share2, WifiOff, RefreshCw
} from 'lucide-react';
import { DictionaryEntry, TabView, AppSettings } from './types';
import { ROADMAP_DATA, GOOGLE_SHEET_CSV_URL } from './constants';
import { fetchGoogleSheetData } from './services/sheetService';
import { AkhaPattern, SectionDivider } from './components/AkhaPattern';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.SEARCH);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  const [settings, setSettings] = useState<AppSettings>({
    fontFamily: 'Sarabun',
    sizeScale: 'medium',
    themeColor: 'red'
  });

  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dailyWord, setDailyWord] = useState<DictionaryEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showToast("คุณกลับมาออนไลน์แล้ว"); syncWithSheet(); };
    const handleOffline = () => { setIsOnline(false); showToast("คุณกำลังใช้งานแบบออฟไลน์"); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setInstallPrompt(e); });
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => setInstallPrompt(null));
    } else {
      alert("วิธีติดตั้งบนมือถือ:\n\niPhone: กดปุ่ม 'แชร์' > 'เพิ่มไปยังหน้าจอโฮม'\nAndroid: กดปุ่ม 'เมนู' > 'ติดตั้งแอป'");
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const syncWithSheet = useCallback(async () => {
    if (!GOOGLE_SHEET_CSV_URL) { setIsLoadingData(false); return; }
    setIsLoadingData(true);
    try {
      const sheetData = await fetchGoogleSheetData(GOOGLE_SHEET_CSV_URL);
      if (sheetData && sheetData.length > 0) {
        setEntries(sheetData);
        // เลือกคำศัพท์ประจำวัน
        const random = sheetData[Math.floor(Math.random() * sheetData.length)];
        setDailyWord(random);
      }
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const savedBookmarks = localStorage.getItem('akha_bookmarks');
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    syncWithSheet();
  }, [syncWithSheet]);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isAdding = !bookmarks.includes(id);
    const newBookmarks = isAdding ? [...bookmarks, id] : bookmarks.filter(b => b !== id);
    setBookmarks(newBookmarks);
    localStorage.setItem('akha_bookmarks', JSON.stringify(newBookmarks));
    showToast(isAdding ? "บันทึกแล้ว" : "นำออกแล้ว");
  };

  const filteredEntries = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return entries.filter(entry => 
      entry.akha.toLowerCase().includes(lowerQuery) || 
      entry.thai.toLowerCase().includes(lowerQuery) ||
      entry.english.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, entries]);

  const displayedEntries = activeTab === TabView.BOOKMARKS
    ? entries.filter(e => bookmarks.includes(e.id))
    : filteredEntries;

  return (
    <div className="h-full bg-zinc-50 flex flex-col w-full mx-auto overflow-hidden select-none" style={{ paddingTop: 'var(--sat)', paddingBottom: 'var(--sab)' }}>
      {/* Network Status Header */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-[10px] font-bold py-1 px-4 flex items-center justify-center gap-2">
          <WifiOff className="w-3 h-3" /> โหมดออฟไลน์: ข้อมูลอาจไม่อัปเดต
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
            <Check className="w-3 h-3 text-green-400" /> {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-zinc-900 text-white p-6 relative flex-shrink-0 shadow-lg overflow-hidden">
        <AkhaPattern className="opacity-10 absolute top-0 left-0 w-full" />
        <div className="relative z-10 flex justify-between items-center mb-6">
          <h1 className="text-xl font-black italic tracking-tighter uppercase">Akha Dictionary</h1>
          <div className="flex gap-2">
            <button onClick={syncWithSheet} className={`p-2 bg-white/5 rounded-xl border border-white/10 ${isLoadingData ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-white/5 rounded-xl border border-white/10">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeTab === TabView.SEARCH && !selectedEntry && (
          <div className="relative z-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาอาข่า, ไทย, อังกฤษ..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:bg-white/10 placeholder:text-white/20"
            />
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-24 relative">
        {isLoadingData && entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-20">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">กำลังดึงข้อมูล...</p>
          </div>
        ) : (
          <>
            {activeTab === TabView.SEARCH && !searchQuery && dailyWord && (
              <div className="mb-8 animate-fade-in">
                <SectionDivider title="Daily Word" />
                <div onClick={() => setSelectedEntry(dailyWord)} className="bg-red-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-red-900/10 relative overflow-hidden active:scale-95 transition-all">
                  <AkhaPattern className="absolute -right-10 -bottom-4 w-48 opacity-10 rotate-12" />
                  <h3 className="text-4xl font-black mb-1">{dailyWord.akha}</h3>
                  <p className="text-lg opacity-80">{dailyWord.thai}</p>
                </div>
              </div>
            )}

            <SectionDivider title={activeTab === TabView.BOOKMARKS ? 'My Saved' : 'Glossary'} />
            
            <div className="space-y-2.5">
              {displayedEntries.map(entry => (
                <div key={entry.id} onClick={() => setSelectedEntry(entry)} className="bg-white p-5 rounded-2xl border border-zinc-100 flex justify-between items-center shadow-sm active:bg-zinc-50 transition-all">
                  <div>
                    <h4 className="font-black text-zinc-900 text-lg leading-tight">{entry.akha}</h4>
                    <p className="text-xs text-zinc-400 font-bold mt-1.5"><span className="text-red-500">/</span> {entry.thai}</p>
                  </div>
                  <Bookmark className={`w-5 h-5 ${bookmarks.includes(entry.id) ? 'fill-red-500 text-red-500' : 'text-zinc-200'}`} onClick={(e) => toggleBookmark(entry.id, e)} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Entry Detail View */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-up">
            <div className="p-4 flex items-center justify-between border-b border-zinc-50 sticky top-0 bg-white/90 backdrop-blur-md">
              <button onClick={() => setSelectedEntry(null)} className="p-2 -ml-2 text-zinc-400"><ChevronLeft className="w-6 h-6" /></button>
              <h2 className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-zinc-100 rounded-full">{selectedEntry.category}</h2>
              <Bookmark className={`w-5 h-5 ${bookmarks.includes(selectedEntry.id) ? 'fill-red-500 text-red-500' : 'text-zinc-200'}`} onClick={() => toggleBookmark(selectedEntry.id)} />
            </div>
            <div className="p-8">
              <h1 className="text-6xl font-black text-zinc-900 tracking-tighter">{selectedEntry.akha}</h1>
              <p className="text-2xl text-zinc-400 italic mt-1">/{selectedEntry.akhaPronunciation}/</p>
              
              <div className="grid gap-3 mt-10">
                <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                  <p className="text-[9px] font-black uppercase text-zinc-300 mb-2 tracking-widest">ความหมายไทย</p>
                  <p className="text-2xl font-black text-zinc-800">{selectedEntry.thai}</p>
                </div>
                <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                  <p className="text-[9px] font-black uppercase text-zinc-300 mb-2 tracking-widest">English</p>
                  <p className="text-2xl font-black text-zinc-800 italic">{selectedEntry.english}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-zinc-100 px-12 pt-4 flex justify-between items-center z-50 shadow-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        <button onClick={() => {setActiveTab(TabView.SEARCH); setSelectedEntry(null);}} className={`p-2 ${activeTab === TabView.SEARCH ? 'text-zinc-900' : 'text-zinc-300'}`}><Book className="w-7 h-7" /></button>
        <button onClick={() => {setActiveTab(TabView.BOOKMARKS); setSelectedEntry(null);}} className={`p-2 ${activeTab === TabView.BOOKMARKS ? 'text-zinc-900' : 'text-zinc-300'}`}><Bookmark className="w-7 h-7" /></button>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-zinc-300"><Settings className="w-7 h-7" /></button>
      </nav>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-zinc-900/50 backdrop-blur-md flex items-end animate-fade-in" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-white w-full rounded-t-[3rem] p-10 pb-16 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-zinc-100 rounded-full mx-auto mb-10"></div>
            <h3 className="text-3xl font-black mb-8 text-zinc-900">App Settings</h3>
            <button onClick={handleInstall} className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
              <Download className="w-4 h-4" /> Install Application
            </button>
            <p className="text-center text-[10px] text-zinc-400 mt-8 font-bold uppercase tracking-widest">Akha Heritage Project v2.0</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;