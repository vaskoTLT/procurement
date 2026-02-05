
import React from 'react';
import { ShoppingList, ShoppingItem } from '../types';
import { Trash2, ShoppingCart, CheckCircle2, Clock, Pencil, Pin, PinOff, Users, Lock } from 'lucide-react';

interface HomeViewProps {
  lists: ShoppingList[];
  currentUserEmail: string;
  onSelectList: (id: string) => void;
  onDeleteList: (id: string) => void;
  onRenameList: (id: string, currentName: string) => void;
  onTogglePin: (id: string) => void;
}

const sumLeafItems = (items: ShoppingItem[], type: 'spent' | 'total'): number => {
  return items.reduce((acc, item) => {
    if (item.children && item.children.length > 0) {
      return acc + sumLeafItems(item.children, type);
    }
    if (type === 'spent') {
      return acc + (item.isBought ? item.price : 0);
    }
    return acc + item.price;
  }, 0);
};

const countLeafItems = (items: ShoppingItem[]): { total: number, bought: number } => {
  return items.reduce((acc, item) => {
    if (item.children && item.children.length > 0) {
      const childAcc = countLeafItems(item.children);
      return { total: acc.total + childAcc.total, bought: acc.bought + childAcc.bought };
    }
    return { total: acc.total + 1, bought: acc.bought + (item.isBought ? 1 : 0) };
  }, { total: 0, bought: 0 });
};

const ListCard: React.FC<{
  list: ShoppingList;
  currentUserEmail: string;
  onSelectList: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRenameList: (id: string, currentName: string) => void;
  onDeleteList: (id: string) => void;
}> = ({ list, currentUserEmail, onSelectList, onTogglePin, onRenameList, onDeleteList }) => {
  const stats = countLeafItems(list.items);
  const spentCost = sumLeafItems(list.items, 'spent');
  const totalEstimated = sumLeafItems(list.items, 'total');
  const progress = stats.total > 0 ? (stats.bought / stats.total) * 100 : 0;

  const isOwner = list.ownerEmail === currentUserEmail;
  const shareInfo = list.sharedWith?.find(s => s.email === currentUserEmail);
  const isViewOnly = !isOwner && shareInfo?.access === 'view';

  return (
    <div 
      className={`bg-white rounded-2xl p-4 shadow-sm border transition-all relative overflow-hidden group cursor-pointer active:scale-[0.98] ${list.isPinned ? 'border-green-200 bg-green-50/20' : 'border-gray-100'}`}
      onClick={() => onSelectList(list.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-800 break-words">{list.name}</h3>
            {list.isPinned && <Pin className="w-3 h-3 text-green-500 fill-green-500" />}
            {isViewOnly && <Lock className="w-3 h-3 text-amber-500" />}
            {!isOwner && <Users className="w-3 h-3 text-blue-500" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(list.createdAt).toLocaleDateString()}</span>
            {!isOwner && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Общий</span>}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(list.id);
            }}
            className={`p-2 transition-colors rounded-lg border ${list.isPinned ? 'text-green-600 bg-green-100 border-green-200' : 'text-gray-400 bg-gray-50 border-gray-100'}`}
          >
            {list.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
          
          {isOwner && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameList(list.id, list.name);
                }}
                className="p-2 text-gray-400 hover:text-green-600 transition-colors bg-gray-50 rounded-lg border border-gray-100"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteList(list.id);
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg border border-gray-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${progress === 100 ? 'text-green-600' : 'text-green-500'}`} />
            <span className="text-sm font-semibold text-gray-600">
              {stats.bought}/{stats.total} товаров
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Потрачено</p>
          <p className="text-lg font-black text-green-600">{spentCost.toLocaleString()} ₽</p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
        <div 
          className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-600' : 'bg-green-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const HomeView: React.FC<HomeViewProps> = ({ lists, currentUserEmail, onSelectList, onDeleteList, onRenameList, onTogglePin }) => {
  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="w-10 h-10 text-green-200" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600">Списков пока нет</h3>
        <p className="text-gray-400 max-w-[200px]">Создайте новый список или подождите, пока кто-то поделится своим.</p>
      </div>
    );
  }

  const pinnedLists = lists.filter(l => l.isPinned);
  const otherLists = lists.filter(l => !l.isPinned);

  return (
    <div className="space-y-6 pb-12">
      {pinnedLists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Pin className="w-4 h-4 text-green-600" />
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Закрепленные</h2>
          </div>
          <div className="grid gap-4">
            {pinnedLists.map(list => (
              <ListCard 
                key={list.id} 
                list={list} 
                currentUserEmail={currentUserEmail}
                onSelectList={onSelectList}
                onTogglePin={onTogglePin}
                onRenameList={onRenameList}
                onDeleteList={onDeleteList}
              />
            ))}
          </div>
        </div>
      )}

      {(pinnedLists.length > 0 && otherLists.length > 0) && (
        <div className="border-t border-gray-100 my-6" />
      )}

      {otherLists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <ShoppingCart className="w-4 h-4 text-gray-400" />
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Все списки</h2>
          </div>
          <div className="grid gap-4">
            {otherLists.map(list => (
              <ListCard 
                key={list.id} 
                list={list} 
                currentUserEmail={currentUserEmail}
                onSelectList={onSelectList}
                onTogglePin={onTogglePin}
                onRenameList={onRenameList}
                onDeleteList={onDeleteList}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
