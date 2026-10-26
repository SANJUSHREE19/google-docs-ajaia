import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import * as docs from '$lib/server/db/documents';
import { renameDocAction, deleteDocAction } from '$lib/server/actions/documents';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) return { ownedDocuments: [], sharedDocuments: [] };
  const [ownedDocuments, sharedDocuments] = await Promise.all([
    docs.listOwnedByUser(locals.user.id),
    docs.listSharedWithUser(locals.user.id)
  ]);
  return { ownedDocuments, sharedDocuments };
};

export const actions: Actions = {
  create: async ({ locals }) => {
    if (!locals.user) throw error(401, 'not signed in');
    const doc = await docs.create(locals.user.id);
    throw redirect(303, `/docs/${doc.id}`);
  },

  rename: async ({ locals, request }) => {
    if (!locals.user) throw error(401, 'not signed in');
    const form = await request.formData();
    const id = form.get('id');
    if (typeof id !== 'string') return fail(400, { message: 'id required' });
    return renameDocAction(id, form.get('title'), locals.user.id);
  },

  delete: async ({ locals, request }) => {
    if (!locals.user) throw error(401, 'not signed in');
    const form = await request.formData();
    const id = form.get('id');
    if (typeof id !== 'string') return fail(400, { message: 'id required' });
    return deleteDocAction(id, locals.user.id);
  }
};
