import React from 'react';
import { ShoppingList } from '../types';

interface HistoryViewProps {
  lists: ShoppingList[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ lists }) => {
  if (lists.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>У вас еще нет завершенных списков</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lists.map(list => {
        const total = list.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        const date = new Date(list.date).toLocaleDateString('ru-RU', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });

        return (
          <div key={list.id} className="tg-secondary-bg p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center active:bg-gray-50 transition-colors">
            <div>
              <h4 className="font-bold text-gray-800">{list.title}</h4>
              <p className="text-xs text-gray-400 mt-1">{date} • {list.items.length} тов.</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">{total.toLocaleString()} ₽</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Итого</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};