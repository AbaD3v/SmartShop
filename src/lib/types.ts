export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  work_hours?: string; // ✅ добавляем
  created_at?: string;
}

export type CatalogVariant = {
  variant_id: string;
  product_id: string;
  slug: string;
  brand: string;
  title: string;
  description?: string;
  image_url?: string;
  color: string;
  memory_gb: number;
  price_kzt: number;
  is_active: boolean;
};

export type CartItem = {
  variant_id: string;
  quantity: number;
  price_kzt: number;
  color: string;
  memory_gb: number;
  title: string;
  brand: string;
  image_url?: string;
};

export type CartResponse = {
  cartId: string;
  items: CartItem[];
};
