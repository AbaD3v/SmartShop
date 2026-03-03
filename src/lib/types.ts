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

export interface CatalogVariant {
  variant_id: string;
  product_id: string;
  brand: string;
  product_name: string;
  title: string; // если добавил в view
  description: string | null;
  base_image_url: string | null;

  color: string;
  storage_gb: number;
  memory_gb: number;
  price_kzt: number;
  sku: string;
  image_url: string | null;

  is_active: boolean;
  product_is_active: boolean;
}

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
