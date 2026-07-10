import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as commService from './service.js';
import {
  communicationListParamsSchema, statusUpdateSchema, replySchema,
  noteCreateSchema, tagCreateSchema, tagAssignSchema,
  recordTypeSchema,
} from './validation.js';

const communication = new Hono<AppEnv>();

communication.use('*', requireAuth, requireRole('admin'));

function getUser(c: any): { id: string } {
  const user = c.get('user');
  if (!user) throw new Error('User not found in context');
  return user;
}

// ─── Generic helpers ─────────────────────────────────────────────────────────

function parseListParams(c: any): any {
  const query = c.req.query();
  const parsed = communicationListParamsSchema.safeParse(query);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `INVALID_PARAMS: ${first.path.join('.')}: ${first.message}` };
  }
  return parsed.data;
}

function handleError(c: any, err: any, prefix: string) {
  console.error(`[admin/communication] ${prefix}:`, err);
  return errorResponse(c, 'INTERNAL_ERROR', `Failed to ${prefix}`, 500);
}

// ─── Tags (shared across all types) ──────────────────────────────────────────

communication.get('/tags', async (c) => {
  try {
    const tags = await commService.listTags();
    return c.json(tags);
  } catch (err) {
    return handleError(c, err, 'list tags');
  }
});

communication.post('/tags', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = tagCreateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const tag = await commService.createTag(parsed.data.name, parsed.data.color);
    return c.json(tag, 201 as ContentfulStatusCode);
  } catch (err: any) {
    if (err?.code === '23505') {
      return errorResponse(c, 'CONFLICT', 'Tag already exists', 409);
    }
    return handleError(c, err, 'create tag');
  }
});

communication.put('/tags/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = tagCreateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const tag = await commService.updateTag(id, parsed.data.name, parsed.data.color);
    if (!tag) return errorResponse(c, 'NOT_FOUND', 'Tag not found', 404);
    return c.json(tag);
  } catch (err: any) {
    if (err?.code === '23505') {
      return errorResponse(c, 'CONFLICT', 'Tag name already exists', 409);
    }
    return handleError(c, err, 'update tag');
  }
});

communication.delete('/tags/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const deleted = await commService.deleteTag(id);
    if (!deleted) return errorResponse(c, 'NOT_FOUND', 'Tag not found', 404);
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'delete tag');
  }
});

// ─── Contact Messages ────────────────────────────────────────────────────────

communication.get('/contact', async (c) => {
  try {
    const params = parseListParams(c);
    if (params.error) return errorResponse(c, 'VALIDATION_ERROR', params.error, 400 as ContentfulStatusCode);
    const result = await commService.listContacts(params);
    return c.json(result);
  } catch (err) {
    return handleError(c, err, 'list contacts');
  }
});

communication.get('/contact/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const data = await commService.getContact(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    if (!data) return errorResponse(c, 'NOT_FOUND', 'Contact message not found', 404);
    return c.json(data);
  } catch (err) {
    return handleError(c, err, 'get contact');
  }
});

communication.put('/contact/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = statusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const user = getUser(c);
    await commService.updateContactStatus(id, parsed.data.status, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'update contact status');
  }
});

communication.put('/contact/:id/archive', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    await commService.archiveContact(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'archive contact');
  }
});

communication.put('/contact/:id/restore', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    await commService.restoreContact(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'restore contact');
  }
});

communication.delete('/contact/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const deleted = await commService.deleteContact(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    if (!deleted) return errorResponse(c, 'NOT_FOUND', 'Contact message not found', 404);
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'delete contact');
  }
});

// ─── Feedback ────────────────────────────────────────────────────────────────

communication.get('/feedback', async (c) => {
  try {
    const params = parseListParams(c);
    if (params.error) return errorResponse(c, 'VALIDATION_ERROR', params.error, 400 as ContentfulStatusCode);
    const result = await commService.listFeedback(params);
    return c.json(result);
  } catch (err) {
    return handleError(c, err, 'list feedback');
  }
});

communication.get('/feedback/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const data = await commService.getFeedback(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    if (!data) return errorResponse(c, 'NOT_FOUND', 'Feedback not found', 404);
    return c.json(data);
  } catch (err) {
    return handleError(c, err, 'get feedback');
  }
});

communication.put('/feedback/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = statusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const user = getUser(c);
    await commService.updateFeedbackStatus(id, parsed.data.status, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'update feedback status');
  }
});

communication.put('/feedback/:id/archive', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    await commService.archiveFeedback(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'archive feedback');
  }
});

communication.put('/feedback/:id/restore', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    await commService.restoreFeedback(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'restore feedback');
  }
});

communication.delete('/feedback/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const deleted = await commService.deleteFeedback(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    if (!deleted) return errorResponse(c, 'NOT_FOUND', 'Feedback not found', 404);
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'delete feedback');
  }
});

// ─── Newsletter ──────────────────────────────────────────────────────────────

communication.get('/newsletter', async (c) => {
  try {
    const params = parseListParams(c);
    if (params.error) return errorResponse(c, 'VALIDATION_ERROR', params.error, 400 as ContentfulStatusCode);
    const result = await commService.listNewsletter(params);
    return c.json(result);
  } catch (err) {
    return handleError(c, err, 'list newsletter');
  }
});

communication.get('/newsletter/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const data = await commService.getNewsletter(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    if (!data) return errorResponse(c, 'NOT_FOUND', 'Newsletter subscriber not found', 404);
    return c.json(data);
  } catch (err) {
    return handleError(c, err, 'get newsletter');
  }
});

communication.put('/newsletter/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = statusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const user = getUser(c);
    await commService.updateNewsletterStatus(id, parsed.data.status, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'update newsletter status');
  }
});

communication.delete('/newsletter/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const deleted = await commService.deleteNewsletter(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    if (!deleted) return errorResponse(c, 'NOT_FOUND', 'Newsletter subscriber not found', 404);
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'delete newsletter');
  }
});

// ─── Careers ─────────────────────────────────────────────────────────────────

communication.get('/careers', async (c) => {
  try {
    const params = parseListParams(c);
    if (params.error) return errorResponse(c, 'VALIDATION_ERROR', params.error, 400 as ContentfulStatusCode);
    const result = await commService.listCareers(params);
    return c.json(result);
  } catch (err) {
    return handleError(c, err, 'list careers');
  }
});

communication.get('/careers/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const data = await commService.getCareer(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    if (!data) return errorResponse(c, 'NOT_FOUND', 'Career application not found', 404);
    return c.json(data);
  } catch (err) {
    return handleError(c, err, 'get career');
  }
});

communication.put('/careers/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = statusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const user = getUser(c);
    await commService.updateCareerStatus(id, parsed.data.status, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'update career status');
  }
});

communication.put('/careers/:id/archive', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    await commService.archiveCareer(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'archive career');
  }
});

communication.put('/careers/:id/restore', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    await commService.restoreCareer(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'restore career');
  }
});

communication.delete('/careers/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const deleted = await commService.deleteCareer(id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    if (!deleted) return errorResponse(c, 'NOT_FOUND', 'Career application not found', 404);
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'delete career');
  }
});

// ─── Notes (shared across record types) ──────────────────────────────────────

communication.get('/:recordType/:recordId/notes', async (c) => {
  try {
    const rt = c.req.param('recordType');
    const parsed = recordTypeSchema.safeParse(rt);
    if (!parsed.success) return errorResponse(c, 'VALIDATION_ERROR', 'Invalid record type', 400 as ContentfulStatusCode);
    const notes = await commService.getNotes(parsed.data, c.req.param('recordId'));
    return c.json(notes);
  } catch (err) {
    return handleError(c, err, 'get notes');
  }
});

communication.post('/:recordType/:recordId/notes', async (c) => {
  try {
    const rt = c.req.param('recordType');
    const parsedRt = recordTypeSchema.safeParse(rt);
    if (!parsedRt.success) return errorResponse(c, 'VALIDATION_ERROR', 'Invalid record type', 400 as ContentfulStatusCode);

    const body = await c.req.json();
    const parsed = noteCreateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }

    const user = getUser(c);
    const note = await commService.addNote(parsedRt.data, c.req.param('recordId'), user.id, parsed.data.content,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json(note, 201 as ContentfulStatusCode);
  } catch (err) {
    return handleError(c, err, 'add note');
  }
});

// ─── Tags on Records (shared across record types) ────────────────────────────

communication.get('/:recordType/:recordId/tags', async (c) => {
  try {
    const rt = c.req.param('recordType');
    const parsed = recordTypeSchema.safeParse(rt);
    if (!parsed.success) return errorResponse(c, 'VALIDATION_ERROR', 'Invalid record type', 400 as ContentfulStatusCode);
    const tags = await commService.listTags(); // We'll return all tags; client can filter
    return c.json(tags);
  } catch (err) {
    return handleError(c, err, 'get record tags');
  }
});

communication.post('/:recordType/:recordId/tags', async (c) => {
  try {
    const rt = c.req.param('recordType');
    const parsedRt = recordTypeSchema.safeParse(rt);
    if (!parsedRt.success) return errorResponse(c, 'VALIDATION_ERROR', 'Invalid record type', 400 as ContentfulStatusCode);

    const body = await c.req.json();
    const parsed = tagAssignSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }

    const user = getUser(c);
    await commService.addTagToRecord(parsedRt.data, c.req.param('recordId'), parsed.data.tag_id, user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'add tag');
  }
});

communication.delete('/:recordType/:recordId/tags/:tagId', async (c) => {
  try {
    const rt = c.req.param('recordType');
    const parsedRt = recordTypeSchema.safeParse(rt);
    if (!parsedRt.success) return errorResponse(c, 'VALIDATION_ERROR', 'Invalid record type', 400 as ContentfulStatusCode);

    const user = getUser(c);
    await commService.removeTagFromRecord(parsedRt.data, c.req.param('recordId'), c.req.param('tagId'), user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err) {
    return handleError(c, err, 'remove tag');
  }
});

// ─── Reply (shared) ─────────────────────────────────────────────────────────

communication.post('/:recordType/:recordId/reply', async (c) => {
  try {
    const rt = c.req.param('recordType');
    const parsedRt = recordTypeSchema.safeParse(rt);
    if (!parsedRt.success) return errorResponse(c, 'VALIDATION_ERROR', 'Invalid record type', 400 as ContentfulStatusCode);

    const body = await c.req.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }

    const user = getUser(c);
    const recordId = c.req.param('recordId');
    const { subject, message } = parsed.data;

    const recordType = parsedRt.data;
    if (recordType === 'contact') {
      await commService.replyContact(recordId, subject, message, user.id,
        c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        c.req.header('user-agent'),
      );
    } else if (recordType === 'feedback') {
      await commService.replyFeedback(recordId, subject, message, user.id,
        c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        c.req.header('user-agent'),
      );
    } else {
      return errorResponse(c, 'BAD_REQUEST', 'Reply not supported for this record type', 400 as ContentfulStatusCode);
    }

    return c.json({ success: true });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      return errorResponse(c, 'NOT_FOUND', err.message, 404);
    }
    return handleError(c, err, 'send reply');
  }
});

// ─── Options ─────────────────────────────────────────────────────────────────

communication.get('/options', async (c) => {
  try {
    const options = await commService.getFilterOptions();
    return c.json(options);
  } catch (err) {
    return handleError(c, err, 'load options');
  }
});

export default communication;
