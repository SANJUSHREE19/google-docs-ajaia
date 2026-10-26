<script lang="ts">
  import { onDestroy } from 'svelte';
  import { enhance } from '$app/forms';
  import Tiptap from '$lib/Tiptap.svelte';
  import { triggerHaptic } from '$lib/haptics';
  import type { PageProps } from './$types';
  import type { JSONContent } from '@tiptap/core';

  let { data }: PageProps = $props();

  // -- Title rename state --
  let title = $state(data.document.title);
  let titleSaving = $state(false);
  let inputEl: HTMLInputElement | undefined;

  function maybeSubmitTitle(form: HTMLFormElement | null) {
    if (!form) return;
    const trimmed = title.trim();
    if (trimmed === data.document.title) return;
    if (trimmed.length === 0) {
      title = data.document.title;
      return;
    }
    titleSaving = true;
    triggerHaptic('tap');
    form.requestSubmit();
  }

  // -- Content autosave state --
  type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  let contentStatus = $state<SaveStatus>('idle');
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingContent: JSONContent | null = null;

  const SAVE_DEBOUNCE_MS = 800;

  function onContentChange(content: JSONContent) {
    pendingContent = content;
    contentStatus = 'pending';
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveContent, SAVE_DEBOUNCE_MS);
  }

  async function saveContent() {
    if (!pendingContent) return;
    const content = pendingContent;
    pendingContent = null;
    contentStatus = 'saving';
    try {
      const res = await fetch(`/docs/${data.document.id}/save`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error((await res.text()) || `save failed (${res.status})`);
      contentStatus = 'saved';
      triggerHaptic('success');
      setTimeout(() => {
        if (contentStatus === 'saved') contentStatus = 'idle';
      }, 2500);
    } catch (e) {
      console.error('[save] content save failed:', e);
      contentStatus = 'error';
      triggerHaptic('delete');
      pendingContent = content; // keep for next change/retry
    }
  }

  onDestroy(() => {
    if (saveTimer) clearTimeout(saveTimer);
    if (pendingContent) {
      const content = pendingContent;
      pendingContent = null;
      void fetch(`/docs/${data.document.id}/save`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
        keepalive: true
      }).catch(() => {});
    }
  });

  // -- Share panel --
  let shareOpen = $state(false);
  let shareUserId = $state('');

  function toggleShare() {
    triggerHaptic('toggle');
    shareOpen = !shareOpen;
  }
</script>

<a href="/" class="back" onclick={() => triggerHaptic('tap')}>← Back to documents</a>

<div class="title-row">
  {#if data.access === 'owner'}
    <form
      method="POST"
      action="?/rename"
      use:enhance={() =>
        async ({ result, update }) => {
          await update({ reset: false });
          titleSaving = false;
          if (result.type === 'success') {
            title = data.document.title;
            triggerHaptic('light');
          } else if (result.type === 'failure') {
            const msg = (result.data as { message?: string } | undefined)?.message ?? 'rename failed';
            alert(msg);
            title = data.document.title;
          }
        }}
    >
      <input
        bind:this={inputEl}
        name="title"
        bind:value={title}
        class="title-input"
        maxlength="200"
        aria-label="Document title"
        onblur={(e) => maybeSubmitTitle(e.currentTarget.form)}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            inputEl?.blur();
          } else if (e.key === 'Escape') {
            title = data.document.title;
            inputEl?.blur();
          }
        }}
      />
    </form>
  {:else}
    <h2 class="title-readonly">{data.document.title}</h2>
  {/if}

  <div class="status-container" aria-live="polite">
    {#if titleSaving || contentStatus === 'saving'}
      <span class="status-pill saving">
        <span class="spinner"></span> Saving…
      </span>
    {:else if contentStatus === 'pending'}
      <span class="status-pill pending">
        <span class="dot pulse"></span> Unsaved
      </span>
    {:else if contentStatus === 'saved'}
      <span class="status-pill saved">
        ✓ Saved
      </span>
    {:else if contentStatus === 'error'}
      <span class="status-pill error">
        ⚠ Save failed
      </span>
    {/if}
  </div>
</div>

<p class="meta">
  {#if data.access === 'owner'}
    <span>You own this · Last edited {new Date(data.document.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  {:else}
    <span>Shared by <strong>{data.owner?.display_name ?? 'Unknown'}</strong> · Last edited {new Date(data.document.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  {/if}
  {#if data.access === 'owner'}
    <button class="share-trigger" class:active={shareOpen} onclick={toggleShare}>
      👥 {shareOpen ? 'Close Share' : `Share${data.collaborators.length > 0 ? ` (${data.collaborators.length})` : ''}`}
    </button>
  {/if}
</p>

{#if data.access === 'owner' && shareOpen}
  <section class="share-panel">
    <div class="share-header">
      <h3>👥 Document Collaborators</h3>
      <button class="close-btn" onclick={toggleShare} aria-label="Close">✕</button>
    </div>

    {#if data.availableUsers.length > 0}
      <form
        method="POST"
        action="?/share"
        class="grant-form"
        use:enhance={() =>
          async ({ result, update }) => {
            await update();
            if (result.type === 'success') {
              shareUserId = '';
              triggerHaptic('success');
            }
          }}
      >
        <select name="userId" bind:value={shareUserId} required>
          <option value="" disabled>Select team member to invite…</option>
          {#each data.availableUsers as u (u.id)}
            <option value={u.id}>{u.display_name} ({u.email})</option>
          {/each}
        </select>
        <button type="submit" class="primary" disabled={!shareUserId}>Grant Editor</button>
      </form>
    {:else}
      <p class="muted">All team members currently have access.</p>
    {/if}

    {#if data.collaborators.length > 0}
      <ul class="collab-list">
        {#each data.collaborators as c (c.user_id)}
          <li>
            <div class="collab-info">
              <span class="collab-name">{c.user.display_name}</span>
              <span class="collab-email">{c.user.email}</span>
              <span class="role-badge">{c.role}</span>
            </div>
            <form
              method="POST"
              action="?/unshare"
              use:enhance={() =>
                async ({ result, update }) => {
                  await update();
                  if (result.type === 'success') {
                    triggerHaptic('delete');
                  }
                }}
            >
              <input type="hidden" name="userId" value={c.user_id} />
              <button type="submit" class="remove-btn">Remove</button>
            </form>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted empty-collab">Not shared with anyone yet.</p>
    {/if}
  </section>
{/if}

<Tiptap content={data.document.content} {onContentChange} />

<style>
  .back {
    display: inline-flex;
    align-items: center;
    color: #64748b;
    text-decoration: none;
    font-size: 0.88em;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.15s ease;
  }
  .back:hover {
    background: #f1f5f9;
    color: #0f172a;
    transform: translateX(-2px);
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 0.75rem 0 0.25rem -8px;
  }
  .title-row form { flex: 1; min-width: 0; }
  .title-input {
    font-size: 1.6em;
    font-weight: 700;
    border: 1px solid transparent;
    background: transparent;
    padding: 4px 8px;
    border-radius: 6px;
    width: 100%;
    font-family: inherit;
    color: #0f172a;
    transition: all 0.2s ease;
  }
  .title-input:hover { background: #f8fafc; }
  .title-input:focus {
    background: #ffffff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    outline: none;
  }
  .title-readonly {
    font-size: 1.6em;
    font-weight: 700;
    margin: 0 0 0 8px;
    flex: 1;
    color: #0f172a;
  }

  .status-container {
    min-width: 110px;
    display: flex;
    justify-content: flex-end;
  }
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.8em;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  .status-pill.saving {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }
  .status-pill.pending {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }
  .status-pill.saved {
    background: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }
  .status-pill.error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .spinner {
    width: 10px;
    height: 10px;
    border: 2px solid #bfdbfe;
    border-top-color: #1d4ed8;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .dot {
    width: 6px;
    height: 6px;
    background: currentColor;
    border-radius: 50%;
  }
  .dot.pulse {
    animation: pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }

  .meta {
    color: #64748b;
    font-size: 0.88em;
    margin: 0 8px 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .share-trigger {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    color: #2563eb;
    font-size: 0.88em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .share-trigger:hover {
    background: #eff6ff;
    border-color: #93c5fd;
    transform: translateY(-1px);
  }
  .share-trigger:active {
    transform: scale(0.95);
  }
  .share-trigger.active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
  }

  .share-panel {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.2rem;
    margin-bottom: 1.2rem;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .share-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .share-header h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: #0f172a;
  }
  .close-btn {
    border: none;
    background: transparent;
    color: #94a3b8;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.15s ease;
  }
  .close-btn:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  .grant-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.2rem;
  }
  .grant-form select {
    flex: 1;
    padding: 7px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font: inherit;
    background: #ffffff;
    outline: none;
    transition: border-color 0.15s;
  }
  .grant-form select:focus {
    border-color: #3b82f6;
  }
  .grant-form button.primary {
    padding: 7px 14px;
    background: #2563eb;
    color: white;
    border: 1px solid #2563eb;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .grant-form button.primary:hover:not(:disabled) {
    background: #1d4ed8;
  }
  .grant-form button.primary:active:not(:disabled) {
    transform: scale(0.96);
  }
  .grant-form button.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .collab-list {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid #f1f5f9;
    border-radius: 6px;
    overflow: hidden;
  }
  .collab-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 12px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafafa;
    transition: background 0.15s;
  }
  .collab-list li:last-child {
    border-bottom: none;
  }
  .collab-list li:hover {
    background: #f1f5f9;
  }

  .collab-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .collab-name {
    font-weight: 600;
    color: #1e293b;
    font-size: 0.9em;
  }
  .collab-email {
    color: #64748b;
    font-size: 0.85em;
  }
  .role-badge {
    background: #e0f2fe;
    color: #0369a1;
    font-size: 0.72em;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .remove-btn {
    border: 1px solid #fecaca;
    background: #ffffff;
    color: #dc2626;
    font-size: 0.8em;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .remove-btn:hover {
    background: #fee2e2;
  }
  .remove-btn:active {
    transform: scale(0.94);
  }

  .muted { color: #94a3b8; font-size: 0.88em; }
  .empty-collab { padding: 8px 0; }
</style>
