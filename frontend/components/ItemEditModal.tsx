import React, { useState, useEffect } from 'react';
import { ShoppingItem, Unit } from '../types';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';
import { apiService } from '../services/apiService';

interface ItemEditModalProps {
  item: ShoppingItem;
  onClose: () => void;
  onUpdate: (item: ShoppingItem) => void;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({ item, onClose, onUpdate }) => {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [unit, setUnit] = useState<Unit>(item.unit);
  const [price, setPrice] = useState(item.price.toString());
  const [notes, setNotes] = useState(item.notes || '');
  const [purchases, setPurchases] = useState(item.purchases || []);
  const [newPurchaseQty, setNewPurchaseQty] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newPurchaseNotes, setNewPurchaseNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const updated = await apiService.updateItem(item.id, {
        name,
        quantity: parseFloat(quantity) || 0,
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

  const addPurchase = async () => {
    if (!newPurchaseQty || !newPurchasePrice) {
      alert('Укажите количество и цену');
      return;
    }

    try {
      const purchase = await apiService.addItemPurchase(
        item.id,
        parseFloat(newPurchaseQty),
        parseFloat(newPurchasePrice),
        newPurchaseNotes
      );
      setPurchases([...purchases, purchase]);
      setNewPurchaseQty('');
      setNewPurchasePrice('');
      setNewPurchaseNotes('');
    } catch (error) {
      console.error('Error adding purchase:', error);
      alert('Ошибка при добавлении подсписка');
    }
  };

  const deletePurchase = async (purchaseId: number) => {
    try {
      await apiService.deleteItemPurchase(item.id, purchaseId);
      setPurchases(purchases.filter(p => p.id !== purchaseId));
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Ошибка при удалении подсписка');
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

  const totalPurchased = purchases.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl divide-y divide-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Редактировать товар</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Fields */}
        <div className="py-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Название</label>
            <input
              type="text"
              className="w-full text-lg border-b-2 border-green-500 focus:ring-0 outline-none pb-1 text-gray-800 bg-transparent"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Кол-во</label>
              <input
                type="number"
                step="0.1"
                className="w-full bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Ед. изм.</label>
              <select
                className="w-full bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
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
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Цена (за всё)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-2 border border-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">₽</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Примечания</label>
            <textarea
              className="w-full bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus:ring-2 focus:ring-green-500 outline-none text-sm"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Progress */}
          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-semibold">Куплено:</span>
              <span className="text-green-600 font-bold">
                {totalPurchased} / {quantity} {getUnitText(unit)}
              </span>
            </div>
            <div className="w-full bg-green-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-600 h-full transition-all"
                style={{ width: `${Math.min((totalPurchased / parseFloat(quantity)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Purchases Section */}
        <div className="py-6">
          <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-wide">Подсписки покупок</h3>

          {purchases.length > 0 && (
            <div className="space-y-2 mb-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {purchase.quantity} {getUnitText(unit)}
                    </p>
                    {purchase.price_per_unit && (
                      <p className="text-xs text-gray-500">
                        {(purchase.quantity * purchase.price_per_unit).toFixed(2)} ₽
                        ({purchase.price_per_unit.toFixed(2)} ₽ × {purchase.quantity})
                      </p>
                    )}
                    {purchase.notes && (
                      <p className="text-xs text-gray-400 italic mt-1">{purchase.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deletePurchase(purchase.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Purchase */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-3">
            <p className="text-xs font-bold text-blue-600 uppercase">Добавить подсписок</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Кол-во"
                className="bg-white rounded-lg px-3 py-2 border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={newPurchaseQty}
                onChange={(e) => setNewPurchaseQty(e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Цена"
                className="bg-white rounded-lg px-3 py-2 border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={newPurchasePrice}
                onChange={(e) => setNewPurchasePrice(e.target.value)}
              />
            </div>
            <input
              type="text"
              placeholder="Примечание (опционально)"
              className="w-full bg-white rounded-lg px-3 py-2 border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={newPurchaseNotes}
              onChange={(e) => setNewPurchaseNotes(e.target.value)}
            />
            <button
              onClick={addPurchase}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Добавить подсписок
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={saveChanges}
            disabled={isSaving}
            className="flex-1 bg-green-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};
