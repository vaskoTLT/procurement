
import React, { useState } from 'react';
// @fix: Removed conflicting User import from lucide-react and added User type import from types.ts
import { ShieldCheck, Key, User as UserIcon, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { User } from '../types';

interface ProfileViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser }) => {
  const [username, setUsername] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    setTimeout(() => {
      try {
        const users = JSON.parse(localStorage.getItem('shopping_users') || '[]');
        const userIndex = users.findIndex((u: any) => u.email === user.email);

        if (userIndex === -1) throw new Error('Пользователь не найден');

        // Check password if trying to change it
        if (newPassword) {
          if (users[userIndex].password !== currentPassword) {
            setStatus({ type: 'error', message: 'Текущий пароль неверен' });
            setIsLoading(false);
            return;
          }
          if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: 'Пароли не совпадают' });
            setIsLoading(false);
            return;
          }
          users[userIndex].password = newPassword;
        }

        // Update username
        users[userIndex].username = username.trim();
        
        localStorage.setItem('shopping_users', JSON.stringify(users));
        onUpdateUser({ ...user, username: username.trim() });
        
        setStatus({ type: 'success', message: 'Профиль успешно обновлен' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        setStatus({ type: 'error', message: 'Ошибка при сохранении' });
      } finally {
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-800">
      <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black">{user.username}</h2>
            <p className="text-green-100 text-xs font-medium opacity-80">{user.email}</p>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
            {user.isAdmin ? 'Администратор' : 'Пользователь'}
          </span>
          <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
            Регистрация: {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-5 h-5 text-green-600" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Настройки профиля</h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Логин</label>
            <div className="relative mt-1">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-gray-400" />
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Смена пароля (необязательно)</h4>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="Текущий пароль"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-green-500 transition-all"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Новый пароль"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-green-500 transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Подтвердите новый пароль"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-green-500 transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {status && (
            <div className={`flex items-center gap-2 p-4 rounded-2xl text-xs font-bold ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {status.message}
            </div>
          )}

          <button
            disabled={isLoading || !username.trim()}
            type="submit"
            className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Сохранить изменения
          </button>
        </form>
      </div>
    </div>
  );
};
