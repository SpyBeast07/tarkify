export type ProductStatus = 'draft' | 'published' | 'archived';
export type ProductVisibility = 'public' | 'hidden';

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  type: string;
  price: number;
  currency: string;
  download_key: string | null;
  status: ProductStatus;
  visibility: ProductVisibility;
  category: string;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  version: string;
  release_date: string | null;
  release_notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  price: number;
  currency: string;
  status: ProductStatus;
  visibility: ProductVisibility;
  category: string;
  version: string;
  download_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  products: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  tags?: string[];
  visibility?: ProductVisibility;
  status?: ProductStatus;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  download_key?: string;
  version?: string;
  release_date?: string;
  release_notes?: string;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  tags?: string[];
  visibility?: ProductVisibility;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  download_key?: string;
  version?: string;
  release_date?: string;
  release_notes?: string;
}

export interface ProductListParams {
  search?: string;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  category?: string;
  sort?: 'newest' | 'oldest' | 'updated' | 'price' | 'name';
  page?: number;
  perPage?: number;
}

export interface AuditDetail {
  id: string;
  event: string;
  user_id: string | null;
  user_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
