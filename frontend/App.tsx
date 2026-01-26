import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingList, ShoppingItem, AppView, Unit } from './types';
import { HomeView } from './components/HomeView';
import { ListDetailView } from './components/ListDetailView';
import { ListEditModal } from './components/ListEditModal';
import { StatsView } from './components/StatsView';
import { 
  Plus, 
  ShoppingBag, 
  PieChart as PieChartIcon, 
  ChevronLeft,
  Loader2,
  X,
  AlertTriangle,
  Edit2
} from 'lucide-react';
import { apiService } from './services/apiService';

// Initialize Telegram WebApp
const tg = (window as any).Telegram?.WebApp;

const App: React.FC = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  
  // Deletion state
  const [listIdToDelete, setListIdToDelete] = useState<string | null>(null);

  // Load data from API on mount
  useEffect(() => {
    const loadLists = async () => {
      try {
        console.log('📥 Загружаем списки с API...');
        const data = await apiService.getLists();
        console.log('✅ Списки загружены:', data);
        setLists(data);
      } catch (error) {
        console.error('❌ Ошибка при загрузке списков:', error);
        setLists([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLists();

    if (tg) {
      tg.expand();
      tg.ready();
      tg.headerColor = '#ffffff';
      tg.backgroundColor = '#ffffff';
    }
  }, []);

  // View Controllers
  const handleSelectList = (id: string) => {
    setSelectedListId(id);
    setActiveView('list-detail');
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    try {
      console.log('📝 Создаем новый список...', newListName);
      const newList = await apiService.createList(newListName.trim());
      console.log('✅ Список создан:', newList);
      setLists(prev => [newList, ...prev]);
      setIsNewListModalOpen(false);
      setNewListName('');
      handleSelectList(newList.id);
    } catch (error) {
      console.error('❌ Ошибка при создании списка:', error);
      alert('Ошибка при создании списка. Попробуйте еще раз.');
    }
  };

  const confirmDeleteList = async () => {
    if (!listIdToDelete) return;
    
    try {
      console.log('🗑️ Удаляем список...', listIdToDelete);
      await apiService.deleteList(listIdToDelete);
      console.log('✅ Список удален');
      setLists(prev => prev.filter(l => l.id !== listIdToDelete));
      if (selectedListId === listIdToDelete) {
        setActiveView('home');
        setSelectedListId(null);
      }
      setListIdToDelete(null);
    } catch (error) {
      console.error('❌ Ошибка при удалении списка:', error);
      alert('Ошибка при удалении списка. Попробуйте еще раз.');
    }
  };

  const activeList = useMemo(() => 
    lists.find(l => l.id === selectedListId)
  , [lists, selectedListId]);

  const updateList = (updated: ShoppingList) => {
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const handleEditListUpdated = (updated: ShoppingList) => {
    updateList(updated);
    setIsEditListModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Загрузка...</p>
      </div>
    );
  }

  const listNameBeingDeleted = lists.find(l => l.id === listIdToDelete)?.name;

  return (
    <div className="flex flex-col min-h-screen bg-white select-none">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-green-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeView !== 'home' && (
            <button 
              onClick={() => setActiveView('home')}
              className="p-1 hover:bg-green-700 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          <h1 className="text-xl font-bold text-white">
            {activeView === 'home' ? 'Мои Списки' : activeView === 'stats' ? 'Статистика' : activeList?.name}
          </h1>
        </div>
        {activeView === 'list-detail' && activeList && (
          <button 
            onClick={() => setIsEditListModalOpen(true)}
            className="p-2 text-white hover:bg-green-700 rounded-full transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 mb-20">
        {activeView === 'home' && (
          <HomeView 
            lists={lists} 
            onSelectList={handleSelectList} 
            onDeleteList={(id) => setListIdToDelete(id)}
          />
        )}
        {activeView === 'list-detail' && activeList && (
          <ListDetailView 
            list={activeList} 
            onUpdateList={updateList}
          />
        )}
        {activeView === 'stats' && (
          <StatsView lists={lists} />
        )}
      </main>

      {/* Add List Modal */}
      {isNewListModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Новый список</h2>
              <button onClick={() => setIsNewListModalOpen(false)} className="p-2 text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <input 
              autoFocus
              type="text" 
              placeholder="Назовите список"
              className="w-full text-lg border-b-2 border-green-500 focus:ring-0 outline-none pb-2 mb-8 text-gray-800 bg-transparent"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setIsNewListModalOpen(false)}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl transition-colors text-sm"
              >
                Отмена
              </button>
              <button 
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                className="flex-[2] bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {isEditListModalOpen && activeList && (
        <ListEditModal 
          list={activeList}
          onClose={() => setIsEditListModalOpen(false)}
          onUpdate={handleEditListUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {listIdToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Удалить список?</h2>
              <p className="text-gray-500 text-sm mb-8">
                Вы уверены, что хотите удалить список <span className="font-bold text-gray-800">"{listNameBeingDeleted}"</span>? Это действие нельзя отменить.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setListIdToDelete(null)}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl transition-colors text-sm"
              >
                Отмена
              </button>
              <button 
                onClick={confirmDeleteList}
                className="flex-1 bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-red-600 transition-colors text-sm"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-50">
        <button 
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeView === 'home' ? 'text-green-600' : 'text-gray-400'}`}
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-bold">Списки</span>
        </button>
        
        <button 
          onClick={() => setIsNewListModalOpen(true)}
          className="flex flex-col items-center flex-1 py-1 text-green-600 active:scale-90 transition-transform duration-200"
          aria-label="Add list"
        >
          <div className="bg-green-600 text-white p-2 rounded-xl shadow-md">
            <Plus className="w-6 h-6" strokeWidth={3} />
          </div>
        </button>

        <button 
          onClick={() => setActiveView('stats')}
          className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeView === 'stats' ? 'text-green-600' : 'text-gray-400'}`}
        >
          <PieChartIcon className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-bold">Статистика</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
