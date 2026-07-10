import * as productRepository from './repository.js';
import { recordProductEvent } from '../../audit/service.js';
import type {
  AdminProduct,
  ProductListItem,
  ProductListResponse,
  CreateProductInput,
  UpdateProductInput,
  ProductListParams,
} from './types.js';

function toListResponse(
  products: ProductListItem[],
  total: number,
  page: number,
  perPage: number,
): ProductListResponse {
  return {
    products,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function listProducts(params: ProductListParams): Promise<ProductListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const { products, total } = await productRepository.listProducts({ ...params, page, perPage });
  return toListResponse(products, total, page, perPage);
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  return productRepository.getProductById(id);
}

export async function createProduct(
  input: CreateProductInput,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<AdminProduct> {
  const slugExists = await productRepository.slugExists(input.slug);
  if (slugExists) {
    throw new AppError('SLUG_EXISTS', `A product with slug "${input.slug}" already exists`, 409);
  }

  const product = await productRepository.createProduct(input);

  await recordProductEvent(userId, 'product_created', {
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    status: product.status,
  }, ipAddress, userAgent);

  return product;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<AdminProduct | null> {
  const existing = await productRepository.getProductById(id);
  if (!existing) return null;

  if (input.slug && input.slug !== existing.slug) {
    const slugExists = await productRepository.slugExists(input.slug, id);
    if (slugExists) {
      throw new AppError('SLUG_EXISTS', `A product with slug "${input.slug}" already exists`, 409);
    }
  }

  const product = await productRepository.updateProduct(id, input);

  if (product) {
    await recordProductEvent(userId, 'product_updated', {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      changes: Object.keys(input),
    }, ipAddress, userAgent);
  }

  return product;
}

export async function publishProduct(
  id: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<AdminProduct | null> {
  const product = await productRepository.getProductById(id);
  if (!product) return null;
  if (product.status === 'published') return product;

  const updated = await productRepository.updateProductStatus(id, 'published');
  if (updated) {
    await recordProductEvent(userId, 'product_published', {
      productId: updated.id,
      productName: updated.name,
      productSlug: updated.slug,
    }, ipAddress, userAgent);
  }
  return updated;
}

export async function unpublishProduct(
  id: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<AdminProduct | null> {
  const product = await productRepository.getProductById(id);
  if (!product) return null;
  if (product.status === 'draft') return product;

  const updated = await productRepository.updateProductStatus(id, 'draft');
  if (updated) {
    await recordProductEvent(userId, 'product_unpublished', {
      productId: updated.id,
      productName: updated.name,
      productSlug: updated.slug,
    }, ipAddress, userAgent);
  }
  return updated;
}

export async function archiveProduct(
  id: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<AdminProduct | null> {
  const product = await productRepository.getProductById(id);
  if (!product) return null;
  if (product.status === 'archived') return product;

  const updated = await productRepository.updateProductStatus(id, 'archived');
  if (updated) {
    await recordProductEvent(userId, 'product_archived', {
      productId: updated.id,
      productName: updated.name,
      productSlug: updated.slug,
    }, ipAddress, userAgent);
  }
  return updated;
}

export async function restoreProduct(
  id: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<AdminProduct | null> {
  const product = await productRepository.getProductById(id);
  if (!product) return null;
  if (product.status !== 'archived') return product;

  const updated = await productRepository.updateProductStatus(id, 'draft');
  if (updated) {
    await recordProductEvent(userId, 'product_restored', {
      productId: updated.id,
      productName: updated.name,
      productSlug: updated.slug,
    }, ipAddress, userAgent);
  }
  return updated;
}

export async function getProductAudit(id: string): Promise<{
  id: string;
  event: string;
  user_id: string | null;
  user_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}[]> {
  return productRepository.getProductAuditLog(id);
}

export async function getCategories(): Promise<string[]> {
  return productRepository.getCategories();
}

class AppError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export { AppError };
