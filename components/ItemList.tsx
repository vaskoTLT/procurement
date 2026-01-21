
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
    <div className={`flex items-center gap-2 p-2 mb-1 rounded-lg transition-all ${item.isBought ? 'bg-gray-100 opacity-50' : 'bg-white border shadow-sm'}`}>
      <button onClick={() => onToggle(item.id)} className={`w-5 h-5 rounded flex items-center justify-center border-2 ${item.isBought ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
        {item.isBought && <CheckIcon className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0" onClick={() => onToggle(item.id)}>
        <p className={`text-sm font-bold truncate ${item.isBought ? 'line-through text-gray-400' : ''}`}>{item.name}</p>
        <p className="text-[10px] text-gray-500">{item.quantity} {item.unit} • {item.price} ₽</p>
      </div>
      <div className="flex gap-1">
        {!item.isBought && <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1.5 text-gray-400"><EditIcon className="w-4 h-4" /></button>}
        <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-1.5 text-gray-400"><TrashIcon className="w-4 h-4" /></button>
      </div>
    </div>
  );

  return (
    <div>
      {toBuy.length > 0 && <div><h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Нужно купить</h3>{toBuy.map(i => <ItemRow key={i.id} item={i} />)}</div>}
      {bought.length > 0 && <div className="mt-4"><h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Куплено</h3>{bought.map(i => <ItemRow key={i.id} item={i} />)}</div>}
      {items.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">Пусто</div>}
    </div>
  );
};