/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Play
} from 'lucide-react';
import { Product, Order, View } from './types';

// --- MOCK DATA ---
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: '极简白瓷杯', price: 88, stock: 120 },
  { id: '2', name: '商务蓝牙耳机', price: 299, stock: 45 },
  { id: '3', name: '智能温控办公椅', price: 1299, stock: 12 },
  { id: '4', name: '金属触控台灯', price: 159, stock: 88 },
];

const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-001', productName: '极简白瓷杯', quantity: 2, singlePrice: 88, totalPrice: 176, date: '2024-04-30', status: 'Completed' },
  { id: 'ORD-002', productName: '商务蓝牙耳机', quantity: 1, singlePrice: 299, totalPrice: 299, date: '2024-04-29', status: 'Shipped' },
  { id: 'ORD-003', productName: '智能温控办公椅', quantity: 1, singlePrice: 1299, totalPrice: 1299, date: '2024-04-28', status: 'Pending' },
  { id: 'ORD-004', productName: '金属触控台灯', quantity: 3, singlePrice: 159, totalPrice: 477, date: '2024-04-27', status: 'Completed' },
  { id: 'ORD-005', productName: '极简白瓷杯', quantity: 5, singlePrice: 88, totalPrice: 440, date: '2024-04-26', status: 'Shipped' },
  { id: 'ORD-006', productName: '商务蓝牙耳机', quantity: 2, singlePrice: 299, totalPrice: 598, date: '2024-04-25', status: 'Completed' },
  { id: 'ORD-007', productName: '金属触控台灯', quantity: 1, singlePrice: 159, totalPrice: 159, date: '2024-04-24', status: 'Pending' },
];

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [user] = useState({ name: 'Admin User' });
  const navigate = useNavigate();
  const location = useLocation();

  // Persistence
  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));
  }, []);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [products, orders]);

  if (!isLoggedIn && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen onLogin={() => { setIsLoggedIn(true); navigate('/products'); }} />} />
      <Route path="/" element={<Layout user={user} setIsLoggedIn={setIsLoggedIn} products={products} setProducts={setProducts} orders={orders} setOrders={setOrders} />}>
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="products" element={<ProductManagement products={products} setProducts={setProducts} />} />
        <Route path="orders" element={<OrderManagement orders={orders} />} />
        <Route path="simulation" element={<SimulationCenter orders={orders} setOrders={setOrders} products={products} setProducts={setProducts} />} />
      </Route>
    </Routes>
  );
}

function Layout({ user, setIsLoggedIn, products, setProducts, orders, setOrders }: { 
  user: { name: string }, 
  setIsLoggedIn: (val: boolean) => void,
  products: Product[],
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
  orders: Order[],
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>
}) {
  const navigate = useNavigate();
  const location = useLocation();

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
            onClick={() => { setIsLoggedIn(false); navigate('/login'); }}
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
            {location.pathname === '/products' && <ProductManagement products={products} setProducts={setProducts} />}
            {location.pathname === '/orders' && <OrderManagement orders={orders} />}
            {location.pathname === '/simulation' && <SimulationCenter orders={orders} setOrders={setOrders} products={products} setProducts={setProducts} />}
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">登录系统</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Geometric Balance Interface</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase">账号</label>
            <input 
              type="text" 
              defaultValue="admin"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase">密码</label>
            <input 
              type="password" 
              defaultValue="123456"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          </div>
          <button 
            onClick={onLogin}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg mt-6 hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            开启管理
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProductManagement({ products, setProducts }: { products: Product[], setProducts: React.Dispatch<React.SetStateAction<Product[]>>, key?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAdd = (p: Omit<Product, 'id'>) => {
    const newProduct = { ...p, id: Math.random().toString(36).substr(2, 9) };
    setProducts([...products, newProduct]);
    setIsModalOpen(false);
  };

  const handleUpdate = (p: Product) => {
    if (p.id.startsWith('new-')) {
      const newProduct = { ...p, id: Math.random().toString(36).substr(2, 9) };
      setProducts([...products, newProduct]);
    } else {
      setProducts(products.map(item => item.id === p.id ? p : item));
    }
    setEditingProduct(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个商品吗？')) {
      setProducts(products.filter(p => p.id !== id));
      if (editingProduct?.id === id) setEditingProduct(null);
    }
  };

  const handleRecognizeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditingProduct({
      id: 'new-' + Date.now(),
      name: '识别出的商品',
      price: 99,
      stock: 50
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <h2 className="text-xl font-semibold text-slate-900">商品管理</h2>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="搜索商品..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all w-48 focus:w-64"
            />
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
        {/* Table Container */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10">
                <tr className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="px-6 py-4">商品名称</th>
                  <th className="px-6 py-4">销售价格</th>
                  <th className="px-6 py-4">当前库存</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {filteredProducts.map(product => (
                  <tr 
                    key={product.id}
                    onClick={() => setEditingProduct(product)}
                    className={`hover:bg-blue-50/30 transition-all group cursor-pointer border-l-2 ${
                      editingProduct?.id === product.id ? 'border-l-blue-500 bg-blue-50/50' : 'border-l-transparent hover:border-l-blue-500'
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                    <td className="px-6 py-4 text-slate-500">¥{product.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.stock < 10 ? 'bg-red-50 text-red-700' : product.stock < 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
                      }`}>
                        {product.stock} 件
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => handleDelete(product.id, e)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    type="number" 
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">库存数量</label>
                  <input 
                    type="number" 
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
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
                type="number" 
                value={formData.price}
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">库存数量</label>
              <input 
                type="number" 
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
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

function OrderManagement({ orders }: { orders: Order[], key?: string }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(orders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentOrders = orders.slice(startIndex, startIndex + pageSize);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <h2 className="text-xl font-semibold text-slate-900">订单管理</h2>
        <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">订单总数: {orders.length}</div>
      </header>

      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10">
                <tr className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="px-6 py-4">订单号</th>
                  <th className="px-6 py-4">商品名称</th>
                  <th className="px-6 py-4">订单日期</th>
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
                    <td className="px-6 py-4 font-medium text-slate-900">{order.productName}</td>
                    <td className="px-6 py-4 text-slate-400">{order.date}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">¥{order.totalPrice.toLocaleString()}</td>
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
    Pending: 'bg-yellow-50 text-yellow-700'
  };

  const labels = {
    Completed: '已完成',
    Shipped: '已出库',
    Pending: '待处理'
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

        <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-10">
          <DetailItem label="商品名称" value={order.productName} />
          <DetailItem label="订单日期" value={order.date} />
          <DetailItem label="商品单价" value={<span>¥{order.singlePrice.toLocaleString()}</span>} />
          <DetailItem label="商品数量" value={`x ${order.quantity}`} />
          <DetailItem label="当前状态" value={<StatusBadge status={order.status} />} />
        </div>

        <div className="p-6 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center shadow-inner">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">应付总额</p>
          <p className="text-2xl font-bold text-blue-600">¥{order.totalPrice.toLocaleString()}</p>
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

function SimulationCenter({ 
  orders, 
  setOrders, 
  products, 
  setProducts 
}: { 
  orders: Order[], 
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
  products: Product[],
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
}) {
  const [isSimulating, setIsSimulating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSimulating(true);
    
    // 模拟数据
    setTimeout(() => {
      const mockItems = [
        { name: '营养快线', quantity: 1, price: 5 },
        { name: '元气水', quantity: 1, price: 3 }
      ];

      const newOrders: Order[] = mockItems.map((item) => ({
        id: 'SIM-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        productName: item.name,
        quantity: item.quantity,
        singlePrice: item.price,
        totalPrice: item.price * item.quantity,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed'
      }));

      setOrders(prev => [...newOrders, ...prev]);
      
      setProducts(prev => prev.map(p => {
        const matched = mockItems.find(i => i.name === p.name);
        if (matched) {
          return { ...p, stock: Math.max(0, p.stock - matched.quantity) };
        }
        return p;
      }));
      
      setIsSimulating(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert(`识别成功！已自动结算: ${mockItems.map(i => i.name).join(', ')}`);
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <h2 className="text-xl font-semibold text-slate-900">模拟中心</h2>
        <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Vending Simulation</div>
      </header>

      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 mb-8 font-bold shadow-inner">
            {isSimulating ? <Loader2 size={40} className="animate-spin" /> : <Camera size={40} />}
          </div>
          <h3 className="text-2xl font-bold mb-3 text-slate-900">模拟关门结算场景</h3>
          <p className="text-base text-slate-400 max-w-md mb-10 leading-relaxed font-medium">
            用户在自助柜挑选商品并关门后，系统将自动分析内部画面并生成订单记录。
          </p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isSimulating}
            className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-4 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 active:scale-95 disabled:opacity-50 transition-all duration-300"
          >
            {isSimulating ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} />}
            {isSimulating ? '智能解析中...' : '识别分析图片 (模拟关门动作)'}
          </button>
          
          <div className="mt-12 pt-8 border-t border-slate-50 w-full flex justify-center gap-12 text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
              视觉识别引擎
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
              自动结算系统
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
              库存实时同步
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="text-slate-900 font-semibold text-sm">{value}</div>
    </div>
  );
}
