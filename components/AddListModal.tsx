
import React, { useState } from 'react';

interface AddListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

export const AddListModal: React.FC<AddListModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim());
    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Новый список</h2>
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
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1 text-green-700">Название списка</label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Напр: Продукты, Ремонт..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.97] transition-all duration-150"
            >
              Создать список
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
