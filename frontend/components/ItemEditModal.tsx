import React, { useState } from 'react';
import { ShoppingItem, Unit } from '../types';
import { X, Minus, Plus, ChevronDown } from 'lucide-react';
import { apiService } from '../services/apiService';

interface ItemEditModalProps {
  item: ShoppingItem;
  onClose: () => void;
  onUpdate: (item: ShoppingItem) => void;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({ item, onClose, onUpdate }) => {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState<Unit>(item.unit);
  const [price, setPrice] = useState(item.price.toString());
  const [notes, setNotes] = useState(item.notes || '');
  const [isPurchasesExpanded, setIsPurchasesExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const purchases = item.purchases || [];
  const pricePerUnit = quantity > 0 ? item.price / quantity : 0;

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const updated = await apiService.updateItem(item.id, {
        name,
        quantity: quantity,
        unit,
        price: parseFloat(price) || 0,
        notes,
        category: item.category,
      });

      onUpdate(updated);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Ошибка при сохранении товара');
    } finally {
      setIsSaving(false);
    }
  };

  const getUnitText = (u: Unit): string => {
    const unitMap: Record<Unit, string> = {
      [Unit.PCS]: 'шт',
      [Unit.KG]: 'кг',
      [Unit.G]: 'г',
      [Unit.L]: 'л',
      [Unit.ML]: 'мл',
    };
    return unitMap[u];
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Редактировать товар</h2>
          <button onClick={onClose} className="p-2 text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Название</label>
            <input
              type="text"
              className="w-full border-b-2 border-green-500 focus:ring-0 outline-none pb-1 text-gray-800 bg-transparent text-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Quantity - with +/- buttons */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Количество (автоматически создает подсписки)</label>
            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden mt-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-green-600 hover:bg-green-100 transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                step="1"
                className="flex-1 bg-transparent text-center font-bold outline-none border-none py-2"
                value={Math.round(quantity)}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 text-green-600 hover:bg-green-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Ед. измерения</label>
            <select
              className="w-full bg-gray-50 rounded-xl px-4 py-2 border border-gray-100 focus:ring-2 focus:ring-green-500 outline-none mt-1"
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
            >
              <option value={Unit.PCS}>шт</option>
              <option value={Unit.KG}>кг</option>
              <option value={Unit.G}>г</option>
              <option value={Unit.L}>л</option>
              <option value={Unit.ML}>мл</option>
            </select>
          </div>

          {/* Price - total */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Общая цена</label>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.01"
                className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-2 border border-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">₽</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-1">
              Цена за единицу: {pricePerUnit.toFixed(2)} ₽
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Примечания</label>
            <textarea
              className="w-full bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus:ring-2 focus:ring-green-500 outline-none text-sm mt-1"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Добавить примечание..."
            />
          </div>

          {/* Purchases Section - Info only */}
          {purchases.length > 0 && (
            <div className="bg-green-50 rounded-xl border border-green-100 p-4">
              <button
                onClick={() => setIsPurchasesExpanded(!isPurchasesExpanded)}
                className="w-full flex items-center justify-between"
              >
                <span className="text-sm font-bold text-green-600 uppercase">
                  📦 Подсписки ({purchases.length})
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-green-600 transition-transform ${
                    isPurchasesExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isPurchasesExpanded && (
                <div className="space-y-2 mt-3 border-t border-green-100 pt-3">
                  {purchases.map((purchase, idx) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between text-sm bg-white rounded-lg p-2 border border-green-100"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-700">
                          Часть {idx + 1}: {purchase.quantity} {getUnitText(unit)}
                        </p>
                        <p className="text-xs text-green-600">
                          {(purchase.quantity * (purchase.price_per_unit || 0)).toFixed(2)} ₽
                        </p>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 italic mt-2">
                    💡 Подсписки создаются автоматически и изменяются при коррекции количества
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl hover:bg-gray-200 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={saveChanges}
            disabled={isSaving || !name.trim()}
            className="flex-1 bg-green-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};
