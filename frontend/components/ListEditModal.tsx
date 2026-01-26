import React, { useState } from 'react';
import { ShoppingList } from '../types';
import { X } from 'lucide-react';
import { apiService } from '../services/apiService';

interface ListEditModalProps {
  list: ShoppingList;
  onClose: () => void;
  onUpdate: (list: ShoppingList) => void;
}

export const ListEditModal: React.FC<ListEditModalProps> = ({ list, onClose, onUpdate }) => {
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const saveChanges = async () => {
    if (!name.trim()) {
      alert('Укажите название списка');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await apiService.updateList(list.id, {
        name: name.trim(),
        description: description.trim(),
      });

      onUpdate(updated);
      onClose();
    } catch (error) {
      console.error('Error saving list:', error);
      alert('Ошибка при сохранении списка');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Редактировать список</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-5 mb-8">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Название</label>
            <input
              autoFocus
              type="text"
              placeholder="Назовите список"
              className="w-full text-lg border-b-2 border-green-500 focus:ring-0 outline-none pb-1 text-gray-800 bg-transparent"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Описание (опционально)</label>
            <textarea
              placeholder="Добавьте описание списка..."
              className="w-full bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl transition-colors text-sm"
          >
            Отмена
          </button>
          <button
            onClick={saveChanges}
            disabled={isSaving || !name.trim()}
            className="flex-[2] bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};
