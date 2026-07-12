import { Hono } from 'hono';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as audit from './service.js';
import { auditListQuerySchema } from './validation.js';
import type { AuditListParams } from './types.js';

const app = new Hono<AppEnv>();

app.use('*', requireAuth, requireRole('admin'));

function parseQuery(c: import('hono').Context): {
  params: Record<string, unknown>;
  error: string | null;
} {
  const parsed = auditListQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { params: {}, error: `${first.path.join('.')}: ${first.message}` };
  }
  return { params: parsed.data as Record<string, unknown>, error: null };
}

app.get('/', async (c) => {
  const { params, error } = parseQuery(c);
  if (error) return errorResponse(c, 'VALIDATION_ERROR', error, 400);
  try {
    const result = await audit.listAuditLogs(params as AuditListParams);
    return c.json(result);
  } catch (err) {
    console.error('[admin/audit] Failed to list audit logs:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load audit logs', 500);
  }
});

app.get('/options', async (c) => {
  try {
    const options = await audit.getOptions();
    return c.json(options);
  } catch (err) {
    console.error('[admin/audit] Failed to load audit options:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load audit options', 500);
  }
});

app.get('/stats', async (c) => {
  try {
    const stats = await audit.getStats();
    return c.json(stats);
  } catch (err) {
    console.error('[admin/audit] Failed to load audit stats:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load audit stats', 500);
  }
});

app.get('/export', async (c) => {
  const { params, error } = parseQuery(c);
  if (error) return errorResponse(c, 'VALIDATION_ERROR', error, 400);

  const format = (c.req.query('format') || 'json').toLowerCase();
  if (format !== 'csv' && format !== 'json') {
    return errorResponse(c, 'VALIDATION_ERROR', 'format must be "csv" or "json"', 400);
  }

  try {
    const filename = `audit-export-${new Date().toISOString().slice(0, 10)}`;
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        if (format === 'csv') {
          controller.enqueue(encoder.encode(AUDIT_CSV_HEADER));
        } else {
          controller.enqueue(encoder.encode('['));
        }

        let first = true;
        for await (const batch of audit.streamAuditRows(params as AuditListParams)) {
          for (const row of batch) {
            if (format === 'csv') {
              controller.enqueue(encoder.encode(auditRowToCsv(row) + '\n'));
            } else {
              const prefix = first ? '' : ',';
              controller.enqueue(encoder.encode(prefix + JSON.stringify(row)));
              first = false;
            }
          }
        }

        if (format === 'json') {
          controller.enqueue(encoder.encode(']'));
        }
        controller.close();
      }
    });

    const contentType = format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json';
    return new Response(stream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${format}"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    console.error('[admin/audit] Failed to export audit logs:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to export audit logs', 500);
  }
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const detail = await audit.getAuditById(id);
    if (!detail) {
      return errorResponse(c, 'NOT_FOUND', 'Audit entry not found', 404);
    }
    return c.json(detail);
  } catch (err) {
    console.error('[admin/audit] Failed to load audit detail:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load audit detail', 500);
  }
});

const AUDIT_CSV_HEADER =
  'id,timestamp,event,module,status,actor_email,actor_name,target,ip_address,user_agent,device,request_id,metadata\n';

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function auditRowToCsv(row: {
  id: string;
  createdAt: string;
  event: string;
  module: string;
  status: string;
  actor: { email: string; name: string | null } | null;
  target: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  device: string | null;
  requestId: string | null;
  metadata: Record<string, unknown>;
}): string {
  return [
    csvEscape(row.id),
    csvEscape(row.createdAt),
    csvEscape(row.event),
    csvEscape(row.module),
    csvEscape(row.status),
    csvEscape(row.actor?.email ?? ''),
    csvEscape(row.actor?.name ?? ''),
    csvEscape(row.target),
    csvEscape(row.ipAddress),
    csvEscape(row.userAgent),
    csvEscape(row.device),
    csvEscape(row.requestId),
    csvEscape(row.metadata)
  ].join(',');
}

export default app;
