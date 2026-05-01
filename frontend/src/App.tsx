/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  LogOut, 
  User, 
  Plus, 
  Trash2, 
  ChevronRight,
  Search,
  X,
  Edit2,
  Camera,
  Loader2,
  Play,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Product, Order, View } from './types';
import { userApi, goodsApi, ordersApi } from './api';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
const toasts: Toast[] = [];
const toastListeners: Set<() => void> = new Set();

function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const id = ++toastId;
  toasts.push({ id, message, type });
  toastListeners.forEach(fn => fn());
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === id);
    if (index > -1) toasts.splice(index, 1);
    toastListeners.forEach(fn => fn());
  }, 3000);
}

function ToastContainer() {
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    toastListeners.add(listener);
    return () => { toastListeners.delete(listener); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <ToastContainer />
    </BrowserRouter>
  );
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState<{ name: string } | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      return { name: u.username || u.email };
    }
    return null;
  });
  const navigate = useNavigate();
  const location = useLocation();

  if (!isLoggedIn && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen onLogin={() => { setIsLoggedIn(true); navigate('/products'); }} />} />
      <Route path="/" element={user ? <Layout user={user} setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="simulation" element={<SimulationCenter />} />
      </Route>
    </Routes>
  );
}

function Layout({ user, setIsLoggedIn }: { 
  user: { name: string }, 
  setIsLoggedIn: (val: boolean) => void,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await userApi.logout();
    } catch (err) {
      console.error('退出失败', err);
    } finally {
      setIsLoggedIn(false);
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-700 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between py-8 px-6">
        <div className="space-y-8">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600"></div>
              商管系统
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">Product Manager Hub</p>
          </div>

          <nav className="space-y-1">
            <NavButton 
              active={location.pathname === '/products'} 
              onClick={() => navigate('/products')}
              icon={<Package size={18} />}
              label="商品管理"
            />
            <NavButton 
              active={location.pathname === '/orders'} 
              onClick={() => navigate('/orders')}
              icon={<ShoppingCart size={18} />}
              label="订单管理"
            />
            <NavButton 
              active={location.pathname === '/simulation'} 
              onClick={() => navigate('/simulation')}
              icon={<Play size={18} />}
              label="模拟中心"
            />
          </nav>
        </div>

        {/* User Info Simplified */}
        <div className="border-t border-slate-100 pt-6 px-2">
          <div className="text-center mb-4">
            <p className="text-sm font-semibold text-slate-900 tracking-tight">管理员</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="h-full"
          >
            {location.pathname === '/products' && <ProductManagement />}
            {location.pathname === '/orders' && <OrderManagement />}
            {location.pathname === '/simulation' && <SimulationCenter />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- COMPONENTS ---

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState(localStorage.getItem('login_email') || '');
  const [code, setCode] = useState('');
  const [sendingCaptcha, setSendingCaptcha] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    localStorage.setItem('login_email', value);
  };

  const handleSendCaptcha = async () => {
    if (!email) {
      setError('请输入邮箱');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入正确的邮箱格式');
      return;
    }
    setSendingCaptcha(true);
    setError('');
    try {
      await userApi.sendCaptcha(email);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingCaptcha(false);
    }
  };

  const handleLogin = async () => {
    if (!code) {
      setError('请输入验证码');
      return;
    }
    setLoggingIn(true);
    setError('');
    try {
      await userApi.login({ email, code });
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm p-10 bg-white rounded-xl shadow-sm border border-slate-200"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center text-white mx-auto mb-6">
            <LayoutDashboard size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">自助贩卖机商品管理系统</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Vending Machine Management</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase">邮箱</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase">验证码</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              />
              <button
                onClick={handleSendCaptcha}
                disabled={sendingCaptcha || countdown > 0}
                className="px-3 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {countdown > 0 ? `${countdown}s` : sendingCaptcha ? '发送中...' : '获取验证码'}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button 
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg mt-6 hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-50"
          >
            {loggingIn ? '登录中...' : '开启管理'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProductManagement({ key }: { key?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<string>('');
  const pageSize = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await goodsApi.getList(currentPage, pageSize, appliedSearch || undefined, sort);
      setProducts(res.items);
      setTotalCount(res.total_count);
    } catch (err: any) {
      console.error('加载商品失败:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setEditingProduct(null);
  }, [appliedSearch]);

  useEffect(() => {
    setEditingProduct(null);
  }, [currentPage]);

  useEffect(() => {
    loadProducts();
  }, [currentPage, appliedSearch, sort]);

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSort = (newSort: string) => {
    setSort(prev => prev === newSort ? '' : newSort);
  };

  const handleAdd = async (p: Omit<Product, 'id'>) => {
    try {
      await goodsApi.create(p);
      setIsModalOpen(false);
      setCurrentPage(1);
      loadProducts();
      showToast('商品添加成功');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdate = async (p: Product) => {
    try {
      await goodsApi.update(p.id, { name: p.name, price: p.price, stock: p.stock });
      setEditingProduct(null);
      loadProducts();
      showToast('商品更新成功');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个商品吗？')) return;
    try {
      await goodsApi.delete(id);
      if (editingProduct?.id === id) setEditingProduct(null);
      loadProducts();
      showToast('商品删除成功');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRecognizeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRecognizing(true);
    try {
      const res = await goodsApi.recognize(file);
      showToast(`识别完成！共识别 ${res.total} 个商品`);
      setCurrentPage(1);
      loadProducts();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsRecognizing(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <h2 className="text-xl font-semibold text-slate-900">商品管理</h2>
        <div className="flex gap-3 items-center">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="搜索商品..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all w-48 focus:w-64"
            />
            <button 
              onClick={handleSearch}
              className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-r-lg hover:bg-blue-700 transition-colors border border-blue-600 border-l-0"
            >
              搜索
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={handleRecognizeClick}
            disabled={isRecognizing}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isRecognizing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {isRecognizing ? '正在识别...' : '识别商品'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            新增
          </button>
        </div>
      </header>

      <div className="flex-1 p-8 flex gap-8 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 z-10">
                    <tr className="text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                      <th className="px-6 py-4">商品名称</th>
                      <th 
                        className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors select-none"
                        onClick={() => handleSort(sort === 'price_desc' ? 'price_asc' : sort === 'price_asc' ? '' : 'price_desc')}
                      >
                        <span className="inline-flex items-center gap-1">
                          销售价格
                          {sort === 'price_asc' && <span className="text-blue-600">↑</span>}
                          {sort === 'price_desc' && <span className="text-blue-600">↓</span>}
                        </span>
                      </th>
                      <th 
                        className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors select-none"
                        onClick={() => handleSort(sort === 'stock_asc' ? 'stock_desc' : sort === 'stock_desc' ? '' : 'stock_desc')}
                      >
                        <span className="inline-flex items-center gap-1">
                          当前库存
                          {sort === 'stock_asc' && <span className="text-blue-600">↑</span>}
                          {sort === 'stock_desc' && <span className="text-blue-600">↓</span>}
                        </span>
                      </th>
                      <th className="px-6 py-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-50">
                    {products.map(product => (
                      <tr 
                        key={product.id}
                        onClick={() => setEditingProduct(product)}
                        className={`hover:bg-blue-50/30 transition-all group cursor-pointer border-l-2 ${
                          editingProduct?.id === product.id ? 'border-l-blue-500 bg-blue-50/50' : 'border-l-transparent hover:border-l-blue-500'
                        }`}
                      >
                        <td className="px-6 py-5 font-medium text-slate-900">{product.name}</td>
                        <td className="px-6 py-5 text-slate-500">¥{product.price.toLocaleString()}</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.stock < 10 ? 'bg-red-50 text-red-700' : product.stock < 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
                          }`}>
                            {product.stock} 件
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={(e) => handleDelete(product.id, e)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <p className="text-xs font-semibold text-slate-400">第 {currentPage} / {totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize)} 页</p>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                    className="px-3 py-1 text-xs font-bold bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                  >
                    上一页
                  </button>
                  <button 
                    disabled={currentPage === Math.ceil(totalCount / pageSize) || totalCount === 0}
                    onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1)); }}
                    className="px-3 py-1 text-xs font-bold bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>

            {/* Edit Panel */}
            <div className="w-80 bg-white border border-blue-100 rounded-xl shadow-sm p-6 flex flex-col shrink-0">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  {editingProduct ? '商品详细信息' : '选择商品'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingProduct ? '正在查看或修改选中的商品' : '在左侧列表中点击商品以查看详情'}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {editingProduct ? (
                  <motion.div 
                    key={editingProduct.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">商品名称</label>
                      <input 
                        type="text" 
                        value={editingProduct.name}
                        onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">价格 (CNY)</label>
                      <input 
                        type="text" 
                        value={editingProduct.price}
                        onChange={e => {
                          const val = e.target.value.replace(/[^\d]/g, '');
                          if (val === '' || (Number(val) >= 0 && Number(val) <= 999)) {
                            setEditingProduct({...editingProduct, price: val === '' ? 0 : Number(val)});
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">库存数量</label>
                      <input 
                        type="text" 
                        value={editingProduct.stock}
                        onChange={e => {
                          const val = e.target.value.replace(/[^\d]/g, '');
                          if (val === '' || (Number(val) >= 0 && Number(val) <= 999)) {
                            setEditingProduct({...editingProduct, stock: val === '' ? 0 : Number(val)});
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                      />
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-50 space-y-2">
                      <button 
                        onClick={() => handleUpdate(editingProduct)}
                        className="w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                      >
                        保存修改
                      </button>
                      <button 
                        onClick={() => setEditingProduct(null)}
                        className="w-full py-2 bg-white text-slate-600 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        返回列表
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mb-4">
                      <Package size={24} className="text-slate-300" />
                    </div>
                    <p className="text-xs font-medium text-slate-400">暂无选中内容</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <ProductModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAdd} 
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onSubmit }: { product?: Product, onClose: () => void, onSubmit: (p: any) => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || 0,
    stock: product?.stock || 0
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white p-8 rounded-xl shadow-2xl border border-blue-100"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold text-slate-900">{product ? '修改商品' : '新增商品'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">商品名称</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">价格 (CNY)</label>
              <input 
                type="text" 
                value={formData.price}
                onChange={e => {
                  const val = e.target.value.replace(/[^\d]/g, '');
                  if (val === '' || (Number(val) >= 0 && Number(val) <= 999)) {
                    setFormData({...formData, price: val === '' ? 0 : Number(val)});
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">库存数量</label>
              <input 
                type="text" 
                value={formData.stock}
                onChange={e => {
                  const val = e.target.value.replace(/[^\d]/g, '');
                  if (val === '' || (Number(val) >= 0 && Number(val) <= 999)) {
                    setFormData({...formData, stock: val === '' ? 0 : Number(val)});
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
              />
            </div>
          </div>
          <button 
            onClick={() => onSubmit(formData)}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg mt-6 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
          >
            {product ? '保存更改' : '确认添加'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function OrderManagement({ key }: { key?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await ordersApi.getList(1, 100);
      const items = res.items.map(item => ({
        id: item.id,
        goods_info: item.goods_info,
        total_price: item.total_price,
        order_time: item.order_time,
        status: item.status as Order['status'],
      }));
      setOrders(items);
      setTotalCount(res.total_count);
    } catch (err: any) {
      console.error('加载订单失败:', err.message);
    }
  };

  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentOrders = orders.slice(startIndex, startIndex + pageSize);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <h2 className="text-xl font-semibold text-slate-900">订单管理</h2>
        <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">订单总数: {totalCount}</div>
      </header>

      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10">
                <tr className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="px-6 py-4">订单号</th>
                  <th className="px-6 py-4">商品信息</th>
                  <th className="px-6 py-4">下单时间</th>
                  <th className="px-6 py-4">总额</th>
                  <th className="px-6 py-4">状态</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {currentOrders.map(order => (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-blue-50/30 transition-all group cursor-pointer border-l-2 border-l-transparent hover:border-l-blue-500"
                  >
                    <td className="px-6 py-4 font-mono text-[13px] text-slate-500">{order.id}</td>
                    <td className="px-6 py-4">
                      {order.goods_info ? (
                        <div className="space-y-1">
                          {order.goods_info.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{item.name}</span>
                              <span className="text-slate-400">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">未交易</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{order.order_time}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">¥{order.total_price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-300 group-hover:text-blue-600 transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-xs font-semibold text-slate-400">第 {currentPage} / {totalPages} 页</p>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                className="px-3 py-1 text-xs font-bold bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
              >
                上一页
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                className="px-3 py-1 text-xs font-bold bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const styles = {
    Completed: 'bg-green-50 text-green-700',
    Shipped: 'bg-blue-50 text-blue-700',
    Pending: 'bg-yellow-50 text-yellow-700',
    Cancelled: 'bg-red-50 text-red-700'
  };

  const labels = {
    Completed: '已完成',
    Shipped: '已出库',
    Pending: '待处理',
    Cancelled: '已取消'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function OrderDetailsModal({ order, onClose }: { order: Order, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white p-10 rounded-xl shadow-2xl border border-blue-100"
      >
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">订单详细信息</p>
            <h3 className="text-xl font-bold text-slate-900">{order.id}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="mb-10">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-4">商品明细</p>
          {order.goods_info ? (
            <div className="space-y-3">
              {order.goods_info.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-5 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="text-base font-bold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500 mt-1">单价 ¥{item.single_price.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-900">x{item.quantity}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">¥{(item.single_price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-lg font-semibold text-slate-500">未交易</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-10">
          <DetailItem label="订单时间" value={order.order_time} />
          <DetailItem label="当前状态" value={<StatusBadge status={order.status} />} />
        </div>

        <div className="p-8 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl flex justify-between items-center">
          <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">应付总额</p>
          <p className="text-4xl font-black text-blue-600">¥{order.total_price.toLocaleString()}</p>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-white border border-slate-200 py-3 rounded-lg mt-8 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          返回订单中心
        </button>
      </motion.div>
    </div>
  );
}

function SimulationCenter({ key }: { key?: string }) {
  const navigate = useNavigate();
  const [isSimulating, setIsSimulating] = useState(false);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string>('');
  const [afterPreview, setAfterPreview] = useState<string>('');
  const [result, setResult] = useState<Order | null>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleBeforeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBeforeImage(file);
    setBeforePreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAfterImage(file);
    setAfterPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleSimulate = async () => {
    if (!beforeImage || !afterImage) {
      showToast('请上传开门前和关门后的图片', 'error');
      return;
    }

    setIsSimulating(true);
    try {
      const order = await ordersApi.simulate(beforeImage, afterImage);
      setIsSimulating(false);
      
      const cancelled = order.status === 'Cancelled';
      setResult(order);
      
      if (cancelled) {
        showToast('未检测到商品变化，订单已取消', 'info');
      } else {
        const names = order.goods_info?.map(o => `${o.name} x${o.quantity}`).join(', ') || '';
        showToast(`订单已完成: ${names}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setBeforeImage(null);
    setAfterImage(null);
    setBeforePreview('');
    setAfterPreview('');
    setResult(null);
    if (beforeInputRef.current) beforeInputRef.current.value = '';
    if (afterInputRef.current) afterInputRef.current.value = '';
  };

  const handleViewOrders = () => {
    navigate('/orders');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <h2 className="text-xl font-semibold text-slate-900">模拟中心</h2>
        <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Vending Simulation</div>
      </header>

      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {!result ? (
            <>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-4">开门前</h3>
                  <input 
                    type="file" 
                    ref={beforeInputRef} 
                    onChange={handleBeforeChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  {beforePreview ? (
                    <div className="relative">
                      <img src={beforePreview} alt="开门前" className="w-full h-48 object-cover rounded-lg" />
                      <button 
                        onClick={handleReset}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => beforeInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                    >
                      <Camera size={32} className="mb-2" />
                      <span className="text-sm">点击上传</span>
                    </button>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-4">关门后</h3>
                  <input 
                    type="file" 
                    ref={afterInputRef} 
                    onChange={handleAfterChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  {afterPreview ? (
                    <div className="relative">
                      <img src={afterPreview} alt="关门后" className="w-full h-48 object-cover rounded-lg" />
                      <button 
                        onClick={handleReset}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => afterInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                    >
                      <Camera size={32} className="mb-2" />
                      <span className="text-sm">点击上传</span>
                    </button>
                  )}
                </div>
              </div>

              <button 
                onClick={handleSimulate}
                disabled={isSimulating || !beforeImage || !afterImage}
                className="w-full px-12 py-5 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-4 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isSimulating ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} />}
                {isSimulating ? '智能解析中...' : '开始识别对比'}
              </button>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${result.status === 'Cancelled' ? 'bg-yellow-50' : 'bg-green-50'}`}>
                {result.status === 'Cancelled' ? (
                  <X size={40} className="text-yellow-500" />
                ) : (
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {result.status === 'Cancelled' ? '订单已取消' : '订单已完成'}
              </h3>
              <p className="text-slate-500 mb-6">
                {result.status === 'Cancelled' ? '未检测到商品变化' : '商品变化已记录'}
              </p>
              
              {result.goods_info && result.goods_info.length > 0 && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg text-left">
                  {result.goods_info.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-slate-700 font-medium">{item.name}</span>
                      <span className="text-slate-500">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button 
                  onClick={handleReset}
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  继续识别
                </button>
                <button 
                  onClick={handleViewOrders}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <ShoppingCart size={18} />
                  查看订单
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="text-slate-900 font-semibold text-base">{value}</div>
    </div>
  );
}
