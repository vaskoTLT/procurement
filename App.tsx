
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ShoppingList, ShoppingItem, UnitType } from './types';
import { Header } from './components/Header';
import { ItemList } from './components/ItemList';
import { SummaryBar } from './components/SummaryBar';
import { AddItemModal } from './components/AddItemModal';
import { HistoryView } from './components/HistoryView';
import { ListsOverview } from './components/ListsOverview';
import { AddListModal } from './components/AddListModal';
import { PlusIcon, HistoryIcon, ListIcon } from './components/Icons';

const API_BASE = '/api';

const App: React.FC = () => {
  const [view, setView] = useState<'overview' | 'details' | 'history'>('overview');
  const [activeLists, setActiveLists] = useState<ShoppingList[]>([]);
  const [history, setHistory] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | undefined>(undefined);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  const isInitialLoad = useRef(true);
  const lastSavedRef = useRef<string>("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/data`);
      if (res.ok) {
        const data = await res.json();
        // Чтобы не перетирать локальные изменения, которые еще не ушли в базу
        if (syncStatus !== 'syncing') {
          setActiveLists(data.activeLists || []);
          setHistory(data.history || []);
        }
      }
    } catch (err) {
      setSyncStatus('error');
    }
  }, [syncStatus]);

  const saveData = useCallback(async (data: any) => {
    const dataStr = JSON.stringify(data);
    if (dataStr === lastSavedRef.current) return;
    
    setSyncStatus('syncing');
    try {
      const res = await fetch(`${API_BASE}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: dataStr,
      });
      if (res.ok) {
        lastSavedRef.current = dataStr;
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      }
    } catch (err) {
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchData().then(() => { isInitialLoad.current = false; });
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (isInitialLoad.current) return;
    const timer = setTimeout(() => {
      saveData({ activeLists, history });
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeLists, history, saveData]);

  const currentList = useMemo(() => activeLists.find(l => l.id === activeListId), [activeLists, activeListId]);

  const handleCreateList = (title: string) => {
    const newList: ShoppingList = { id: Date.now().toString(), title, date: new Date().toISOString(), items: [], isArchived: false };
    setActiveLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
    setView('details');
    setIsListModalOpen(false);
  };

  const handleAddItem = (item: any) => {
    const newItem = { ...item, id: Date.now().toString(), isBought: false };
    setActiveLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: [...l.items, newItem] } : l));
    setIsItemModalOpen(false);
  };

  const handleUpdateItem = (item: ShoppingItem) => {
    setActiveLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: l.items.map(i => i.id === item.id ? item : i) } : l));
    setIsItemModalOpen(false);
    setEditingItem(undefined);
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-gray-50">
      <Header 
        title={view === 'details' ? (currentList?.title || 'Список') : view === 'overview' ? 'ShopMaster' : 'История'} 
        onBack={view !== 'overview' ? () => setView('overview') : undefined}
        syncStatus={syncStatus}
      />
      
      <main className="flex-1 p-2 overflow-y-auto">
        {view === 'overview' && <ListsOverview lists={activeLists} onSelectList={id => { setActiveListId(id); setView('details'); }} onDeleteList={id => setActiveLists(l => l.filter(x => x.id !== id))} />}
        {view === 'details' && currentList && <ItemList items={currentList.items} onToggle={id => setActiveLists(prev => prev.map(l => ({ ...l, items: l.items.map(i => i.id === id ? { ...i, isBought: !i.isBought } : i) })))} onDelete={id => setActiveLists(prev => prev.map(l => ({ ...l, items: l.items.filter(i => i.id !== id) })))} onEdit={i => { setEditingItem(i); setIsItemModalOpen(true); }} />}
        {view === 'history' && <HistoryView lists={history} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 tg-secondary-bg border-t border-gray-200 px-6 py-2 flex justify-around items-center z-40">
        <button onClick={() => setView('overview')} className={`flex flex-col items-center p-1 ${view === 'overview' ? 'text-green-600' : 'text-gray-400'}`}>
          <ListIcon className="w-5 h-5" /><span className="text-[10px] font-bold">СПИСКИ</span>
        </button>
        <button onClick={() => view === 'details' ? setIsItemModalOpen(true) : setIsListModalOpen(true)} className="bg-green-600 text-white rounded-full p-3 -mt-6 shadow-lg border-4 border-gray-50">
          <PlusIcon className="w-6 h-6" />
        </button>
        <button onClick={() => setView('history')} className={`flex flex-col items-center p-1 ${view === 'history' ? 'text-green-600' : 'text-gray-400'}`}>
          <HistoryIcon className="w-5 h-5" /><span className="text-[10px] font-bold">ИСТОРИЯ</span>
        </button>
      </nav>

      <AddItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} onSubmit={editingItem ? handleUpdateItem : handleAddItem} initialData={editingItem} />
      <AddListModal isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)} onSubmit={handleCreateList} />
    </div>
  );
};

export default App;