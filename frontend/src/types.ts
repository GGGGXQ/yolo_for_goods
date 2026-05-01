export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface GoodsInfoItem {
  goods_id: string | null;
  name: string;
  quantity: number;
  single_price: number;
}

export interface Order {
  id: string;
  goods_info: GoodsInfoItem[] | null;
  total_price: number;
  order_time: string;
  status: 'Pending' | 'Completed' | 'Shipped' | 'Cancelled';
}

export type View = 'products' | 'orders' | 'simulation';
