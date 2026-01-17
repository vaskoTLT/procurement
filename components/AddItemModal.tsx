
import React, { useState, useEffect } from 'react';
import { ShoppingItem, UnitType } from '../types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: any) => void;
  initialData?: ShoppingItem;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '1');
  const [unit, setUnit] = useState<UnitType>(initialData?.unit || UnitType.PCS);
  const [price, setPrice] = useState(initialData?.price?.toString() || '');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setQuantity(initialData.quantity.toString());
      setUnit(initialData.unit);
      setPrice(initialData.price.toString());
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const data = {
      name,
      quantity: parseFloat(quantity) || 1,
      unit,
      price: parseFloat(price) || 0,
    };

    if (initialData) {
      onSubmit({ ...initialData, ...data });
    } else {
      onSubmit(data);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl transform transition-transform duration-300 scale-100">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Редактировать' : 'Новый товар'}</h2>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl hover:bg-gray-200 transition-colors"
            >
              &times;
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1 text-green-700">Название</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Напр: Молоко"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1 text-green-700">Кол-во</label>
                <div className="flex">
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as UnitType)}
                    className="px-2 py-3 bg-gray-100 border border-gray-200 rounded-r-xl text-gray-700 font-medium focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    {Object.values(UnitType).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1 text-green-700">Цена (за ед.)</label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all placeholder:text-gray-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₽</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.97] transition-all duration-150"
            >
              {initialData ? 'Сохранить изменения' : 'Добавить в список'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
