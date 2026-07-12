import * as downloadRepository from './repository.js';
import { recordEvent } from '../../audit/service.js';
import { generateDownloadToken } from '../../services/purchase.service.js';
import type {
  DownloadListParams,
  DownloadListResponse,
  DownloadListItem,
  DownloadDetailResponse,
  DownloadFilterOptions,
} from './types.js';

function toListResponse(
  items: DownloadListItem[],
  total: number,
  page: number,
  perPage: number,
): DownloadListResponse {
  return {
    downloads: items,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function listDownloads(params: DownloadListParams): Promise<DownloadListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const { downloads, total } = await downloadRepository.listDownloads({ ...params, page, perPage });
  return toListResponse(downloads, total, page, perPage);
}

export async function getDownload(id: string): Promise<DownloadDetailResponse | null> {
  const download = await downloadRepository.getDownloadById(id);
  if (!download) return null;

  const [history, audit] = await Promise.all([
    downloadRepository.getDownloadHistory(id, download.purchase_id),
    downloadRepository.getDownloadAuditLog(id, download.purchase_id),
  ]);

  return { download, history, audit };
}

export async function getDownloadHistory(id: string): Promise<{ history: import('./types.js').DownloadHistoryEntry[] } | null> {
  const download = await downloadRepository.getDownloadById(id);
  if (!download) return null;

  const history = await downloadRepository.getDownloadHistory(id, download.purchase_id);
  return { history };
}

export async function getFilterOptions(): Promise<DownloadFilterOptions> {
  const products = await downloadRepository.getProductOptions();
  return { products };
}

export async function revokeToken(
  tokenId: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await downloadRepository.revokeDownloadToken(tokenId);

  const purchaseId = await downloadRepository.getPurchaseIdByTokenId(tokenId);

  await recordEvent(adminUserId, 'token_revoked' as any, {
    download_token_id: tokenId,
    purchase_id: purchaseId,
    action: 'revoke',
  }, ipAddress, userAgent);
}

export async function regenerateToken(
  tokenId: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<{ id: string; token: string; expires_at: string }> {
  const download = await downloadRepository.getDownloadById(tokenId);
  if (!download) throw new Error('Download token not found');

  await downloadRepository.revokeDownloadToken(tokenId);

  const newToken = await generateDownloadToken(download.purchase_id, download.product_id);
  const tokenData = {
    id: newToken.id,
    token: newToken.token,
    expires_at: typeof newToken.expires_at === 'string' ? newToken.expires_at : newToken.expires_at.toISOString(),
  };

  await recordEvent(adminUserId, 'token_regenerated' as any, {
    download_token_id: tokenId,
    new_token_id: newToken.id,
    purchase_id: download.purchase_id,
    action: 'regenerate',
  }, ipAddress, userAgent);

  return tokenData;
}


