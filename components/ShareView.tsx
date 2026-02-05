
import React from 'react';
import { ShoppingList, ShoppingItem, Unit } from '../types';
import { 
  CheckCircle2, 
  Download, 
  Home, 
  ChevronDown, 
  ChevronRight,
  Layers
} from 'lucide-react';

interface ShareViewProps {
  list: ShoppingList;
  onImport: () => void;
  onGoHome: () => void;
}

export const ShareView: React.FC<ShareViewProps> = ({ list, onImport, onGoHome }) => {
  const sumLeafItems = (items: ShoppingItem[], type: 'total'): number => {
    return items.reduce((acc, item) => {
      if (item.children && item.children.length > 0) {
        return acc + sumLeafItems(item.children, type);
      }
      return acc + item.price;
    }, 0);
  };

  const totalCost = sumLeafItems(list.items, 'total');

  // @fix: Added key to props type to avoid TypeScript errors when rendering in a list.
  const RenderSharedItem = ({ item, depth = 0 }: { item: ShoppingItem, depth?: number, key?: React.Key }) => {
    const hasChildren = item.children && item.children.length > 0;
    const unitMap: Record<Unit, string> = { [Unit.PCS]: 'шт', [Unit.KG]: 'кг', [Unit.G]: 'г', [Unit.L]: 'л', [Unit.ML]: 'мл' };

    return (
      <div className="flex flex-col">
        <div 
          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm relative" 
          style={{ marginLeft: `${depth * 12}px` }}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${item.isBought ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 bg-white'}`}>
             {item.isBought && <CheckCircle2 className="w-4 h-4" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {hasChildren && <ChevronDown className="w-3 h-3 text-blue-600" />}
              <p className={`font-bold truncate text-sm text-gray-800 ${item.isBought ? 'line-through text-gray-400' : ''}`}>
                {item.name}
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-bold ml-1">
              {item.quantity} {unitMap[item.unit]} • {item.price.toLocaleString()} ₽
            </p>
          </div>
        </div>
        {hasChildren && (
          <div className="mt-1 space-y-1 ml-3 border-l-2 border-blue-50">
            {item.children!.map(child => <RenderSharedItem key={child.id} item={child} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-blue-700 rounded-2xl p-6 text-white shadow-lg text-center">
        <h2 className="text-2xl font-black mb-1">{list.name}</h2>
        <p className="text-blue-200 text-xs font-medium opacity-80 uppercase tracking-widest">Общий список для просмотра</p>
        <div className="mt-4 pt-4 border-t border-blue-600 flex justify-center gap-8">
          <div className="text-center">
            <p className="text-[10px] text-blue-200 font-bold uppercase">Товаров</p>
            <p className="text-xl font-black">{list.items.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-blue-200 font-bold uppercase">Сумма</p>
            <p className="text-xl font-black">{totalCost.toLocaleString()} ₽</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={onImport}
          className="flex-1 bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm active:scale-95 transition-all"
        >
          <Download className="w-5 h-5" />
          Сохранить к себе
        </button>
        <button 
          onClick={onGoHome}
          className="px-6 bg-white border border-gray-200 text-gray-600 font-bold py-4 rounded-2xl text-sm active:scale-95 transition-all"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {list.items.length === 0 ? (
          <div className="text-center py-10 text-gray-400 italic text-sm">Список пуст</div>
        ) : (
          list.items.map(item => <RenderSharedItem key={item.id} item={item} />)
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t z-50">
        <p className="text-[10px] text-center text-gray-400 font-medium mb-3">Нажми "Сохранить к себе", чтобы начать редактировать и отмечать товары</p>
        <button 
          onClick={onImport}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm active:scale-95 transition-all"
        >
          <Download className="w-5 h-5" />
          Добавить в мои списки
        </button>
      </div>
    </div>
  );
};
