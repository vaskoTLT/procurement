
import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, LogIn, UserPlus, ShoppingBag, Loader2, Check, User as UserIcon } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: User, remember: boolean) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      try {
        const usersJson = localStorage.getItem('shopping_users') || '[]';
        let users: any[] = JSON.parse(usersJson);

        if (isLogin) {
          // Специальная обработка для главного админа
          if (email === 'vasko8508@gmail.com' && password === '123123') {
            let adminRecord = users.find(u => u.email === email);
            if (!adminRecord) {
              adminRecord = { email, username: 'Admin', password, isAdmin: true, createdAt: Date.now() };
              users.push(adminRecord);
              localStorage.setItem('shopping_users', JSON.stringify(users));
            }
            onLogin({ email, username: adminRecord.username, isAdmin: true, createdAt: adminRecord.createdAt }, rememberMe);
            return;
          }

          const userRecord = users.find(u => u.email === email && u.password === password);
          if (userRecord) {
            onLogin({ 
              email: userRecord.email, 
              username: userRecord.username || userRecord.email.split('@')[0],
              isAdmin: userRecord.isAdmin || userRecord.email === 'vasko8508@gmail.com', 
              createdAt: userRecord.createdAt 
            }, rememberMe);
          } else {
            setError('Неверный email или пароль');
          }
        } else {
          if (users.find(u => u.email === email)) {
            setError('Пользователь с таким email уже существует');
          } else if (!username.trim() && !isLogin) {
            setError('Введите логин');
          } else {
            const isMainAdmin = email === 'vasko8508@gmail.com';
            const newUser = { 
              email, 
              username: username.trim(), 
              password, 
              isAdmin: isMainAdmin, 
              createdAt: Date.now() 
            };
            users.push(newUser);
            localStorage.setItem('shopping_users', JSON.stringify(users));
            onLogin({ 
              email: newUser.email, 
              username: newUser.username, 
              isAdmin: newUser.isAdmin, 
              createdAt: newUser.createdAt 
            }, rememberMe);
          }
        }
      } catch (err) {
        setError('Произошла ошибка при входе');
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 select-none text-gray-800">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-3xl shadow-lg mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Smart List</h1>
          <p className="text-gray-400 text-sm font-medium">Ваш умный помощник по покупкам</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
          <h2 className="text-xl font-bold mb-6">
            {isLogin ? 'С возвращением!' : 'Создать аккаунт'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Логин</label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    required
                    type="text"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    placeholder="Ваш никнейм"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  required
                  type="email"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Пароль</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  required
                  type="password"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                    rememberMe ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {rememberMe && <Check className="w-3.5 h-3.5" strokeWidth={4} />}
                </div>
                <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 transition-colors">Запомнить меня</span>
              </label>
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold text-center animate-shake">{error}</p>
            )}

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Войти</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Зарегистрироваться</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-gray-400 hover:text-green-600 transition-colors"
            >
              {isLogin ? 'У меня нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
