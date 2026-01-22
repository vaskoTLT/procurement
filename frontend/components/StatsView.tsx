import React, { useMemo } from 'react';
import { ShoppingList } from '../types';
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
import { TrendingUp, DollarSign, ListChecks, Wallet } from 'lucide-react';

interface StatsViewProps {
  lists: ShoppingList[];
}

export const StatsView: React.FC<StatsViewProps> = ({ lists }) => {
  const chartData = useMemo(() => {
    return lists.map(list => {
      const spent = list.items.filter(i => i.isBought).reduce((sum, i) => sum + i.price, 0);
      const planned = list.items.filter(i => !i.isBought).reduce((sum, i) => sum + i.price, 0);
      return {
        name: list.name.length > 8 ? list.name.substring(0, 8) + '..' : list.name,
        spent,
        planned,
        total: spent + planned,
        items: list.items.length
      };
    }).filter(d => d.total > 0 || d.items > 0);
  }, [lists]);

  const totalSpent = useMemo(() => 
    lists.reduce((sum, list) => 
      sum + list.items.filter(i => i.isBought).reduce((s, i) => s + i.price, 0)
    , 0)
  , [lists]);

  const totalPlanned = useMemo(() => 
    lists.reduce((sum, list) => 
      sum + list.items.filter(i => !i.isBought).reduce((s, i) => s + i.price, 0)
    , 0)
  , [lists]);

  const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
        <TrendingUp className="w-16 h-16 mb-4 opacity-10" />
        <h3 className="text-lg font-bold">Нет данных для анализа</h3>
        <p className="max-w-[200px]">Совершите покупки, чтобы увидеть статистику расходов!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="bg-green-50 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Куплено на</p>
          </div>
          <p className="text-xl font-black text-green-600 mt-1">{totalSpent.toLocaleString()} ₽</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="bg-yellow-50 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <Wallet className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">В плане еще</p>
          </div>
          <p className="text-xl font-black text-gray-800 mt-1">{totalPlanned.toLocaleString()} ₽</p>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Прогресс бюджета</h3>
          <span className="text-xs font-bold text-green-600">
            {((totalSpent / (totalSpent + totalPlanned || 1)) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-green-600 h-full transition-all duration-1000" 
            style={{ width: `${(totalSpent / (totalSpent + totalPlanned || 1)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase">
          <span>0 ₽</span>
          <span>{(totalSpent + totalPlanned).toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Расходы по спискам</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="spent" name="Куплено" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="planned" name="В плане" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Item Pie */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Объемы покупок (кол-во)</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="items"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={5}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
