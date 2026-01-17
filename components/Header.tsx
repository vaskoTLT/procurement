
import React from 'react';
import { SyncIcon, CloudDoneIcon, ErrorIcon } from './Icons';

interface HeaderProps {
  title: string;
  onArchive?: () => void;
  onBack?: () => void;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
}

export const Header: React.FC<HeaderProps> = ({ title, onArchive, onBack, syncStatus = 'idle' }) => {
  return (
    <header className="sticky top-0 z-50 tg-secondary-bg shadow-sm px-4 py-4 flex items-center">
      {onBack && (
        <button onClick={onBack} className="mr-3 p-1 text-green-600 active:opacity-60">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      
      <div className="flex-1 flex flex-col min-w-0">
        <h1 className="text-xl font-bold tracking-tight truncate leading-tight">{title}</h1>
        <div className="flex items-center gap-1.5 mt-0.5">
          {syncStatus === 'syncing' && (
            <>
              <SyncIcon className="w-3 h-3 text-green-400 animate-spin" />
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Обмен данными...</span>
            </>
          )}
          {syncStatus === 'success' && (
            <>
              <CloudDoneIcon className="w-3 h-3 text-green-500" />
              <span className="text-[10px] text-green-600 font-medium uppercase tracking-tighter">Сохранено в облако</span>
            </>
          )}
          {syncStatus === 'error' && (
            <>
              <ErrorIcon className="w-3 h-3 text-red-500" />
              <span className="text-[10px] text-red-500 font-medium uppercase tracking-tighter">Ошибка связи</span>
            </>
          )}
        </div>
      </div>

      {onArchive && (
        <button 
          onClick={onArchive}
          className="text-sm font-medium text-green-700 active:opacity-60 ml-2 bg-green-50 px-3 py-1.5 rounded-full"
        >
          В архив
        </button>
      )}
    </header>
  );
};
