
import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingList, ShoppingItem, Unit, ShareAccess, User } from '../types';
import { 
  Plus, 
  Minus,
  Check, 
  X, 
  Trash2, 
  Loader2,
  ChevronDown,
  ChevronRight,
  Split,
  Layers,
  Pencil,
  Minimize2,
  Maximize2,
  Share2,
  Users,
  ShieldCheck,
  Eye,
  UserPlus,
  ShieldAlert,
  Search,
  User as UserIcon,
  Mail,
  Copy,
  ExternalLink
} from 'lucide-react';
import { categorizeItem } from '../services/geminiService';

interface ListDetailViewProps {
  list: ShoppingList;
  currentUserEmail: string;
  onUpdateList: (updater: ShoppingList | ((prev: ShoppingList) => ShoppingList)) => void;
}

export const ListDetailView: React.FC<ListDetailViewProps> = ({ list, currentUserEmail, onUpdateList }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [newItemUnit, setNewItemUnit] = useState<Unit>(Unit.PCS);
  const [isAdding, setIsAdding] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allAppUsers, setAllAppUsers] = useState<User[]>([]);
  
  // Permissions Check
  const isOwner = list.ownerEmail === currentUserEmail;
  const userAccess = list.sharedWith?.find(s => s.email === currentUserEmail)?.access || (isOwner ? 'edit' : 'view');
  const isViewOnly = userAccess === 'view';

  // Edit item state
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState(0);
  const [editPrice, setEditPrice] = useState('');

  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});
  const [isSharingLink, setIsSharingLink] = useState(false);

  // Load all users for sharing when modal opens
  useEffect(() => {
    if (isSharingModalOpen) {
      const storedUsers = JSON.parse(localStorage.getItem('shopping_users') || '[]');
      const mappedUsers = storedUsers
        .map((u: any) => ({
          email: u.email,
          username: u.username || u.email.split('@')[0],
          isAdmin: u.isAdmin || false,
          createdAt: u.createdAt || Date.now()
        }))
        .filter((u: User) => u.email !== currentUserEmail);
      setAllAppUsers(mappedUsers);
    }
  }, [isSharingModalOpen, currentUserEmail]);

  const filteredUsers = useMemo(() => {
    return allAppUsers.filter(u => 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allAppUsers, searchQuery]);

  const toggleCollapse = (id: string) => {
    setCollapsedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setCollapsedItems({});
  };

  const collapseAll = () => {
    const allIds: Record<string, boolean> = {};
    const collectIds = (items: ShoppingItem[]) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          allIds[item.id] = true;
          collectIds(item.children);
        }
      });
    };
    collectIds(list.items);
    setCollapsedItems(allIds);
  };

  const handleShareLink = async () => {
    try {
      setIsSharingLink(true);
      const data = btoa(unescape(encodeURIComponent(JSON.stringify(list))));
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${data}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Список покупок: ${list.name}`,
          text: `Посмотри мой список покупок: ${list.name}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Ссылка скопирована в буфер обмена!');
      }
    } catch (e) {
      console.error('Sharing failed', e);
    } finally {
      setIsSharingLink(false);
    }
  };

  const handleQuickAddShare = (targetUser: User) => {
    if (list.sharedWith?.some(s => s.email === targetUser.email)) {
      alert('У этого пользователя уже есть доступ.');
      return;
    }

    const newShare: ShareAccess = { email: targetUser.email, access: 'view' };
    onUpdateList(prev => ({
      ...prev,
      sharedWith: [...(prev.sharedWith || []), newShare]
    }));
  };

  const toggleUserAccess = (email: string) => {
    onUpdateList(prev => ({
      ...prev,
      sharedWith: (prev.sharedWith || []).map(s => 
        s.email === email ? { ...s, access: s.access === 'view' ? 'edit' : 'view' } : s
      )
    }));
  };

  const removeShare = (email: string) => {
    onUpdateList(prev => ({
      ...prev,
      sharedWith: (prev.sharedWith || []).filter(s => s.email !== email)
    }));
  };

  const calculateItemTotals = (item: ShoppingItem): { price: number; quantity: number } => {
    if (!item.children || item.children.length === 0) {
      return { price: item.price, quantity: item.quantity };
    }
    return item.children.reduce((acc, child) => {
      const totals = calculateItemTotals(child);
      return {
        price: acc.price + totals.price,
        quantity: acc.quantity + totals.quantity
      };
    }, { price: 0, quantity: 0 });
  };

  const addItem = async () => {
    if (isViewOnly || !newItemName.trim()) return;

    setIsCategorizing(true);
    const category = isGroupMode ? 'Group' : await categorizeItem(newItemName);
    
    const parsedPrice = parseFloat(newItemPrice);
    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItemName.trim(),
      quantity: newItemQty,
      unit: newItemUnit,
      price: isNaN(parsedPrice) ? 0 : parsedPrice,
      isBought: false,
      category,
      isGroup: isGroupMode,
      children: []
    };

    onUpdateList((prevList) => {
      const addRecursive = (items: ShoppingItem[]): ShoppingItem[] => {
        if (!targetParentId) return [newItem, ...items];
        return items.map(item => {
          if (item.id === targetParentId) {
            return { ...item, children: [newItem, ...(item.children || [])] };
          }
          if (item.children && item.children.length > 0) {
            return { ...item, children: addRecursive(item.children) };
          }
          return item;
        });
      };
      return { ...prevList, items: addRecursive(prevList.items) };
    });
    
    if (targetParentId) {
      setCollapsedItems(prev => ({ ...prev, [targetParentId]: false }));
    }
    
    if (isGroupMode) {
      setTargetParentId(newItem.id);
      setIsGroupMode(false);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQty(1);
      setIsCategorizing(false);
    } else {
      if (targetParentId) {
        setNewItemName('');
        setNewItemPrice('');
        setNewItemQty(1);
        setIsCategorizing(false);
      } else {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice('');
    setIsAdding(false);
    setIsCategorizing(false);
    setIsGroupMode(false);
    setTargetParentId(null);
  };

  const handleEditSubmit = () => {
    if (isViewOnly || !editingItem || !editName.trim()) return;
    
    onUpdateList((prevList) => {
      const updateRecursive = (items: ShoppingItem[]): ShoppingItem[] => {
        return items.map(item => {
          if (item.id === editingItem.id) {
            return { 
              ...item, 
              name: editName.trim(), 
              quantity: editQty,
              price: parseFloat(editPrice) || 0
            };
          }
          if (item.children && item.children.length > 0) {
            return { ...item, children: updateRecursive(item.children) };
          }
          return item;
        });
      };
      return { ...prevList, items: updateRecursive(prevList.items) };
    });
    
    setEditingItem(null);
  };

  const toggleItem = (itemId: string) => {
    if (isViewOnly) return;
    onUpdateList((prevList) => {
      const findItem = (items: ShoppingItem[]): ShoppingItem | undefined => {
        for (const item of items) {
          if (item.id === itemId) return item;
          if (item.children && item.children.length > 0) {
            const found = findItem(item.children);
            if (found) return found;
          }
        }
      };

      const itemToToggle = findItem(prevList.items);
      if (!itemToToggle) return prevList;

      const newStatus = !itemToToggle.isBought;

      const setStatusRecursive = (item: ShoppingItem, status: boolean): ShoppingItem => ({
        ...item,
        isBought: status,
        children: item.children ? item.children.map(c => setStatusRecursive(c, status)) : []
      });

      const updateItems = (items: ShoppingItem[]): ShoppingItem[] => {
        return items.map(item => {
          if (item.id === itemId) return setStatusRecursive(item, newStatus);
          if (item.children && item.children.length > 0) {
            return { ...item, children: updateItems(item.children) };
          }
          return item;
        });
      };

      return { ...prevList, items: updateItems(prevList.items) };
    });
  };

  const splitIntoUnits = (itemId: string) => {
    if (isViewOnly) return;
    onUpdateList((prevList) => {
      const splitRecursive = (items: ShoppingItem[]): ShoppingItem[] => {
        return items.map(item => {
          if (item.id === itemId && item.quantity > 1 && (!item.children || item.children.length === 0)) {
            const unitPrice = item.price / item.quantity;
            const units: ShoppingItem[] = Array.from({ length: item.quantity }).map((_, i) => ({
              id: `${item.id}-unit-${i}`,
              name: `${item.name} #${i + 1}`,
              quantity: 1,
              unit: item.unit,
              price: unitPrice,
              isBought: item.isBought,
              children: []
            }));
            return { ...item, children: units, isGroup: true };
          }
          if (item.children && item.children.length > 0) return { ...item, children: splitRecursive(item.children) };
          return item;
        });
      };
      return { ...prevList, items: splitRecursive(prevList.items) };
    });
    setCollapsedItems(prev => ({ ...prev, [itemId]: false }));
  };

  const sumLeafItems = (items: ShoppingItem[], type: 'spent' | 'total'): number => {
    return items.reduce((acc, item) => {
      if (item.children && item.children.length > 0) {
        return acc + sumLeafItems(item.children, type);
      }
      if (type === 'spent') {
        return acc + (item.isBought ? item.price : 0);
      }
      return acc + item.price;
    }, 0);
  };

  const actualTotal = sumLeafItems(list.items, 'spent');
  const estimatedTotal = sumLeafItems(list.items, 'total');

  const getFlatLeafItems = (items: ShoppingItem[]): ShoppingItem[] => {
    return items.reduce((acc, item) => {
      if (!item.children || item.children.length === 0) return [...acc, item];
      return [...acc, ...getFlatLeafItems(item.children)];
    }, [] as ShoppingItem[]);
  };

  const flatLeafItems = getFlatLeafItems(list.items);
  const progressPercent = flatLeafItems.length > 0 
    ? (flatLeafItems.filter(i => i.isBought).length / flatLeafItems.length) * 100 
    : 0;

  const RenderItem = ({ item, depth = 0 }: { item: ShoppingItem, depth?: number, key?: React.Key }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isCollapsed = collapsedItems[item.id] ?? false;
    const totals = calculateItemTotals(item);
    const unitMap: Record<Unit, string> = { [Unit.PCS]: 'шт', [Unit.KG]: 'кг', [Unit.G]: 'г', [Unit.L]: 'л', [Unit.ML]: 'мл' };

    return (
      <div className="flex flex-col">
        <div 
          className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all relative ${item.isBought ? 'bg-gray-50 border-transparent opacity-80' : ''}`} 
          style={{ marginLeft: `${depth * 14}px` }}
        >
          {depth > 0 && (
            <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-2.5 h-[2px] bg-gray-200" />
          )}
          
          <button 
            disabled={isViewOnly}
            onClick={() => toggleItem(item.id)}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${item.isBought ? 'bg-green-600 border-green-600 text-white shadow-sm' : 'border-gray-200 bg-white'} ${isViewOnly ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            {item.isBought && <Check className="w-4 h-4" strokeWidth={4} />}
          </button>

          <div className="flex-1 min-w-0" onClick={() => hasChildren ? toggleCollapse(item.id) : toggleItem(item.id)}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <div className="text-green-600">
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              )}
              <p className={`font-bold truncate text-sm ${item.isBought ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {item.name}
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-bold ml-1">
              {totals.quantity} {unitMap[item.unit]}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {!isViewOnly && (
              <>
                {!hasChildren && item.quantity > 1 && !item.isBought && (
                  <button onClick={(e) => { e.stopPropagation(); splitIntoUnits(item.id); }} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg border border-gray-100"><Split className="w-3.5 h-3.5" /></button>
                )}
                <button onClick={(e) => { e.stopPropagation(); setTargetParentId(item.id); setIsAdding(true); }} className="p-1.5 text-gray-400 hover:text-green-600 bg-gray-50 rounded-lg border border-gray-100"><Plus className="w-3.5 h-3.5" /></button>
              </>
            )}

            <button 
              disabled={isViewOnly}
              onClick={(e) => { 
                e.stopPropagation(); 
                setEditingItem(item);
                setEditName(item.name);
                setEditQty(item.quantity);
                setEditPrice(item.price.toString());
              }}
              className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-all border ${hasChildren ? 'bg-gray-100 border-gray-200' : 'bg-gray-50 border-gray-100'} ${isViewOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-1">
                <span className={`text-[11px] font-black ${hasChildren ? 'text-gray-500' : 'text-green-700'}`}>{totals.price.toLocaleString()} ₽</span>
                {!isViewOnly && <Pencil className="w-2.5 h-2.5 text-gray-400" />}
              </div>
            </button>

            {!isViewOnly && (
              <button onClick={(e) => { e.stopPropagation(); if (confirm('Удалить?')) { 
                onUpdateList((prevList) => {
                  const deleteRecursive = (items: ShoppingItem[]): ShoppingItem[] => {
                    return items.filter(i => i.id !== item.id).map(i => ({ ...i, children: i.children ? deleteRecursive(i.children) : [] }));
                  };
                  return { ...prevList, items: deleteRecursive(prevList.items) };
                });
              }}} className="p-1.5 text-gray-300 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        
        {hasChildren && !isCollapsed && (
          <div className="mt-2 space-y-2 border-l-2 border-gray-100 ml-3 pl-1 mb-2">
            {item.children!.map(child => <RenderItem key={child.id} item={child} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-4 right-4 z-20">
          <button onClick={() => setIsSharingModalOpen(true)} className="bg-white/20 p-2.5 rounded-full backdrop-blur-md hover:bg-white/30 active:scale-95 transition-all flex items-center gap-2" title="Поделиться">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-green-100 text-[10px] font-bold uppercase tracking-wider">Куплено на сумму</p>
            <h2 className="text-3xl font-black">{actualTotal.toLocaleString()} ₽</h2>
            <p className="text-green-200 text-xs mt-1 font-medium">Всего в списке: {estimatedTotal.toLocaleString()} ₽</p>
          </div>
        </div>
        <div className="mt-6 relative z-10">
          <div className="flex justify-between text-[10px] font-bold text-green-100 uppercase mb-1"><span>Прогресс</span><span>{progressPercent.toFixed(0)}%</span></div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden"><div className="bg-white h-full transition-all duration-500 shadow-[0_0_10px_white]" style={{ width: `${progressPercent}%` }} /></div>
        </div>
      </div>

      <div className="flex gap-2">
        {!isViewOnly && (
          <button onClick={() => setIsAdding(true)} className="flex-1 bg-white border-2 border-dashed border-gray-200 rounded-xl py-3.5 flex items-center justify-center gap-2 text-gray-400 hover:border-green-300 hover:text-green-600 active:scale-95 transition-all">
            <Plus className="w-5 h-5" /><span className="font-semibold">Добавить</span>
          </button>
        )}
        <button onClick={collapseAll} className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 text-gray-400 active:bg-gray-50 transition-all" title="Свернуть всё">
          <Minimize2 className="w-5 h-5" />
        </button>
        <button onClick={expandAll} className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 text-gray-400 active:bg-gray-50 transition-all" title="Развернуть всё">
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Sharing Access Modal */}
      {isSharingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Поделиться списком</h2>
              <button onClick={() => setIsSharingModalOpen(false)} className="p-2 text-gray-400"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="space-y-6 overflow-y-auto pr-1">
              {/* Public Share Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Публичный доступ</h3>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Ссылка для просмотра</p>
                      <p className="text-[10px] text-blue-600 font-medium">Любой с этой ссылкой сможет увидеть список</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleShareLink}
                    disabled={isSharingLink}
                    className="p-3 bg-white border border-blue-200 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                  >
                    {isSharingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Registered Users Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Конкретные пользователи</h3>
                
                {isOwner && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Поиск пользователей по имени..." 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                  </div>
                )}

                {/* Already Shared */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl border border-green-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-green-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{list.ownerEmail}</p>
                        <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider">Вы (Владелец)</p>
                      </div>
                    </div>
                  </div>

                  {list.sharedWith?.map(s => (
                    <div key={s.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          {s.access === 'view' ? <Eye className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{s.email}</p>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${s.access === 'view' ? 'text-amber-500' : 'text-blue-500'}`}>
                            {s.access === 'view' ? 'Только просмотр' : 'Может редактировать'}
                          </span>
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => toggleUserAccess(s.email)} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 active:scale-95 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => removeShare(s.email)} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 active:scale-95 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Available Users Selection */}
                {isOwner && (
                  <div className="space-y-2 pt-2 border-t border-gray-50">
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {filteredUsers.length === 0 ? (
                        <p className="text-center py-4 text-gray-400 text-[11px] italic">Введите имя для поиска...</p>
                      ) : (
                        filteredUsers.map(u => {
                          const alreadyShared = list.sharedWith?.some(s => s.email === u.email);
                          return (
                            <div key={u.email} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${alreadyShared ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-green-200 shadow-sm'}`}>
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <UserIcon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-800 truncate">{u.username}</p>
                                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Mail className="w-2.5 h-2.5" />
                                    <span className="truncate">{u.email}</span>
                                  </div>
                                </div>
                              </div>
                              {!alreadyShared ? (
                                <button 
                                  onClick={() => handleQuickAddShare(u)}
                                  className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 active:scale-90 transition-all"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                              ) : (
                                <div className="p-2.5 text-green-500">
                                  <Check className="w-4 h-4" strokeWidth={3} />
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => setIsSharingModalOpen(false)} className="w-full bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl text-sm mt-6">Готово</button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAdding && !isViewOnly && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{targetParentId ? `В набор...` : 'Что закупаем?'}</h2>
              <button onClick={resetForm} className="p-2 text-gray-400"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="space-y-5">
              {!targetParentId && (
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button onClick={() => setIsGroupMode(false)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${!isGroupMode ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}>Товар</button>
                  <button onClick={() => setIsGroupMode(true)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${isGroupMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>Группа</button>
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Название</label>
                <input autoFocus type="text" className="w-full text-lg border-b-2 border-green-500 focus:ring-0 outline-none pb-1 text-gray-800 bg-transparent" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
              </div>
              {!isGroupMode && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Кол-во</label>
                    <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                      <button onClick={() => setNewItemQty(Math.max(0.1, newItemQty - 1))} className="p-2 text-green-600"><Minus className="w-4 h-4" /></button>
                      <input type="number" className="w-full bg-transparent text-center font-bold outline-none py-2 text-sm" value={newItemQty} onChange={(e) => setNewItemQty(parseFloat(e.target.value) || 0)} />
                      <button onClick={() => setNewItemQty(newItemQty + 1)} className="p-2 text-green-600"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Цена (всего)</label>
                    <div className="relative">
                      <input type="number" className="w-full bg-gray-50 rounded-xl pl-8 pr-4 py-2.5 font-bold outline-none border border-gray-100 text-sm" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-green-600 font-bold text-xs">₽</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={resetForm} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl text-sm">Готово</button>
                <button disabled={isCategorizing || !newItemName.trim()} onClick={addItem} className="flex-[2] bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                  {isCategorizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Edit Modal */}
      {editingItem && !isViewOnly && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Редактировать</h2>
              <button onClick={() => setEditingItem(null)} className="p-2 text-gray-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Название</label>
                <input autoFocus type="text" className="w-full text-lg border-b-2 border-green-500 focus:ring-0 outline-none pb-1 text-gray-800 bg-transparent" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              {!(editingItem.children && editingItem.children.length > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Кол-во</label>
                    <input type="number" className="w-full bg-gray-50 rounded-xl px-4 py-2.5 font-bold outline-none border border-gray-100 text-sm" value={editQty} onChange={(e) => setEditQty(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Цена</label>
                    <input type="number" className="w-full bg-gray-50 rounded-xl px-4 py-2.5 font-bold outline-none border border-gray-100 text-sm" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingItem(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl text-sm">Отмена</button>
                <button onClick={handleEditSubmit} className="flex-[2] bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg text-sm">Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {list.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <Layers className="w-16 h-16 mb-2 opacity-10" />
            <p className="italic text-center text-sm">Начните закупки!</p>
          </div>
        ) : (
          list.items.map(item => <RenderItem key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
};
