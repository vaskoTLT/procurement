
import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingList, ShoppingItem, AppView, Unit, User } from './types';
import { HomeView } from './components/HomeView';
import { ListDetailView } from './components/ListDetailView';
import { StatsView } from './components/StatsView';
import { ShareView } from './components/ShareView';
import { AuthView } from './components/AuthView';
import { AdminView } from './components/AdminView';
import { ProfileView } from './components/ProfileView';
import { 
  Plus, 
  ShoppingBag, 
  PieChart as PieChartIcon, 
  ChevronLeft,
  Loader2,
  X,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';

// Initialize Telegram WebApp
const tg = (window as any).Telegram?.WebApp;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sharedList, setSharedList] = useState<ShoppingList | null>(null);
  const [persistSession, setPersistSession] = useState(true);
  
  // Modals state
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  const [listToRename, setListToRename] = useState<{ id: string, name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Deletion state
  const [listIdToDelete, setListIdToDelete] = useState<string | null>(null);

  // Persistence and Share Link Handling
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shareData = params.get('share');
      if (shareData) {
        try {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(shareData))));
          setSharedList(decoded);
          setActiveView('shared');
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error("Failed to decode shared list", e);
        }
      }

      const savedLocalUser = localStorage.getItem('shopping_user_session');
      const savedSessionUser = sessionStorage.getItem('shopping_user_session');
      
      if (savedLocalUser) {
        setUser(JSON.parse(savedLocalUser));
        setPersistSession(true);
      } else if (savedSessionUser) {
        setUser(JSON.parse(savedSessionUser));
        setPersistSession(false);
      }

      const saved = localStorage.getItem('shopping_lists');
      if (saved) {
        setLists(JSON.parse(saved));
      } else {
        const initial: ShoppingList[] = [
          {
            id: '1',
            name: 'Продукты',
            createdAt: Date.now(),
            items: [
              { id: 'i1', name: 'Молоко', quantity: 2, unit: Unit.L, price: 150, isBought: false },
              { id: 'i2', name: 'Яйца', quantity: 10, unit: Unit.PCS, price: 110, isBought: true },
            ],
            isPinned: true
          }
        ];
        setLists(initial);
      }
    } catch (e) {
      console.error("Failed to initialize app", e);
    } finally {
      setIsLoading(false);
    }

    if (tg) {
      tg.expand();
      tg.ready();
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('shopping_lists', JSON.stringify(lists));
    }
  }, [lists, isLoading]);

  useEffect(() => {
    if (user) {
      const userStr = JSON.stringify(user);
      if (persistSession) {
        localStorage.setItem('shopping_user_session', userStr);
        sessionStorage.removeItem('shopping_user_session');
      } else {
        sessionStorage.setItem('shopping_user_session', userStr);
        localStorage.removeItem('shopping_user_session');
      }
    } else {
      localStorage.removeItem('shopping_user_session');
      sessionStorage.removeItem('shopping_user_session');
    }
  }, [user, persistSession]);

  useEffect(() => {
    if (tg) {
      const viewColors: Record<string, string> = {
        home: '#16a34a',
        shared: '#1d4ed8',
        admin: '#4338ca',
        stats: '#16a34a',
        profile: '#15803d'
      };
      
      if (activeView === 'home' || activeView === 'shared' || activeView === 'admin' || activeView === 'stats' || activeView === 'profile') {
        tg.headerColor = viewColors[activeView] || '#ffffff';
        tg.backgroundColor = '#f3f4f6';
      } else {
        tg.headerColor = '#ffffff';
        tg.backgroundColor = '#ffffff';
      }
    }
  }, [activeView]);

  const handleLogin = (newUser: User, remember: boolean) => {
    setPersistSession(remember);
    setUser(newUser);
    setActiveView('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('shopping_user_session');
    sessionStorage.removeItem('shopping_user_session');
    setUser(null);
    setActiveView('home');
    setSelectedListId(null);
  };

  const handleSelectList = (id: string) => {
    setSelectedListId(id);
    setActiveView('list-detail');
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    
    const newList: ShoppingList = {
      id: Math.random().toString(36).substr(2, 9),
      name: newListName.trim(),
      createdAt: Date.now(),
      items: [],
      isPinned: false,
      ownerEmail: user?.email,
      sharedWith: []
    };
    
    setLists(prev => [newList, ...prev]);
    setIsNewListModalOpen(false);
    setNewListName('');
    handleSelectList(newList.id);
  };

  const handleImportShared = () => {
    if (!sharedList) return;
    const listToImport: ShoppingList = { 
      ...sharedList, 
      id: Math.random().toString(36).substr(2, 9), 
      createdAt: Date.now(),
      ownerEmail: user?.email,
      sharedWith: [] // Clean shares on import
    };
    setLists(prev => [listToImport, ...prev]);
    setSharedList(null);
    handleSelectList(listToImport.id);
  };

  const handleRenameSubmit = () => {
    if (!listToRename || !renameValue.trim()) return;
    setLists(prev => prev.map(l => l.id === listToRename.id ? { ...l, name: renameValue.trim() } : l));
    setListToRename(null);
    setRenameValue('');
  };

  const handleTogglePin = (id: string) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, isPinned: !l.isPinned } : l));
  };

  const confirmDeleteList = () => {
    if (!listIdToDelete) return;
    setLists(prev => prev.filter(l => l.id !== listIdToDelete));
    if (selectedListId === listIdToDelete) {
      setActiveView('home');
      setSelectedListId(null);
    }
    setListIdToDelete(null);
  };

  const activeList = useMemo(() => 
    lists.find(l => l.id === selectedListId)
  , [lists, selectedListId]);

  const updateList = (updatedOrUpdater: ShoppingList | ((prev: ShoppingList) => ShoppingList)) => {
    setLists(prev => prev.map(l => {
      if (selectedListId && l.id === selectedListId) {
        return typeof updatedOrUpdater === 'function' ? updatedOrUpdater(l) : updatedOrUpdater;
      }
      return l;
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium text-gray-800">Загрузка...</p>
      </div>
    );
  }

  if (!user && activeView !== 'shared') {
    return <AuthView onLogin={handleLogin} />;
  }

  const visibleLists = lists.filter(l => 
    l.ownerEmail === user?.email || 
    l.sharedWith?.some(s => s.email === user?.email)
  );

  const listNameBeingDeleted = lists.find(l => l.id === listIdToDelete)?.name;
  const isHome = activeView === 'home';
  const isShared = activeView === 'shared';
  const isAdmin = activeView === 'admin';
  const isStats = activeView === 'stats';
  const isProfile = activeView === 'profile';

  return (
    <div className="flex flex-col min-h-screen bg-white select-none">
      <header className={`sticky top-0 z-40 border-b px-4 py-3 flex items-center justify-between transition-colors duration-300 
        ${isHome || isStats || isProfile ? 'bg-green-600 border-green-700 text-white shadow-md' : 
          isShared ? 'bg-blue-700 border-blue-800 text-white shadow-md' :
          isAdmin ? 'bg-indigo-700 border-indigo-800 text-white shadow-md' :
          'bg-white border-gray-100 text-gray-800'}`}>
        <div className="flex items-center gap-3">
          {(!isHome && !isShared && !isAdmin && !isStats && !isProfile) ? (
            <button 
              onClick={() => setActiveView('home')}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
            >
              <ChevronLeft className={`w-6 h-6 text-white`} />
            </button>
          ) : (
            <button 
              onClick={() => setActiveView('profile')}
              className={`p-2 rounded-xl transition-all active:scale-90 ${isProfile ? 'bg-white text-green-700 shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              title="Профиль"
            >
              <UserIcon className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold truncate">
            {isHome ? 'Мои Списки' : 
             isShared ? 'Общий список' :
             isAdmin ? 'Админка' :
             isStats ? 'Статистика' :
             isProfile ? 'Профиль' : activeList?.name}
          </h1>
        </div>
        {(isHome || isAdmin || isStats || isProfile || activeList) && (
          <button 
            onClick={handleLogout}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white flex items-center gap-2 active:scale-90"
            title="Выйти"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className={`flex-1 overflow-y-auto px-4 py-4 mb-20 ${isHome || isShared || isAdmin || isStats || isProfile ? 'bg-gray-50' : 'bg-white'}`}>
        {isShared && sharedList && (
          <ShareView 
            list={sharedList} 
            onImport={handleImportShared}
            onGoHome={() => setActiveView('home')}
          />
        )}
        {activeView === 'home' && (
          <HomeView 
            lists={visibleLists} 
            currentUserEmail={user?.email || ''}
            onSelectList={handleSelectList} 
            onDeleteList={(id) => setListIdToDelete(id)}
            onRenameList={(id, name) => {
              setListToRename({ id, name });
              setRenameValue(name);
            }}
            onTogglePin={handleTogglePin}
          />
        )}
        {activeView === 'list-detail' && activeList && (
          <ListDetailView 
            list={activeList} 
            currentUserEmail={user?.email || ''}
            onUpdateList={updateList} 
          />
        )}
        {activeView === 'stats' && (
          <StatsView lists={visibleLists} />
        )}
        {isAdmin && user?.isAdmin && (
          <AdminView allLists={lists} />
        )}
        {isProfile && user && (
          <ProfileView user={user} onUpdateUser={setUser} />
        )}
      </main>

      {/* Modals */}
      {isNewListModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 text-gray-800">
              <h2 className="text-xl font-bold">Новый список</h2>
              <button onClick={() => setIsNewListModalOpen(false)} className="p-2 text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <input autoFocus type="text" placeholder="Назовите список" className="w-full text-lg border-b-2 border-green-500 focus:ring-0 outline-none pb-2 mb-8 text-gray-800 bg-transparent" value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateList()} />
            <div className="flex gap-3">
              <button onClick={() => setIsNewListModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl transition-colors text-sm">Отмена</button>
              <button onClick={handleCreateList} disabled={!newListName.trim()} className="flex-[2] bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm">Создать</button>
            </div>
          </div>
        </div>
      )}

      {listToRename && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 text-gray-800">
              <h2 className="text-xl font-bold">Переименовать</h2>
              <button onClick={() => setListToRename(null)} className="p-2 text-gray-400"><X className="w-6 h-6" /></button>
            </div>
            <input autoFocus type="text" className="w-full text-lg border-b-2 border-green-500 focus:ring-0 outline-none pb-2 mb-8 text-gray-800 bg-transparent" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()} />
            <div className="flex gap-3">
              <button onClick={() => setListToRename(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl text-sm">Отмена</button>
              <button onClick={handleRenameSubmit} disabled={!renameValue.trim()} className="flex-[2] bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg text-sm">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {listIdToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8" /></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Удалить список?</h2>
              <p className="text-gray-500 text-sm mb-8">Вы уверены, что хотите удалить список <span className="font-bold text-gray-800">"{listNameBeingDeleted}"</span>?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setListIdToDelete(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl text-sm">Отмена</button>
              <button onClick={confirmDeleteList} className="flex-1 bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg text-sm">Удалить</button>
            </div>
          </div>
        </div>
      )}

      {!isShared && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-50">
          <button onClick={() => setActiveView('home')} className={`flex flex-col items-center flex-1 py-1 ${activeView === 'home' ? 'text-green-600' : 'text-gray-400'}`}>
            <ShoppingBag className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-bold">Списки</span>
          </button>
          <button onClick={() => setIsNewListModalOpen(true)} className="flex flex-col items-center flex-1 py-1 text-green-600 active:scale-90 transition-transform duration-200">
            <div className="bg-green-600 text-white p-2 rounded-xl shadow-md"><Plus className="w-6 h-6" strokeWidth={3} /></div>
          </button>
          <button onClick={() => setActiveView('stats')} className={`flex flex-col items-center flex-1 py-1 ${activeView === 'stats' ? 'text-green-600' : 'text-gray-400'}`}>
            <PieChartIcon className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-bold">Статистика</span>
          </button>
          {user?.isAdmin && (
            <button onClick={() => setActiveView('admin')} className={`flex flex-col items-center flex-1 py-1 ${activeView === 'admin' ? 'text-indigo-600' : 'text-gray-400'}`}>
              <ShieldCheck className="w-6 h-6" />
              <span className="text-[10px] mt-1 font-bold">Админ</span>
            </button>
          )}
        </nav>
      )}
    </div>
  );
};

export default App;
