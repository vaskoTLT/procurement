
import React from 'react';

interface SummaryBarProps {
  total: number;
  itemCount: number;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({ total, itemCount }) => {
  if (total === 0 && itemCount === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-30">
      <div className="bg-green-600 text-white px-5 py-4 rounded-2xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-4 duration-300">
        <div>
          <p className="text-xs opacity-80 font-medium">Куплено {itemCount} позиций</p>
          <p className="text-lg font-bold">Итого: {total.toLocaleString()} ₽</p>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
          Чек
        </div>
      </div>
    </div>
  );
};
