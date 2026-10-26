import { fail, type ActionFailure } from '@sveltejs/kit';
import * as docs from '$lib/server/db/documents';
import { requireOwner } from '$lib/server/policy';

const TITLE_MAX = 200;

type ActionResult<T extends Record<string, unknown> = Record<string, never>> =
  | (T & { success: true })
  | ActionFailure<{ message: string }>;

/**
 * Validate title + check owner + persist rename. Used by both the home list
 * and the doc-view inline title input — same logic, two entry points.
 */
export async function renameDocAction(
  id: string,
  rawTitle: FormDataEntryValue | null,
  userId: string
): Promise<ActionResult> {
  if (typeof rawTitle !== 'string') return fail(400, { message: 'title required' });
  const title = rawTitle.trim();
  if (title.length === 0 || title.length > TITLE_MAX) {
    return fail(400, { message: `title must be 1–${TITLE_MAX} characters` });
  }

  await requireOwner(id, userId);
  await docs.rename(id, title, userId);
  return { success: true };
}

export async function deleteDocAction(id: string, userId: string): Promise<ActionResult> {
  await requireOwner(id, userId);
  await docs.deleteById(id);
  return { success: true };
}
