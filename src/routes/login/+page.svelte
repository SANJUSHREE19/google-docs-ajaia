<script lang="ts">
  import { enhance } from '$app/forms';
  import { triggerHaptic } from '$lib/haptics';
  import type { PageProps } from './$types';

  let { form }: PageProps = $props();

  let email = $state(form?.email ?? 'sanju@example.com');
  let password = $state('password123');

  function pickUser(uEmail: string, uPass: string) {
    triggerHaptic('tap');
    email = uEmail;
    password = uPass;
  }
</script>

<div class="auth-page">
  <h2>Sign in</h2>

  <div class="test-users">
    <span class="test-title">Quick test accounts:</span>
    <div class="user-buttons">
      <button
        type="button"
        class="user-pill"
        class:active={email === 'sanju@example.com'}
        onclick={() => pickUser('sanju@example.com', 'password123')}
      >
        👤 Sanju
      </button>
      <button
        type="button"
        class="user-pill"
        class:active={email === 'anil@example.com'}
        onclick={() => pickUser('anil@example.com', 'password123')}
      >
        👤 Anil
      </button>
      <button
        type="button"
        class="user-pill"
        class:active={email === 'raju@example.com'}
        onclick={() => pickUser('raju@example.com', 'password123')}
      >
        👤 Raju
      </button>
    </div>
  </div>

  <form
    method="POST"
    use:enhance={() => {
      triggerHaptic('pop');
    }}
    class="form"
  >
    <label>
      Email
      <input type="email" name="email" bind:value={email} required autocomplete="email" />
    </label>
    <label>
      Password
      <input type="password" name="password" bind:value={password} required autocomplete="current-password" />
    </label>
    <button type="submit" class="primary">Sign in</button>
  </form>

  {#if form?.message}
    <p class="error">{form.message}</p>
  {/if}

  <p class="aux">Don't have an account? <a href="/signup">Sign up</a></p>
</div>

<style>
  .auth-page { max-width: 380px; margin: 3rem auto; }
  .test-users {
    margin-top: 1.25rem;
    padding: 0.85rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
  }
  .test-title {
    display: block;
    font-size: 0.82em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  .user-buttons {
    display: flex;
    gap: 0.5rem;
  }
  .user-pill {
    flex: 1;
    padding: 6px 8px;
    font-size: 0.85em;
    font-weight: 500;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s ease;
  }
  .user-pill:hover {
    border-color: #94a3b8;
    background: #f1f5f9;
  }
  .user-pill.active {
    border-color: #2563eb;
    background: #eff6ff;
    color: #1d4ed8;
  }
  .form { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.25rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9em; color: #444; }
  input { padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; font: inherit; }
  button.primary {
    padding: 8px 12px;
    background: #1a1a1a;
    color: white;
    border: 1px solid #1a1a1a;
    border-radius: 4px;
    cursor: pointer;
    font: inherit;
    font-weight: 500;
  }
  button.primary:hover { background: #333; }
  .error {
    padding: 0.75rem 1rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #802020;
    margin-top: 1rem;
  }
  .aux { text-align: center; font-size: 0.9em; margin-top: 1.5rem; color: #666; }
</style>
