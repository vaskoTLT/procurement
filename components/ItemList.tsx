
import React from 'react';
import { ShoppingItem } from '../types';
import { TrashIcon, EditIcon, CheckIcon } from './Icons';

interface ItemListProps {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
}

export const ItemList: React.FC<ItemListProps> = ({ items, onToggle, onDelete, onEdit }) => {
  const toBuy = items.filter(i => !i.isBought);
  const bought = items.filter(i => i.isBought);

  const ItemRow: React.FC<{ item: ShoppingItem }> = ({ item }) => (
    <div 
      className={`flex items-center gap-3 p-3 mb-2 rounded-xl transition-all ${
        item.isBought ? 'bg-gray-50 opacity-60' : 'tg-secondary-bg border border-gray-100 shadow-sm'
      }`}
    >
      <button 
        onClick={() => onToggle(item.id)}
        className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${
          item.isBought ? 'bg-green-600 border-green-600' : 'border-gray-300'
        }`}
      >
        {item.isBought && <CheckIcon className="w-4 h-4 text-white" />}
      </button>
      
      <div className="flex-1 min-w-0" onClick={() => onToggle(item.id)}>
        <p className={`font-semibold truncate ${item.isBought ? 'line-through text-gray-400' : ''}`}>
          {item.name}
        </p>
        <p className="text-xs text-gray-500">
          {item.quantity} {item.unit} • {item.price} ₽/{item.unit === 'шт' ? 'ед' : 'кг'}
        </p>
      </div>

      <div className="flex gap-2">
        {!item.isBought && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="p-2 text-gray-400 hover:text-green-600"
          >
            <EditIcon className="w-5 h-5" />
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="p-2 text-gray-400 hover:text-red-500"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {items.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400">Ваш список пуст</p>
          <p className="text-sm text-gray-400 mt-2">Добавьте продукты кнопкой +</p>
        </div>
      )}

      {toBuy.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Нужно купить</h3>
          {toBuy.map(item => <ItemRow key={item.id} item={item} />)}
        </div>
      )}

      {bought.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Куплено</h3>
          {bought.map(item => <ItemRow key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
};
