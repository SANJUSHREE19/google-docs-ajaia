<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import type { JSONContent } from '@tiptap/core';
  import { editorExtensions } from '$lib/editorExtensions';
  import { triggerHaptic } from '$lib/haptics';

  let {
    content,
    onContentChange
  }: {
    content: JSONContent;
    onContentChange?: (content: JSONContent) => void;
  } = $props();

  let element: HTMLElement;
  let editorState = $state<{ editor: Editor | null }>({ editor: null });
  let stats = $state({ words: 0, chars: 0 });

  function updateStats(editor: Editor) {
    const text = editor.state.doc.textContent;
    stats.chars = text.length;
    stats.words = text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  function act(fn: () => void, type: 'tap' | 'toggle' | 'pop' | 'delete' = 'tap') {
    triggerHaptic(type);
    fn();
  }

  onMount(() => {
    editorState.editor = new Editor({
      element,
      extensions: editorExtensions,
      content,
      onUpdate: ({ editor }) => {
        onContentChange?.(editor.getJSON());
        updateStats(editor);
      },
      onTransaction: ({ editor }) => {
        editorState = { editor };
        updateStats(editor);
      }
    });
    if (editorState.editor) {
      updateStats(editorState.editor);
    }
  });

  onDestroy(() => editorState.editor?.destroy());

  function setLink(editor: Editor) {
    triggerHaptic('pop');
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function insertTable(editor: Editor) {
    triggerHaptic('pop');
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  function insertImage(editor: Editor) {
    triggerHaptic('pop');
    const url = window.prompt('Image URL', 'https://');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }
</script>

<div class="editor-container">
  {#if editorState.editor}
    {@const e = editorState.editor}
    <div class="toolbar">
      <div class="btn-group">
        <button
          onclick={() => act(() => e.chain().focus().toggleBold().run(), 'toggle')}
          class:active={e.isActive('bold')}
          title="Bold (⌘B)"
          aria-label="Bold"
        ><b>B</b></button>
        <button
          onclick={() => act(() => e.chain().focus().toggleItalic().run(), 'toggle')}
          class:active={e.isActive('italic')}
          title="Italic (⌘I)"
          aria-label="Italic"
        ><i>I</i></button>
        <button
          onclick={() => act(() => e.chain().focus().toggleUnderline().run(), 'toggle')}
          class:active={e.isActive('underline')}
          title="Underline (⌘U)"
          aria-label="Underline"
        ><u>U</u></button>
        <button
          onclick={() => act(() => e.chain().focus().toggleStrike().run(), 'toggle')}
          class:active={e.isActive('strike')}
          title="Strikethrough"
          aria-label="Strike"
        ><s>S</s></button>
      </div>

      <span class="sep"></span>

      <div class="btn-group">
        <button
          onclick={() => act(() => e.chain().focus().toggleHeading({ level: 1 }).run(), 'pop')}
          class:active={e.isActive('heading', { level: 1 })}
          title="Heading 1"
        >H1</button>
        <button
          onclick={() => act(() => e.chain().focus().toggleHeading({ level: 2 }).run(), 'pop')}
          class:active={e.isActive('heading', { level: 2 })}
          title="Heading 2"
        >H2</button>
      </div>

      <span class="sep"></span>

      <div class="btn-group">
        <button
          onclick={() => act(() => e.chain().focus().toggleBulletList().run(), 'toggle')}
          class:active={e.isActive('bulletList')}
          title="Bulleted List"
        >• List</button>
        <button
          onclick={() => act(() => e.chain().focus().toggleOrderedList().run(), 'toggle')}
          class:active={e.isActive('orderedList')}
          title="Numbered List"
        >1. List</button>
      </div>

      <span class="sep"></span>

      <div class="btn-group">
        <button
          onclick={() => act(() => e.chain().focus().setTextAlign('left').run(), 'tap')}
          class:active={e.isActive({ textAlign: 'left' })}
          title="Align Left"
          aria-label="Align left"
        >⟸</button>
        <button
          onclick={() => act(() => e.chain().focus().setTextAlign('center').run(), 'tap')}
          class:active={e.isActive({ textAlign: 'center' })}
          title="Align Center"
          aria-label="Align center"
        >⇔</button>
        <button
          onclick={() => act(() => e.chain().focus().setTextAlign('right').run(), 'tap')}
          class:active={e.isActive({ textAlign: 'right' })}
          title="Align Right"
          aria-label="Align right"
        >⟹</button>
      </div>

      <span class="sep"></span>

      <div class="btn-group">
        <button
          onclick={() => setLink(e)}
          class:active={e.isActive('link')}
          title="Insert Link"
        >🔗 Link</button>
        <button
          onclick={() => insertImage(e)}
          title="Insert Image"
        >🖼 Image</button>
        <button
          onclick={() => insertTable(e)}
          title="Insert Table (3x3)"
        >📊 Table</button>
      </div>

      {#if e.isActive('table')}
        <span class="sep"></span>
        <div class="btn-group table-ops">
          <span class="ctx-label">Table:</span>
          <button onclick={() => act(() => e.chain().focus().addColumnAfter().run(), 'tap')} title="Add Column Right">+ Col</button>
          <button onclick={() => act(() => e.chain().focus().addRowAfter().run(), 'tap')} title="Add Row Below">+ Row</button>
          <button onclick={() => act(() => e.chain().focus().deleteColumn().run(), 'delete')} title="Delete Column">− Col</button>
          <button onclick={() => act(() => e.chain().focus().deleteRow().run(), 'delete')} title="Delete Row">− Row</button>
          <button onclick={() => act(() => e.chain().focus().deleteTable().run(), 'delete')} class="ctx-danger" title="Delete Entire Table">Delete table</button>
        </div>
      {/if}
    </div>
  {/if}

  <div bind:this={element} class="editor"></div>

  <div class="editor-footer">
    <div class="stats-group">
      <span class="stat-badge">{stats.words} {stats.words === 1 ? 'word' : 'words'}</span>
      <span class="stat-dot">·</span>
      <span class="stat-badge">{stats.chars} chars</span>
    </div>
    <span class="reading-time">⏱ ~{Math.max(1, Math.ceil(stats.words / 200))} min read</span>
  </div>
</div>

<style>
  .editor-container {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .editor-container:focus-within {
    border-color: #94a3b8;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 8px 8px 0 0;
    align-items: center;
  }
  .btn-group {
    display: inline-flex;
    gap: 3px;
    align-items: center;
  }
  .toolbar button {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
    font: inherit;
    font-size: 0.88em;
    min-width: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
  }
  .toolbar button:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
    transform: translateY(-1px);
  }
  .toolbar button:active {
    transform: scale(0.93);
    background: #e2e8f0;
  }
  .toolbar button.active {
    background: #1e293b;
    color: white;
    border-color: #1e293b;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  .toolbar button.ctx-danger {
    color: #b91c1c;
    border-color: #fca5a5;
  }
  .toolbar button.ctx-danger:hover {
    background: #fef2f2;
    border-color: #ef4444;
  }
  .ctx-label {
    color: #64748b;
    font-size: 0.82em;
    font-weight: 600;
    margin-right: 2px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .sep {
    width: 1px;
    height: 18px;
    background: #cbd5e1;
    margin: 0 4px;
  }

  .editor :global(.tiptap) {
    min-height: 420px;
    padding: 24px;
    outline: none;
    line-height: 1.65;
    font-size: 1.05rem;
    color: #1e293b;
  }
  .editor :global(.tiptap p) { margin: 0 0 0.85em; }
  .editor :global(.tiptap p:last-child) { margin-bottom: 0; }
  .editor :global(.tiptap h1) { font-size: 1.8em; margin: 1.2em 0 0.5em; line-height: 1.3; font-weight: 700; color: #0f172a; }
  .editor :global(.tiptap h2) { font-size: 1.4em; margin: 1em 0 0.4em; line-height: 1.3; font-weight: 600; color: #1e293b; }
  .editor :global(.tiptap h3) { font-size: 1.2em; margin: 1em 0 0.3em; line-height: 1.3; font-weight: 600; color: #334155; }
  .editor :global(.tiptap ul) { padding-left: 1.5em; margin: 0.5em 0 0.85em; }
  .editor :global(.tiptap ol) { padding-left: 1.5em; margin: 0.5em 0 0.85em; }
  .editor :global(.tiptap li) { margin: 0.25em 0; }
  .editor :global(.tiptap li > p) { margin: 0; }
  .editor :global(.tiptap blockquote) {
    margin: 1.2em 0;
    padding: 0.6em 1.2em;
    border-left: 4px solid #3b82f6;
    background: #f8fafc;
    border-radius: 0 6px 6px 0;
    color: #475569;
    font-style: italic;
  }
  .editor :global(.tiptap pre) {
    background: #1e293b;
    color: #f8fafc;
    border-radius: 6px;
    padding: 1em 1.25em;
    margin: 1em 0;
    font-family: ui-monospace, Menlo, Monaco, monospace;
    font-size: 0.9em;
    overflow-x: auto;
  }
  .editor :global(.tiptap code) {
    background: #f1f5f9;
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 0.88em;
  }
  .editor :global(.tiptap pre code) { background: none; color: inherit; padding: 0; font-size: inherit; }
  .editor :global(.tiptap a) { color: #2563eb; text-decoration: underline; cursor: pointer; transition: color 0.15s; }
  .editor :global(.tiptap a:hover) { color: #1d4ed8; }
  .editor :global(.tiptap img) {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 0.75em 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  .editor :global(.tiptap hr) {
    margin: 1.8em 0;
    border: 0;
    border-top: 1px solid #e2e8f0;
  }

  /* Tables */
  .editor :global(.tiptap table) {
    border-collapse: collapse;
    margin: 1.2em 0;
    width: 100%;
    table-layout: fixed;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  .editor :global(.tiptap table td),
  .editor :global(.tiptap table th) {
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    vertical-align: top;
    min-width: 60px;
  }
  .editor :global(.tiptap table th) {
    background: #f1f5f9;
    font-weight: 600;
    text-align: left;
    color: #334155;
  }
  .editor :global(.tiptap .selectedCell) {
    background: rgba(59, 130, 246, 0.15);
  }

  /* Footer */
  .editor-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    border-radius: 0 0 8px 8px;
    font-size: 0.82em;
    color: #64748b;
  }
  .stats-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .stat-badge {
    font-weight: 500;
  }
  .stat-dot {
    opacity: 0.5;
  }
  .reading-time {
    font-weight: 500;
  }
</style>
