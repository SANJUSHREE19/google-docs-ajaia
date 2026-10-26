import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import * as perms from '$lib/server/db/permissions';
import { listUsers, getUserById } from '$lib/server/db/users';
import { renameDocAction } from '$lib/server/actions/documents';
import { requireAccess, requireOwner } from '$lib/server/policy';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) throw error(401, 'not signed in');

  const { doc, access } = await requireAccess(params.id, locals.user.id);

  // Owner-only data: collaborators list + dropdown of users to grant.
  let collaborators: perms.PermissionWithUser[] = [];
  let availableUsers: { id: string; display_name: string; email: string }[] = [];

  if (access === 'owner') {
    const [collabs, allUsers] = await Promise.all([
      perms.listForDoc(params.id),
      listUsers()
    ]);
    collaborators = collabs;
    const grantedIds = new Set(collabs.map((c) => c.user_id));
    availableUsers = allUsers.filter((u) => u.id !== doc.owner_id && !grantedIds.has(u.id));
  }

  // Owner display (for non-owners' "Shared by …" tag)
  const owner = await getUserById(doc.owner_id);

  return {
    document: doc,
    access,
    owner,
    collaborators,
    availableUsers
  };
};

export const actions: Actions = {
  rename: async ({ params, locals, request }) => {
    if (!locals.user) throw error(401, 'not signed in');
    const form = await request.formData();
    return renameDocAction(params.id, form.get('title'), locals.user.id);
  },

  share: async ({ params, locals, request }) => {
    if (!locals.user) throw error(401, 'not signed in');
    await requireOwner(params.id, locals.user.id);
    const form = await request.formData();
    const userId = form.get('userId');
    if (typeof userId !== 'string' || userId.length === 0) {
      return fail(400, { message: 'userId required' });
    }
    if (userId === locals.user.id) return fail(400, { message: "can't share with yourself" });
    await perms.grantAccess(params.id, userId);
    return { success: true };
  },

  unshare: async ({ params, locals, request }) => {
    if (!locals.user) throw error(401, 'not signed in');
    await requireOwner(params.id, locals.user.id);
    const form = await request.formData();
    const userId = form.get('userId');
    if (typeof userId !== 'string' || userId.length === 0) {
      return fail(400, { message: 'userId required' });
    }
    await perms.revokeAccess(params.id, userId);
    return { success: true };
  }
};
