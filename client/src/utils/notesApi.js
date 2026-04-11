/**
 * notesApi – thin wrapper around Supabase for note state persistence.
 *
 * Row Level Security on public.note_states guarantees that every query
 * is automatically scoped to the currently authenticated user; no user_id
 * filter is needed in the queries themselves (Supabase adds it via RLS).
 */
import { supabase } from '../lib/supabase';

// ── User cache ─────────────────────────────────────────────────────────────
// saveState is called on every debounced auto-save. Calling supabase.auth.getUser()
// on each save adds an unnecessary async round-trip (or at least a promise
// overhead). We cache the resolved user and invalidate on auth state changes.
let _cachedUser = null;

supabase.auth.onAuthStateChange((event, session) => {
  _cachedUser = session?.user ?? null;
});

async function getAuthUser() {
  if (_cachedUser) return _cachedUser;
  const { data: { user } } = await supabase.auth.getUser();
  _cachedUser = user;
  return user;
}

export const notesApi = {
  /**
   * Load the current user's note state.
   * Returns { files, folders, root, activeFileId } or a default empty state.
   */
  getState: async () => {
    const { data, error } = await supabase
      .from('note_states')
      .select('files, folders, root, active_file_id')
      .maybeSingle(); // returns null (not an error) if no row exists yet

    if (error) throw new Error(error.message);

    if (!data) {
      return { files: {}, folders: {}, root: [], activeFileId: null };
    }

    return {
      files:        data.files        ?? {},
      folders:      data.folders      ?? {},
      root:         data.root         ?? [],
      activeFileId: data.active_file_id ?? null,
    };
  },

  /**
   * Upsert the current user's note state.
   * Supabase's upsert uses the unique constraint on user_id.
   */
  saveState: async ({ files, folders, root, activeFileId }) => {
    const user = await getAuthUser();
    if (!user) throw new Error('Not authenticated.');

    const { error } = await supabase
      .from('note_states')
      .upsert(
        {
          user_id:        user.id,
          files:          files   ?? {},
          folders:        folders ?? {},
          root:           root    ?? [],
          active_file_id: activeFileId ?? null,
        },
        { onConflict: 'user_id' }
      );

    if (error) throw new Error(error.message);
    return { message: 'Saved' };
  },
};

export const notesApi = {
  /**
   * Load the current user's note state.
   * Returns { files, folders, root, activeFileId } or a default empty state.
   */
  getState: async () => {
    const { data, error } = await supabase
      .from('note_states')
      .select('files, folders, root, active_file_id')
      .maybeSingle(); // returns null (not an error) if no row exists yet

    if (error) throw new Error(error.message);

    if (!data) {
      return { files: {}, folders: {}, root: [], activeFileId: null };
    }

    return {
      files:        data.files        ?? {},
      folders:      data.folders      ?? {},
      root:         data.root         ?? [],
      activeFileId: data.active_file_id ?? null,
    };
  },

  /**
   * Upsert the current user's note state.
   * Supabase's upsert uses the unique constraint on user_id.
   */
  saveState: async ({ files, folders, root, activeFileId }) => {
    // auth.uid() is injected server-side by RLS; we still send user_id
    // so the insert's with-check policy can match it.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    const { error } = await supabase
      .from('note_states')
      .upsert(
        {
          user_id:        user.id,
          files:          files   ?? {},
          folders:        folders ?? {},
          root:           root    ?? [],
          active_file_id: activeFileId ?? null,
        },
        { onConflict: 'user_id' }
      );

    if (error) throw new Error(error.message);
    return { message: 'Saved' };
  },
};
