
import React, { useState, useEffect } from 'react';
import { ShoppingList } from '../types';
import { Users, LayoutList, Wallet, PieChart, ShieldCheck, TrendingUp, UserCog, Check, ShieldAlert } from 'lucide-react';

interface AdminViewProps {
  allLists: ShoppingList[];
}

export const AdminView: React.FC<AdminViewProps> = ({ allLists }) => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('shopping_users') || '[]');
    setUsers(storedUsers);
  }, []);

  const saveUsers = (updatedUsers: any[]) => {
    localStorage.setItem('shopping_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const toggleAdmin = (email: string) => {
    // Нельзя отозвать права у главного админа
    if (email === 'vasko8508@gmail.com') return;

    const updated = users.map(u => {
      if (u.email === email) {
        return { ...u, isAdmin: !u.isAdmin };
      }
      return u;
    });
    saveUsers(updated);
  };

  const calculateTotalCost = (lists: ShoppingList[]) => {
    let total = 0;
    const sumRecursive = (items: any[]) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          sumRecursive(item.children);
        } else {
          total += (item.price || 0);
        }
      });
    };
    lists.forEach(l => sumRecursive(l.items));
    return total;
  };

  const totalCost = calculateTotalCost(allLists);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-indigo-700 to-blue-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black mb-1">Панель Управления</h2>
            <p className="text-indigo-100 text-xs font-medium opacity-80 uppercase tracking-widest">Администратор системы</p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <div className="mt-8 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl min-w-[140px]">
            <p className="text-[10px] font-bold text-indigo-100 uppercase mb-1">Пользователи</p>
            <p className="text-2xl font-black">{users.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl min-w-[140px]">
            <p className="text-[10px] font-bold text-indigo-100 uppercase mb-1">Списки</p>
            <p className="text-2xl font-black">{allLists.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* User Management Section */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <UserCog className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Пользователи</h3>
          </div>
          
          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-xs">Нет зарегистрированных пользователей</p>
            ) : (
              users.map(u => (
                <div key={u.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{u.email}</p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {u.email === 'vasko8508@gmail.com' ? 'Главный Администратор' : (u.isAdmin ? 'Администратор' : 'Пользователь')}
                    </p>
                  </div>
                  <button 
                    disabled={u.email === 'vasko8508@gmail.com'}
                    onClick={() => toggleAdmin(u.email)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                      u.isAdmin 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-white border border-gray-200 text-gray-400'
                    } disabled:opacity-50`}
                  >
                    {u.isAdmin ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    {u.isAdmin ? 'Снять' : 'Дать Админа'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Оборот товаров</p>
              <h3 className="text-xl font-black text-gray-800">{totalCost.toLocaleString()} ₽</h3>
            </div>
          </div>
          <TrendingUp className="text-green-500 w-5 h-5" />
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Аналитика ресурсов</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Списки на юзера</p>
                <p className="text-lg font-bold text-gray-800">{(allLists.length / (users.length || 1)).toFixed(1)}</p>
              </div>
              <div className="w-32 bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full w-[65%]" />
              </div>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Средний чек</p>
                <p className="text-lg font-bold text-gray-800">{(totalCost / (allLists.length || 1)).toFixed(0)} ₽</p>
              </div>
              <div className="w-32 bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-green-600 h-full w-[45%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
