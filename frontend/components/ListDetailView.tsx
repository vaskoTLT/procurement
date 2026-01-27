import React, { useState } from 'react';
import { ShoppingList, ShoppingItem, Unit } from '../types';
import { apiService } from '../services/apiService';
import { ItemEditModal } from './ItemEditModal';
import { 
  Plus, 
  Minus,
  Check, 
  X, 
  Trash2, 
  Sparkles,
  ChevronDown,
  Edit2
} from 'lucide-react';

interface ListDetailViewProps {
  list: ShoppingList;
  onUpdateList: (list: ShoppingList) => void;
}

export const ListDetailView: React.FC<ListDetailViewProps> = ({ list, onUpdateList }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [newItemUnit, setNewItemUnit] = useState<Unit>(Unit.PCS);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  // Расчет общей стоимости с учетом количества
  const calculateItemTotal = (item: ShoppingItem) => {
    // Если есть подсписки, считаем полную сумму по ним
    if (item.purchases && item.purchases.length > 0) {
      return item.purchases.reduce((sum, p) => {
        return sum + (p.price_per_unit ? p.price_per_unit * p.quantity : 0);
      }, 0);
    }
    // Если нет подсписков, цена уже содержит полную сумму
    return item.price;
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;
    
    try {
      const pricePerUnit = parseFloat(newItemPrice);
      const totalPrice = (isNaN(pricePerUnit) ? 0 : pricePerUnit) * newItemQty;
      
      await apiService.createItem(list.id, {
        name: newItemName.trim(),
        quantity: newItemQty,
        unit: newItemUnit,
        price: totalPrice,  // общая стоимость = цена за единицу * количество
        isBought: false
      });

      setNewItemName('');
      setNewItemQty(1);
      setNewItemPrice('');
      setIsAdding(false);
      
      // Reload items for this list
      const items = await apiService.getItemsForList(list.id);
      onUpdateList({ ...list, items });
    } catch (error) {
      console.error('Ошибка при добавлении товара:', error);
      alert('Не удалось добавить товар. Пожалуйста, попробуйте еще раз.');
    }
  };

  const toggleItem = async (itemId: string, item?: ShoppingItem) => {
    try {
      // Если есть подсписки и ничего не отмечено, отмечаем все при отметке товара
      if (item && item.purchases && item.purchases.length > 0) {
        const purchasedCount = item.purchases.filter(p => p.is_purchased).length;
        
        // Если ничего не было отмечено и нажали отметить товар целиком
        if (purchasedCount === 0 && !item.isBought) {
          // Отмечаем все подсписки
          for (const purchase of item.purchases) {
            if (!purchase.is_purchased) {
              await apiService.togglePurchase(itemId, purchase.id);
            }
          }
        }
      }
      
      // Отмечаем сам товар
      await apiService.toggleItem(itemId);
      
      // Reload items for this list
      const items = await apiService.getItemsForList(list.id);
      onUpdateList({ ...list, items });
    } catch (error) {
      console.error('Ошибка при изменении товара:', error);
      alert('Не удалось изменить товар. Пожалуйста, попробуйте еще раз.');
    }
  };

  const editItem = async (item: ShoppingItem) => {
    setEditingItem(item);
  };

  const handleItemUpdated = async (updatedItem: ShoppingItem) => {
    setEditingItem(null);
    // Reload items for this list
    const items = await apiService.getItemsForList(list.id);
    onUpdateList({ ...list, items });
  };

  const deletePurchase = async (itemId: string, purchaseId: number) => {
    try {
      await apiService.deleteItemPurchase(itemId, purchaseId);
      // Reload items for this list
      const items = await apiService.getItemsForList(list.id);
      onUpdateList({ ...list, items });
    } catch (error) {
      console.error('Ошибка при удалении подсписка:', error);
      alert('Не удалось удалить подсписок');
    }
  };

  const togglePurchase = async (itemId: string, purchaseId: number) => {
    try {
      const updatedItem = await apiService.toggleItemPurchase(itemId, purchaseId);
      // Reload items for this list
      const items = await apiService.getItemsForList(list.id);
      onUpdateList({ ...list, items });
    } catch (error) {
      console.error('Ошибка при отметке подсписка:', error);
      alert('Не удалось отметить подсписок');
    }
  };

  const editPurchasePrice = async (itemId: string, purchaseId: number, currentPrice: number) => {
    const priceStr = prompt(`Укажите новую цену за 1 единицу:`, currentPrice.toString());
    if (priceStr === null) return;
    
    const price = parseFloat(priceStr || '0');
    if (isNaN(price)) {
      alert('Пожалуйста, введите корректное число');
      return;
    }

    try {
      const updatedItem = await apiService.updateItemPurchasePrice(itemId, purchaseId, price);
      // Reload items for this list
      const items = await apiService.getItemsForList(list.id);
      onUpdateList({ ...list, items });
    } catch (error) {
      console.error('Ошибка при изменении цены подсписка:', error);
      alert('Не удалось изменить цену подсписка');
    }
  };

  const editItemPrice = async (itemId: string) => {
    const item = list.items.find(i => i.id === itemId);
    if (!item) return;
    
    const priceStr = prompt(`Укажите стоимость для "${item.name}" (за ${item.quantity} ${getUnitText(item.unit)}):`, item.price.toString());
    if (priceStr === null) return; // User cancelled
    
    const price = parseFloat(priceStr || '0');
    if (isNaN(price)) {
      alert('Пожалуйста, введите корректную сумму');
      return;
    }

    try {
      await apiService.updateItemPrice(itemId, price);
      
      // Reload items for this list
      const items = await apiService.getItemsForList(list.id);
      onUpdateList({ ...list, items });
    } catch (error) {
      console.error('Ошибка при обновлении цены:', error);
      alert('Не удалось обновить цену. Пожалуйста, попробуйте еще раз.');
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await apiService.deleteItem(itemId);
      
      // Reload items for this list
      const items = await apiService.getItemsForList(list.id);
      onUpdateList({ ...list, items });
    } catch (error) {
      console.error('Ошибка при удалении товара:', error);
      alert('Не удалось удалить товар. Пожалуйста, попробуйте еще раз.');
    }
  };

  const pendingItems = list.items.filter(i => !i.isBought);
  const completedItems = list.items.filter(i => i.isBought);
  
  // Рассчитываем сумму куплено на основе подсписков (если есть) или по isBought (если нет)
  const calculatePurchasedTotal = (item: ShoppingItem) => {
    const purchases = item.purchases || [];
    if (purchases.length > 0) {
      // Если есть подсписки, считаем по ним: только те что помечены как is_purchased
      return purchases.reduce((sum, p) => {
        if (p.is_purchased) {
          return sum + (p.price_per_unit ? p.price_per_unit * p.quantity : 0);
        }
        return sum;
      }, 0);
    }
    // Если нет подсписков, используем флаг товара
    return item.isBought ? item.price : 0;
  };

  // Считаем фактически куплено (по подсписком или по purchased_quantity)
  let actualTotal = 0;
  for (const item of list.items) {
    actualTotal += calculatePurchasedTotal(item);
  }
  
  const estimatedTotal = list.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  
  // Прогресс в зависимости от stanzas (если есть подсписки) или по товарам (если нет)
  let completedCount = 0;
  let totalCount = 0;
  
  for (const item of list.items) {
    const purchases = item.purchases || [];
    if (purchases.length > 0) {
      // Если есть подсписки, считаем их
      const purchasedCount = purchases.filter(p => p.is_purchased).length;
      completedCount += purchasedCount;
      totalCount += purchases.length;
    } else {
      // Если нет подсписков, используем флаг товара
      if (item.isBought) completedCount++;
      totalCount++;
    }
  }
  
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getUnitText = (unit: Unit): string => {
    const unitMap: Record<Unit, string> = {
      [Unit.PCS]: 'шт',
      [Unit.KG]: 'кг',
      [Unit.G]: 'г',
      [Unit.L]: 'л',
      [Unit.ML]: 'мл',
    };
    return unitMap[unit];
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Total Card */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-green-100 text-[10px] font-bold uppercase tracking-wider">Куплено на сумму</p>
            <h2 className="text-3xl font-black">{actualTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</h2>
            <p className="text-green-200 text-xs mt-1 font-medium">
              Весь список: {estimatedTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
        </div>
        
        {/* Progress Strip in Header */}
        <div className="mt-6 relative z-10">
          <div className="flex justify-between text-[10px] font-bold text-green-100 uppercase mb-1">
            <span>Прогресс</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add Item Trigger */}
      <button 
        onClick={() => setIsAdding(true)}
        className="w-full bg-white border-2 border-dashed border-gray-200 rounded-xl py-4 flex items-center justify-center gap-2 text-gray-400 hover:border-green-300 hover:text-green-600 transition-all duration-200 active:scale-95"
      >
        <Plus className="w-5 h-5" />
        <span className="font-semibold">Добавить товар</span>
      </button>

      {/* Add Item Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Что купить?</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Название</label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Напр: Хлеб"
                  className="w-full text-lg border-b-2 border-green-500 focus:ring-0 outline-none pb-1 text-gray-800 bg-transparent"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-[1.5]">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Кол-во</label>
                  <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <button 
                      onClick={() => setNewItemQty(Math.max(0.1, newItemQty - (newItemUnit === Unit.G || newItemUnit === Unit.ML ? 50 : 1)))}
                      className="p-2 text-green-600 active:bg-green-100 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input 
                      type="number" 
                      className="w-full bg-transparent text-center font-bold outline-none border-none py-2 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(parseFloat(e.target.value) || 0)}
                    />
                    <button 
                      onClick={() => setNewItemQty(newItemQty + (newItemUnit === Unit.G || newItemUnit === Unit.ML ? 50 : 1))}
                      className="p-2 text-green-600 active:bg-green-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-[1.2]">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ед. изм.</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-gray-50 rounded-xl px-4 py-2 font-medium outline-none border border-gray-100 focus:ring-2 focus:ring-green-500 appearance-none text-sm"
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value as Unit)}
                    >
                      <option value={Unit.PCS}>шт</option>
                      <option value={Unit.KG}>кг</option>
                      <option value={Unit.G}>г</option>
                      <option value={Unit.L}>л</option>
                      <option value={Unit.ML}>мл</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Цена за 1 единицу</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0"
                    className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-2 font-bold outline-none border border-gray-100 focus:ring-2 focus:ring-green-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold text-sm">₽</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 ml-1 font-medium">
                  Всего: {(parseFloat(newItemPrice) || 0) * newItemQty} ₽ ({newItemQty} × {parseFloat(newItemPrice) || 0})
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl transition-colors text-sm"
                >
                  Отмена
                </button>
                <button 
                  disabled={!newItemName.trim()}
                  onClick={addItem}
                  className="flex-[2] bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-5 h-5" />
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Edit Modal */}
      {editingItem && (
        <ItemEditModal 
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdate={handleItemUpdated}
        />
      )}

      {/* Sections */}
      <div className="space-y-8">
        {/* Pending */}
        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            В списке ({pendingItems.length})
          </h3>
          <div className="space-y-3">
            {pendingItems.length === 0 ? (
              <p className="text-gray-300 italic text-center py-4 text-sm font-medium">Все товары в корзине!</p>
            ) : (
              pendingItems.map(item => (
                <ItemRow 
                  key={item.id} 
                  item={item} 
                  onToggle={() => toggleItem(item.id, item)} 
                  onDelete={() => deleteItem(item.id)}
                  onEditPrice={() => editItemPrice(item.id)}
                  onEdit={() => editItem(item)}
                  isExpanded={expandedItemIds.has(item.id)}
                  onToggleExpand={() => {
                    const newSet = new Set(expandedItemIds);
                    if (newSet.has(item.id)) {
                      newSet.delete(item.id);
                    } else {
                      newSet.add(item.id);
                    }
                    setExpandedItemIds(newSet);
                  }}
                  onDeletePurchase={(purchaseId) => deletePurchase(item.id, purchaseId)}
                  onTogglePurchase={(purchaseId) => togglePurchase(item.id, purchaseId)}
                  onEditPurchasePrice={(purchaseId, price) => editPurchasePrice(item.id, purchaseId, price)}
                />
              ))
            )}
          </div>
        </section>

        {/* Completed */}
        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Куплено ({completedItems.length})
          </h3>
          <div className="space-y-3">
            {completedItems.map(item => (
              <ItemRow 
                key={item.id} 
                item={item} 
                onToggle={() => toggleItem(item.id, item)} 
                onDelete={() => deleteItem(item.id)}
                onEditPrice={() => editItemPrice(item.id)}
                onEdit={() => editItem(item)}
                isExpanded={expandedItemIds.has(item.id)}
                onToggleExpand={() => {
                  const newSet = new Set(expandedItemIds);
                  if (newSet.has(item.id)) {
                    newSet.delete(item.id);
                  } else {
                    newSet.add(item.id);
                  }
                  setExpandedItemIds(newSet);
                }}
                onDeletePurchase={(purchaseId) => deletePurchase(item.id, purchaseId)}
                onTogglePurchase={(purchaseId) => togglePurchase(item.id, purchaseId)}
                onEditPurchasePrice={(purchaseId, price) => editPurchasePrice(item.id, purchaseId, price)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

interface ItemRowProps {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
  onEditPrice: () => void;
  onEdit: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDeletePurchase: (purchaseId: number) => void;
  onTogglePurchase: (purchaseId: number) => void;
  onEditPurchasePrice: (purchaseId: number, price: number) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ item, onToggle, onDelete, onEditPrice, onEdit, isExpanded, onToggleExpand, onDeletePurchase, onTogglePurchase, onEditPurchasePrice }) => {
  const unitMap: Record<Unit, string> = {
    [Unit.PCS]: 'шт',
    [Unit.KG]: 'кг',
    [Unit.G]: 'г',
    [Unit.L]: 'л',
    [Unit.ML]: 'мл',
  };

  const purchases = item.purchases || [];
  const hasPurchases = purchases && purchases.length > 0;

  // Расчет стоимости товара - только то что куплено
  let itemTotal = 0;
  let itemTotalFull = 0;  // Полная стоимость товара
  
  // Если есть подсписки, считаем только помеченные как is_purchased
  if (hasPurchases) {
    itemTotal = purchases.reduce((sum, p) => {
      // Только если помечено как куплено
      if (p.is_purchased) {
        const purchasePrice = p.price_per_unit ? p.price_per_unit * p.quantity : 0;
        return sum + purchasePrice;
      }
      return sum;
    }, 0);
    // Полная стоимость - сумма всех подсписков
    itemTotalFull = purchases.reduce((sum, p) => {
      const purchasePrice = p.price_per_unit ? p.price_per_unit * p.quantity : 0;
      return sum + purchasePrice;
    }, 0);
  } else {
    // Если нет подсписков
    itemTotalFull = item.price; // Полная стоимость товара
    itemTotal = item.isBought ? item.price : 0; // То что куплено
  }

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all active:scale-[0.98] ${item.isBought ? 'bg-gray-50 border-transparent' : ''}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${item.isBought ? 'bg-green-600 border-green-600 text-white shadow-[0_2px_8px_rgba(22,163,74,0.3)]' : 'border-gray-200 hover:border-green-400 bg-white'}`}
        >
          {item.isBought && <Check className="w-5 h-5" strokeWidth={3} />}
        </button>

        {/* Toggle purchases if exist */}
        {hasPurchases && (
          <button
            onClick={() => onToggleExpand()}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
        {!hasPurchases && <div className="w-5" />}

        <div className="flex-1 min-w-0" onClick={onToggle}>
          <div className="flex items-center gap-2">
            <p className={`font-bold truncate text-[15px] ${item.isBought ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {item.name}
            </p>
          </div>
          <p className="text-[11px] text-gray-400 font-bold">
            {item.quantity} {unitMap[item.unit]}{hasPurchases && ` • ${purchases.length} куп.`}
          </p>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onEditPrice(); }}
          className={`flex flex-col items-end px-3 py-1.5 rounded-xl transition-all border ${item.isBought ? 'text-green-700 bg-green-50/50 border-green-100' : 'text-gray-700 bg-gray-50 border-gray-100 hover:border-green-200'}`}
        >
          <span className="text-xs font-black whitespace-nowrap">
            {itemTotalFull > 0 ? `${itemTotalFull.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽` : '0 ₽'}
          </span>
          {itemTotal !== itemTotalFull && itemTotal > 0 && (
            <span className="text-[9px] text-green-600 font-bold">куплено: {itemTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</span>
          )}
          {!hasPurchases && item.quantity > 1 && (
            <span className="text-[9px] text-gray-500 mt-0.5">
              {item.price.toFixed(2)} ₽ × {item.quantity}
            </span>
          )}
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }} 
          className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Purchases (Sub-items) */}
      {hasPurchases && isExpanded && (
        <div className="ml-8 space-y-2">
          {purchases.map((purchase) => (
            <div key={purchase.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${purchase.is_purchased ? 'bg-green-100/60 border-green-300' : 'bg-green-50/40 border-green-100/50'}`}>
              <button 
                onClick={() => onTogglePurchase(purchase.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  purchase.is_purchased 
                    ? 'bg-green-600 border-green-600 text-white' 
                    : 'border-green-300 hover:border-green-500 bg-white'
                }`}
              >
                {purchase.is_purchased && <Check className="w-4 h-4" strokeWidth={3} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] font-semibold ${purchase.is_purchased ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                  {item.name}
                </p>
                <p className={`text-[11px] ${purchase.is_purchased ? 'text-gray-500' : 'text-gray-500'}`}>
                  {purchase.quantity} {unitMap[item.unit]}
                </p>
              </div>

              <div className={`text-right px-2 py-1 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${purchase.is_purchased ? 'bg-green-200/60' : 'bg-green-100/60'}`}
                onClick={() => onEditPurchasePrice(purchase.id, purchase.price_per_unit || 0)}>
                <span className={`text-xs font-bold whitespace-nowrap ${purchase.is_purchased ? 'text-green-800' : 'text-green-700'}`}>
                  {purchase.price_per_unit 
                    ? `${(purchase.quantity * purchase.price_per_unit).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`
                    : '0 ₽'
                  }
                </span>
              </div>

              <button 
                onClick={() => onDeletePurchase(purchase.id)}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
