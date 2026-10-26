<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';

  let { form }: PageProps = $props();
</script>

<div class="auth-page">
  <h2>Create account</h2>

  <form method="POST" use:enhance class="form">
    <label>
      Display name (optional)
      <input name="display_name" value={form?.displayName ?? ''} placeholder="defaults to email username" />
    </label>
    <label>
      Email
      <input type="email" name="email" required autocomplete="email" value={form?.email ?? ''} />
    </label>
    <label>
      Password (min 8 characters)
      <input type="password" name="password" required minlength="8" autocomplete="new-password" />
    </label>
    <button type="submit" class="primary">Sign up</button>
  </form>

  {#if form?.message}
    <p class="error">{form.message}</p>
  {/if}

  <p class="aux">Already have an account? <a href="/login">Sign in</a></p>
</div>

<style>
  .auth-page { max-width: 380px; margin: 4rem auto; }
  .form { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; }
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
