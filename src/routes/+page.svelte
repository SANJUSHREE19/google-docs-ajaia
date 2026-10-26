<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { parseFile, SUPPORTED_EXTENSIONS, SUPPORTED_LABEL } from '$lib/upload';
  import { triggerHaptic } from '$lib/haptics';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let searchQuery = $state('');
  let editingId = $state<string | null>(null);
  let editTitle = $state('');

  // Upload state
  let uploading = $state(false);
  let uploadError = $state<string | null>(null);
  let isDragging = $state(false);
  let fileInput: HTMLInputElement;

  function startEdit(id: string, title: string) {
    triggerHaptic('toggle');
    editingId = id;
    editTitle = title;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function ownerName(ownerId: string): string {
    return data.allUsers.find((u) => u.id === ownerId)?.display_name ?? 'Unknown';
  }

  async function processFile(file: File) {
    uploading = true;
    uploadError = null;
    triggerHaptic('pop');
    try {
      const { title, content } = await parseFile(file);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      if (!res.ok) {
        throw new Error((await res.text()) || `import failed (${res.status})`);
      }
      triggerHaptic('success');
      const { id } = await res.json();
      await goto(`/docs/${id}`);
    } catch (err) {
      triggerHaptic('delete');
      uploadError = (err as Error).message;
    } finally {
      uploading = false;
      if (fileInput) fileInput.value = '';
    }
  }

  async function handleUpload(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!isDragging) isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await processFile(file);
    }
  }

  // Filtered documents
  let filteredOwned = $derived(
    data.ownedDocuments.filter((doc) =>
      doc.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
  );

  let filteredShared = $derived(
    data.sharedDocuments.filter((doc) =>
      doc.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
  );
</script>

<div
  class="dashboard-container"
  class:drag-active={isDragging}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  role="region"
  aria-label="Document Dashboard"
>
  {#if isDragging}
    <div class="drop-overlay">
      <div class="drop-box">
        <span class="drop-icon">📁</span>
        <h3>Drop file to import</h3>
        <p>Supports .txt, .md, .docx</p>
      </div>
    </div>
  {/if}

  <div class="page-header">
    <div>
      <h2 class="page-title">Your documents</h2>
      <p class="subtitle">Create, edit, and collaborate in real-time</p>
    </div>

    <div class="header-actions">
      <button
        type="button"
        class="upload-btn"
        disabled={uploading}
        onclick={() => {
          triggerHaptic('tap');
          fileInput?.click();
        }}
      >
        <input
          bind:this={fileInput}
          type="file"
          accept={SUPPORTED_EXTENSIONS.join(',')}
          onchange={handleUpload}
          disabled={uploading}
          hidden
        />
        <span class="upload-icon">↑</span>
        {uploading ? 'Importing…' : 'Upload File'}
      </button>

      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          triggerHaptic('pop');
        }}
      >
        <button type="submit" class="primary new-doc-btn">+ New Document</button>
      </form>
    </div>
  </div>

  <div class="search-bar-row">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        type="search"
        placeholder="Filter documents by title…"
        bind:value={searchQuery}
        class="search-input"
        oninput={() => triggerHaptic('light')}
      />
      {#if searchQuery}
        <button class="clear-search" onclick={() => { searchQuery = ''; triggerHaptic('tap'); }}>✕</button>
      {/if}
    </div>
  </div>

  {#if uploadError}
    <div class="toast error" role="alert">
      <span><strong>Import failed:</strong> {uploadError}</span>
      <button class="close-toast" onclick={() => { uploadError = null; triggerHaptic('tap'); }} aria-label="Dismiss">✕</button>
    </div>
  {/if}

  {#if !data.currentUser}
    <p class="empty">Sign-in unavailable — local store not ready.</p>
  {:else if data.ownedDocuments.length === 0}
    <div class="empty-state">
      <span class="empty-icon">📄</span>
      <h3>No documents yet</h3>
      <p>Click <strong>+ New Document</strong> or drop a <strong>.docx, .md, .txt</strong> file to get started.</p>
    </div>
  {:else if filteredOwned.length === 0}
    <p class="empty">No documents match "{searchQuery}".</p>
  {:else}
    <ul class="docs">
      {#each filteredOwned as doc (doc.id)}
        <li class="doc-card">
          {#if editingId === doc.id}
            <form
              method="POST"
              action="?/rename"
              class="rename-form"
              use:enhance={() =>
                async ({ result, update }) => {
                  await update();
                  if (result.type === 'success') {
                    editingId = null;
                    triggerHaptic('success');
                  }
                }}
            >
              <input type="hidden" name="id" value={doc.id} />
              <!-- svelte-ignore a11y_autofocus -->
              <input name="title" bind:value={editTitle} maxlength="200" autofocus class="rename-input" />
              <button type="submit" class="save-btn" onclick={() => triggerHaptic('tap')}>Save</button>
              <button type="button" class="cancel-btn" onclick={() => { editingId = null; triggerHaptic('tap'); }}>Cancel</button>
            </form>
          {:else}
            <div class="doc-main">
              <span class="doc-glyph">📄</span>
              <div class="doc-details">
                <a href="/docs/{doc.id}" class="title" onclick={() => triggerHaptic('tap')}>{doc.title}</a>
                <span class="meta">Edited {formatDate(doc.updated_at)}</span>
              </div>
            </div>

            <div class="actions">
              <button class="action-btn rename" onclick={() => startEdit(doc.id, doc.title)}>Rename</button>
              <form
                method="POST"
                action="?/delete"
                use:enhance={() => {
                  triggerHaptic('delete');
                }}
              >
                <input type="hidden" name="id" value={doc.id} />
                <button
                  type="submit"
                  class="action-btn danger"
                  onclick={(e) => {
                    if (!confirm(`Delete "${doc.title}"?`)) e.preventDefault();
                  }}>Delete</button>
              </form>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if data.currentUser && filteredShared.length > 0}
    <div class="section-divider">
      <h3 class="section-h">Shared with you</h3>
      <span class="count-pill">{filteredShared.length}</span>
    </div>

    <ul class="docs">
      {#each filteredShared as doc (doc.id)}
        <li class="doc-card shared">
          <div class="doc-main">
            <span class="doc-glyph shared-glyph">👥</span>
            <div class="doc-details">
              <a href="/docs/{doc.id}" class="title" onclick={() => triggerHaptic('tap')}>{doc.title}</a>
              <span class="meta">Owner: <strong>{ownerName(doc.owner_id)}</strong> · Edited {formatDate(doc.updated_at)}</span>
            </div>
          </div>
          <span class="badge">Collaborator</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .dashboard-container {
    position: relative;
    min-height: 400px;
    transition: all 0.2s ease;
  }
  .drag-active {
    outline: 2px dashed #3b82f6;
    outline-offset: 8px;
    border-radius: 8px;
  }

  .drop-overlay {
    position: absolute;
    inset: 0;
    background: rgba(239, 246, 255, 0.9);
    border: 2px dashed #2563eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    backdrop-filter: blur(2px);
  }
  .drop-box {
    text-align: center;
    color: #1e40af;
  }
  .drop-icon { font-size: 3rem; }
  .drop-box h3 { margin: 0.5rem 0 0.2rem; font-size: 1.3rem; }
  .drop-box p { margin: 0; font-size: 0.9em; opacity: 0.8; }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.25rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .page-title {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 700;
    color: #0f172a;
  }
  .subtitle {
    margin: 0.2rem 0 0;
    color: #64748b;
    font-size: 0.9em;
  }
  .header-actions { display: flex; gap: 0.6rem; align-items: center; }

  .upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    border-radius: 6px;
    cursor: pointer;
    font: inherit;
    font-size: 0.9em;
    font-weight: 500;
    color: #334155;
    user-select: none;
    transition: all 0.15s ease;
  }
  .upload-btn:hover {
    background: #f8fafc;
    border-color: #94a3b8;
    transform: translateY(-1px);
  }
  .upload-btn:active {
    transform: scale(0.96);
  }
  .upload-btn.disabled { opacity: 0.6; cursor: progress; }
  .upload-icon { font-weight: bold; }

  .primary.new-doc-btn {
    padding: 7px 14px;
    background: #0f172a;
    color: white;
    border: 1px solid #0f172a;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .primary.new-doc-btn:hover {
    background: #1e293b;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  .primary.new-doc-btn:active {
    transform: scale(0.96);
  }

  .search-bar-row {
    margin-bottom: 1.25rem;
  }
  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    transition: all 0.15s ease;
  }
  .search-box:focus-within {
    background: #ffffff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  .search-icon { font-size: 0.9em; color: #94a3b8; }
  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font: inherit;
    font-size: 0.92em;
    color: #1e293b;
  }
  .clear-search {
    border: none;
    background: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 0.9em;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .clear-search:hover { color: #0f172a; background: #e2e8f0; }

  .toast {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    animation: fadeIn 0.2s ease;
  }
  .toast.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .close-toast {
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
    font-size: 1rem;
  }

  .empty-state {
    padding: 3rem 1.5rem;
    text-align: center;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
  }
  .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
  .empty-state h3 { margin: 0 0 0.25rem; color: #1e293b; font-size: 1.15rem; }
  .empty-state p { margin: 0; color: #64748b; font-size: 0.9em; }

  .empty {
    padding: 2rem;
    text-align: center;
    color: #64748b;
    border: 1px dashed #e2e8f0;
    border-radius: 6px;
  }

  ul.docs {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .doc-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 1.1rem;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    border-radius: 8px;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .doc-card:hover {
    border-color: #cbd5e1;
    background: #fafafa;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  }
  .doc-card.shared {
    background: #f8fafc;
  }

  .doc-main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }
  .doc-glyph {
    font-size: 1.4rem;
    line-height: 1;
  }
  .doc-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .title {
    font-weight: 600;
    color: #0f172a;
    text-decoration: none;
    font-size: 0.98rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.15s;
  }
  .title:hover {
    color: #2563eb;
  }
  .meta {
    color: #64748b;
    font-size: 0.82em;
  }

  .actions {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .action-btn {
    padding: 5px 10px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    border-radius: 5px;
    cursor: pointer;
    font: inherit;
    font-size: 0.84em;
    font-weight: 500;
    color: #475569;
    transition: all 0.15s ease;
  }
  .action-btn:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }
  .action-btn:active {
    transform: scale(0.94);
  }
  .action-btn.danger {
    color: #b91c1c;
    border-color: #fecaca;
  }
  .action-btn.danger:hover {
    background: #fef2f2;
    border-color: #ef4444;
  }

  .badge {
    background: #e0f2fe;
    color: #0369a1;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 0.78em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .rename-form {
    display: flex;
    gap: 6px;
    flex: 1;
    align-items: center;
  }
  .rename-input {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid #3b82f6;
    border-radius: 5px;
    font: inherit;
    font-size: 0.95em;
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }
  .save-btn {
    padding: 6px 12px;
    background: #0f172a;
    color: white;
    border: 1px solid #0f172a;
    border-radius: 5px;
    font-weight: 500;
    cursor: pointer;
  }
  .cancel-btn {
    padding: 6px 10px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    cursor: pointer;
  }

  .section-divider {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 2.2rem 0 0.8rem;
  }
  .section-h {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
  }
  .count-pill {
    background: #e2e8f0;
    color: #475569;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 1px 7px;
    border-radius: 999px;
  }
</style>
