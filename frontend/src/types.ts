export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Order {
  id: string;
  productName: string;
  quantity: number;
  singlePrice: number;
  totalPrice: number;
  date: string;
  status: 'Pending' | 'Completed' | 'Shipped';
}

export type View = 'products' | 'orders' | 'simulation';
