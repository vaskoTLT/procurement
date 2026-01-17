
import React from 'react';
import { ShoppingList } from '../types';
import { TrashIcon } from './Icons';

interface ListsOverviewProps {
  lists: ShoppingList[];
  onSelectList: (id: string) => void;
  onDeleteList: (id: string) => void;
}

export const ListsOverview: React.FC<ListsOverviewProps> = ({ lists, onSelectList, onDeleteList }) => {
  if (lists.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-gray-400 font-medium">Списков пока нет</p>
        <p className="text-sm text-gray-400 mt-1">Создайте новый список кнопкой +</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {lists.map(list => {
        const spent = list.items
          .filter(i => i.isBought)
          .reduce((acc, i) => acc + (i.price * i.quantity), 0);
        
        const totalItems = list.items.length;
        const boughtItems = list.items.filter(i => i.isBought).length;

        return (
          <div 
            key={list.id} 
            onClick={() => onSelectList(list.id)}
            className="tg-secondary-bg p-5 rounded-3xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 group-active:text-green-600 transition-colors truncate pr-8">
                  {list.title}
                </h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                  {boughtItems} из {totalItems} куплено
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}
                className="p-2 text-gray-300 hover:text-red-500 active:bg-red-50 rounded-full transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex justify-between items-end">
              <div className="flex-1 mr-4">
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-600 h-full transition-all duration-500" 
                    style={{ width: `${totalItems > 0 ? (boughtItems / totalItems) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Потрачено</p>
                <p className="text-xl font-black text-green-700 leading-none">
                  {spent.toLocaleString()} <span className="text-sm font-bold">₽</span>
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
