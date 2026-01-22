import React from 'react';
import { ShoppingList } from '../types';
import { Trash2, ShoppingCart, CheckCircle2, Clock } from 'lucide-react';

interface HomeViewProps {
  lists: ShoppingList[];
  onSelectList: (id: string) => void;
  onDeleteList: (id: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ lists, onSelectList, onDeleteList }) => {
  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="w-10 h-10 text-green-200" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600">Списков пока нет</h3>
        <p className="text-gray-400 max-w-[200px]">Нажмите на кнопку ниже, чтобы создать свой первый список.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {lists.map((list) => {
        const totalItems = list.items.length;
        const boughtItems = list.items.filter(i => i.isBought).length;
        const spentCost = list.items.reduce((sum, item) => sum + (item.isBought ? item.price : 0), 0);
        const totalEstimated = list.items.reduce((sum, item) => sum + item.price, 0);
        const progress = totalItems > 0 ? (boughtItems / totalItems) * 100 : 0;

        return (
          <div 
            key={list.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:bg-green-50 transition-colors relative overflow-hidden group"
            onClick={() => onSelectList(list.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{list.name}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteList(list.id);
                }}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${progress === 100 ? 'text-green-600' : 'text-green-500'}`} />
                  <span className="text-sm font-semibold text-gray-600">
                    {boughtItems}/{totalItems} товаров
                  </span>
                </div>
                {totalEstimated > spentCost && (
                  <p className="text-[10px] text-gray-400 font-bold ml-6 mt-0.5">
                    Всего: {totalEstimated.toLocaleString()} ₽
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Потрачено</p>
                <p className="text-lg font-black text-green-600">{spentCost.toLocaleString()} ₽</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
              <div 
                className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-600' : 'bg-green-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
