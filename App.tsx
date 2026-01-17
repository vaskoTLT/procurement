
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

const N8N_WEBHOOK_URL = 'https://primary-production.up.railway.app/webhook/shop-sync'; 

const App: React.FC = () => {
  const [view, setView] = useState<'overview' | 'details' | 'history'>('overview');
  const [activeLists, setActiveLists] = useState<ShoppingList[]>([]);
  const [history, setHistory] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | undefined>(undefined);

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const syncTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('shopmaster_data_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      setActiveLists(parsed.activeLists || []);
      setHistory(parsed.history || []);
    }
    
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  const syncWithN8n = useCallback(async (data: { activeLists: ShoppingList[], history: ShoppingList[] }) => {
    if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL.includes('placeholder')) return;
    
    const tg = (window as any).Telegram?.WebApp;
    const userId = tg?.initDataUnsafe?.user?.id?.toString() || 'dev_user';

    setSyncStatus('syncing');
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          event: 'sync_update',
          timestamp: new Date().toISOString(),
          userName: tg?.initDataUnsafe?.user?.username || 'unknown',
          ...data
        }),
      });

      if (response.ok) {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        throw new Error('Sync failed');
      }
    } catch (err) {
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shopmaster_data_v2', JSON.stringify({ activeLists, history }));
    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(() => {
      syncWithN8n({ activeLists, history });
    }, 2000);
    return () => {
      if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
    };
  }, [activeLists, history, syncWithN8n]);

  const currentList = useMemo(() => 
    activeLists.find(l => l.id === activeListId) || null
  , [activeLists, activeListId]);

  const handleCreateList = useCallback((title: string) => {
    const newList: ShoppingList = {
      id: Date.now().toString(),
      title: title || 'Новый список',
      date: new Date().toISOString(),
      items: [],
      isArchived: false
    };
    setActiveLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
    setView('details');
    setIsListModalOpen(false);
  }, []);

  const handleAddItem = useCallback((item: Omit<ShoppingItem, 'id' | 'isBought'>) => {
    if (!activeListId) return;
    const newItem: ShoppingItem = { ...item, id: Date.now().toString(), isBought: false };
    setActiveLists(prev => prev.map(list => 
      list.id === activeListId ? { ...list, items: [...list.items, newItem] } : list
    ));
    setIsItemModalOpen(false);
  }, [activeListId]);

  const handleUpdateItem = useCallback((updatedItem: ShoppingItem) => {
    if (!activeListId) return;
    setActiveLists(prev => prev.map(list => 
      list.id === activeListId 
        ? { ...list, items: list.items.map(i => i.id === updatedItem.id ? updatedItem : i) } 
        : list
    ));
    setEditingItem(undefined);
    setIsItemModalOpen(false);
  }, [activeListId]);

  const toggleItemBought = useCallback((id: string) => {
    setActiveLists(prev => prev.map(list => ({
      ...list,
      items: list.items.map(item => item.id === id ? { ...item, isBought: !item.isBought } : item)
    })));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setActiveLists(prev => prev.map(list => ({
      ...list,
      items: list.items.filter(item => item.id !== id)
    })));
  }, []);

  const archiveList = useCallback((id: string) => {
    const listToArchive = activeLists.find(l => l.id === id);
    if (!listToArchive) return;
    setHistory(prev => [{ ...listToArchive, isArchived: true, date: new Date().toISOString() }, ...prev]);
    setActiveLists(prev => prev.filter(l => l.id !== id));
    if (activeListId === id) {
      setActiveListId(null);
      setView('overview');
    }
  }, [activeLists, activeListId]);

  const deleteList = useCallback((id: string) => {
    setActiveLists(prev => prev.filter(l => l.id !== id));
    if (activeListId === id) {
      setActiveListId(null);
      setView('overview');
    }
  }, [activeListId]);

  const totalSpentInCurrent = useMemo(() => {
    if (!currentList) return 0;
    return currentList.items
      .filter(i => i.isBought)
      .reduce((acc, i) => acc + (i.price * i.quantity), 0);
  }, [currentList]);

  return (
    <div className="min-h-screen flex flex-col pb-24 transition-colors duration-300">
      <Header 
        title={view === 'details' ? (currentList?.title || 'Список') : (view === 'overview' ? 'Мои списки' : 'История')} 
        onBack={view === 'details' ? () => setView('overview') : undefined}
        onArchive={view === 'details' && activeListId ? () => archiveList(activeListId) : undefined}
        syncStatus={syncStatus}
      />

      <main className="flex-1 px-4 pt-4 overflow-y-auto">
        {view === 'overview' && (
          <ListsOverview 
            lists={activeLists} 
            onSelectList={(id) => { setActiveListId(id); setView('details'); }}
            onDeleteList={deleteList}
          />
        )}
        
        {view === 'details' && currentList && (
          <ItemList 
            items={currentList.items} 
            onToggle={toggleItemBought} 
            onDelete={deleteItem}
            onEdit={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
          />
        )}

        {view === 'history' && (
          <HistoryView lists={history} />
        )}
      </main>

      {view === 'details' && (
        <SummaryBar total={totalSpentInCurrent} itemCount={currentList?.items.filter(i => i.isBought).length || 0} />
      )}

      <nav className="fixed bottom-0 left-0 right-0 tg-secondary-bg border-t border-gray-100/50 px-6 py-3 flex justify-around items-center z-40 backdrop-blur-md">
        <button 
          onClick={() => setView('overview')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'overview' || view === 'details' ? 'text-green-600 scale-110' : 'text-gray-400'}`}
        >
          <ListIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Списки</span>
        </button>

        <button 
          onClick={() => {
            if (view === 'details') {
              setEditingItem(undefined);
              setIsItemModalOpen(true);
            } else {
              setIsListModalOpen(true);
            }
          }}
          className="bg-green-600 text-white rounded-2xl p-4 -mt-12 shadow-[0_8px_20px_rgba(22,163,74,0.4)] border-4 border-white active:scale-90 transition-all"
        >
          <PlusIcon className="w-8 h-8" />
        </button>

        <button 
          onClick={() => setView('history')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'history' ? 'text-green-600 scale-110' : 'text-gray-400'}`}
        >
          <HistoryIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">История</span>
        </button>
      </nav>

      {isItemModalOpen && (
        <AddItemModal 
          isOpen={isItemModalOpen} 
          onClose={() => setIsItemModalOpen(false)} 
          onSubmit={editingItem ? handleUpdateItem : handleAddItem}
          initialData={editingItem}
        />
      )}

      {isListModalOpen && (
        <AddListModal 
          isOpen={isListModalOpen}
          onClose={() => setIsListModalOpen(false)}
          onSubmit={handleCreateList}
        />
      )}
    </div>
  );
};

export default App;
