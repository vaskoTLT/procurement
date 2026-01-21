
import React from 'react';
import { ShoppingList } from '../types';
import { TrashIcon } from './Icons';

interface ListsOverviewProps {
  lists: ShoppingList[];
  onSelectList: (id: string) => void;
  onDeleteList: (id: string) => void;
}

export const ListsOverview: React.FC<ListsOverviewProps> = ({ lists, onSelectList, onDeleteList }) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {lists.map(list => {
        const spent = list.items.filter(i => i.isBought).reduce((acc, i) => acc + (i.price * i.quantity), 0);
        return (
          <div key={list.id} onClick={() => onSelectList(list.id)} className="bg-white p-3 rounded-xl border shadow-sm active:bg-gray-50 flex justify-between items-center">
            <div className="flex-1">
              <h3 className="text-sm font-bold truncate">{list.title}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">{list.items.length} поз. • {spent} ₽</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }} className="p-2 text-gray-300"><TrashIcon className="w-4 h-4" /></button>
          </div>
        );
      })}
      {lists.length === 0 && <div className="text-center py-20 text-gray-400 text-sm font-medium">Создайте свой первый список</div>}
    </div>
  );
};