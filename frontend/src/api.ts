import { Product, Order, GoodsInfoItem } from './types';

const API_BASE_URL = 'http://localhost:8088/goodsmanager/v1';

async function request(url: string, options: RequestInit = {}) {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err: any) {
    if (err.message === 'Failed to fetch') {
      throw new Error('服务器繁忙');
    }
    throw err;
  }
}

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

function getHeadersMultipart() {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
}

export interface LoginRequest {
  email: string;
  code: string;
}

export interface LoginResponse {
  id: string;
  email: string;
  username: string;
  access_token: string;
  token_type: string;
}

export interface PageableResponse<T> {
  total_count: number;
  items: T[];
}

export interface OrderRaw {
  id: string;
  goods_info: GoodsInfoItem[] | null;
  total_price: number;
  order_time: string;
  status: string;
}

export interface RecognizedItem {
  label: string;
  name: string;
  count: number;
}

export interface RecognizeResponse {
  items: RecognizedItem[];
  total: number;
}

export const userApi = {
  async sendCaptcha(email: string) {
    const res = await request(`${API_BASE_URL}/users/captcha`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || '发送验证码失败');
    }
    return res.json();
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await request(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || '登录失败');
    }
    const result = await res.json();
    localStorage.setItem('token', result.access_token);
    localStorage.setItem('user', JSON.stringify({ id: result.id, email: result.email, username: result.username }));
    return result;
  },

  async getMe() {
    const res = await request(`${API_BASE_URL}/users/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('获取用户信息失败');
    }
    return res.json();
  },

  async logout() {
    const res = await request(`${API_BASE_URL}/users/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return res.ok;
  },
};

export const goodsApi = {
  async getList(page = 1, page_size = 10, search?: string, sort?: string): Promise<PageableResponse<Product>> {
    const params = new URLSearchParams({ page: String(page), page_size: String(page_size) });
    if (search) params.append('search', search);
    if (sort && sort !== '') params.append('sort', sort);
    const url = `${API_BASE_URL}/goods/list?${params}`;
    const res = await request(url, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('获取商品列表失败');
    }
    return res.json();
  },

  async create(data: { name: string; price: number; stock: number }): Promise<Product> {
    const res = await request(`${API_BASE_URL}/goods`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('新增商品失败');
    }
    return res.json();
  },

  async update(id: string, data: { name?: string; price?: number; stock?: number }): Promise<Product> {
    const res = await request(`${API_BASE_URL}/goods/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('更新商品失败');
    }
    return res.json();
  },

  async delete(id: string) {
    const res = await request(`${API_BASE_URL}/goods/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('删除商品失败');
    }
    return res.json();
  },

  async recognize(file: File): Promise<RecognizeResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await request(`${API_BASE_URL}/goods/recognize`, {
      method: 'POST',
      headers: getHeadersMultipart(),
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || '识别商品失败');
    }
    return res.json();
  },
};

export const ordersApi = {
  async getList(page = 1, page_size = 100, search?: string): Promise<PageableResponse<OrderRaw>> {
    const params = new URLSearchParams({ page: String(page), page_size: String(page_size) });
    if (search) params.append('search', search);
    const res = await request(`${API_BASE_URL}/orders/list?${params}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('获取订单列表失败');
    }
    return res.json();
  },

  async create(data: { goods_id: string; quantity: number }): Promise<OrderRaw> {
    const res = await request(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('创建订单失败');
    }
    return res.json();
  },

  async updateStatus(id: string, status: string): Promise<OrderRaw> {
    const res = await request(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error('更新订单状态失败');
    }
    return res.json();
  },

  async delete(id: string) {
    const res = await request(`${API_BASE_URL}/orders/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('删除订单失败');
    }
    return res.json();
  },

  async simulate(beforeImage: File, afterImage: File): Promise<Order> {
    const formData = new FormData();
    formData.append('before_image', beforeImage);
    formData.append('after_image', afterImage);
    const res = await request(`${API_BASE_URL}/orders/simulate`, {
      method: 'POST',
      headers: getHeadersMultipart(),
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || '模拟下单失败');
    }
    return res.json();
  },
};
