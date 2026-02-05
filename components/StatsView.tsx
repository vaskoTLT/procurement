
import React, { useMemo } from 'react';
import { ShoppingList, ShoppingItem } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { TrendingUp, DollarSign, Wallet, Activity } from 'lucide-react';

interface StatsViewProps {
  lists: ShoppingList[];
}

export const StatsView: React.FC<StatsViewProps> = ({ lists }) => {
  // Robust recursive summation for leaf nodes (items that actually cost money)
  const sumLeafPrice = (items: ShoppingItem[], type: 'spent' | 'planned'): number => {
    return items.reduce((acc, item) => {
      // If a group has children, its price is purely an aggregate of its contents
      if (item.children && item.children.length > 0) {
        return acc + sumLeafPrice(item.children, type);
      }
      
      // If it's a leaf node or an empty group, count its price
      const isBought = item.isBought;
      if (type === 'spent' && isBought) return acc + item.price;
      if (type === 'planned' && !isBought) return acc + item.price;
      
      return acc;
    }, 0);
  };

  const countLeafItems = (items: ShoppingItem[]): number => {
    return items.reduce((acc, item) => {
      if (item.children && item.children.length > 0) {
        return acc + countLeafItems(item.children);
      }
      return acc + 1;
    }, 0);
  };

  const chartData = useMemo(() => {
    return lists.map(list => {
      const spent = sumLeafPrice(list.items, 'spent');
      const planned = sumLeafPrice(list.items, 'planned');
      const total = spent + planned;
      const itemsCount = countLeafItems(list.items);
      
      return {
        name: list.name.length > 8 ? list.name.substring(0, 8) + '..' : list.name,
        spent,
        planned,
        total,
        items: itemsCount
      };
    }).filter(d => d.total > 0 || d.items > 0);
  }, [lists]);

  const totalSpent = useMemo(() => sumLeafPrice(lists.flatMap(l => l.items), 'spent'), [lists]);
  const totalPlanned = useMemo(() => sumLeafPrice(lists.flatMap(l => l.items), 'planned'), [lists]);
  const totalBudget = totalSpent + totalPlanned;

  const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
        <TrendingUp className="w-16 h-16 mb-4 opacity-10" />
        <h3 className="text-lg font-bold">Нет данных</h3>
        <p className="max-w-[200px]">Начните закупки, чтобы увидеть графики расходов.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="bg-green-50 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Куплено</p>
          </div>
          <p className="text-xl font-black text-green-600 mt-1">{totalSpent.toLocaleString()} ₽</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="bg-yellow-50 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <Wallet className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Осталось</p>
          </div>
          <p className="text-xl font-black text-gray-800 mt-1">{totalPlanned.toLocaleString()} ₽</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Процент выполнения</h3>
          </div>
          <span className="text-xs font-black text-green-600">
            {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
          <div 
            className="bg-green-600 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(22,163,74,0.4)]" 
            style={{ width: `${totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-[10px] text-gray-400 font-bold uppercase">
          <span>0 ₽</span>
          <span>Итоговый бюджет: {totalBudget.toLocaleString()} ₽</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest border-b pb-2">Статистика по спискам</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value.toLocaleString()} ₽`, '']}
              />
              <Bar dataKey="spent" name="Куплено" stackId="a" fill="#16a34a" />
              <Bar dataKey="planned" name="В планах" stackId="a" fill="#f3f4f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
