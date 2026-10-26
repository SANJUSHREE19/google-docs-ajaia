<script lang="ts">
  import { onMount } from 'svelte';
  import { isSoundEnabled, toggleSound, triggerHaptic } from '$lib/haptics';

  let { data, children } = $props();
  let soundOn = $state(true);

  onMount(() => {
    soundOn = isSoundEnabled();
  });

  function handleToggleSound() {
    soundOn = toggleSound();
    triggerHaptic('pop');
  }
</script>

<header>
  <div class="brand-group">
    <a href="/" class="brand" onclick={() => triggerHaptic('tap')}>📄 Docs</a>
    {#if data.isLocal}
      <span class="local-pill" title="Running locally with SQLite persistence">Local Mode</span>
    {/if}
  </div>

  <div class="user-area">
    <button
      type="button"
      class="haptic-toggle"
      class:muted={!soundOn}
      onclick={handleToggleSound}
      title={soundOn ? 'Tactile haptics & audio active (Click to mute)' : 'Haptics muted (Click to enable)'}
    >
      <span class="haptic-icon">{soundOn ? '⚡' : '🔕'}</span>
      <span class="haptic-text">{soundOn ? 'Haptics ON' : 'Muted'}</span>
    </button>

    {#if data.dbError}
      <span class="db-warn" title={data.dbError}>⚠ Supabase not configured</span>
    {:else if data.currentUser}
      <span class="who">👤 <strong>{data.currentUser.display_name}</strong></span>
      <form method="POST" action="/auth/logout">
        <button type="submit" class="logout-btn" onclick={() => triggerHaptic('tap')}>Logout</button>
      </form>
    {/if}
  </div>
</header>

<main>
  {@render children()}
</main>

<style>
  :global(body) {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    color: #0f172a;
    background: #f8fafc;
    min-height: 100vh;
  }
  header {
    padding: 0.85rem 1.75rem;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .brand-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand {
    font-weight: 700;
    font-size: 1.15rem;
    color: #0f172a;
    text-decoration: none;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.15s;
  }
  .brand:hover {
    opacity: 0.8;
  }
  main {
    padding: 2rem 1.5rem;
    max-width: 960px;
    margin: 0 auto;
  }
  .user-area {
    display: flex;
    gap: 0.85rem;
    align-items: center;
  }
  .who {
    color: #334155;
    font-size: 0.88em;
  }
  .local-pill {
    background: #e0f2fe;
    color: #0369a1;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
    border: 1px solid #bae6fd;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .haptic-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #15803d;
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s ease;
  }
  .haptic-toggle:hover {
    background: #dcfce7;
    transform: translateY(-1px);
  }
  .haptic-toggle:active {
    transform: scale(0.94);
  }
  .haptic-toggle.muted {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #64748b;
  }
  .logout-btn {
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #64748b;
    font-size: 0.82em;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .logout-btn:hover {
    background: #f8fafc;
    color: #0f172a;
    border-color: #cbd5e1;
  }
  .db-warn { color: #b25c00; font-size: 0.9em; cursor: help; }
</style>
