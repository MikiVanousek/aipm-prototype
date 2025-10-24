<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  const apiKey = writable("");

  onMount(() => {
    const savedKey = localStorage.getItem("apiKey");
    if (savedKey) {
      apiKey.set(savedKey);
    }
  });

  let inputKey = "";

  function saveKey() {
    if (!inputKey.trim()) return;
    localStorage.setItem("apiKey", inputKey.trim());
    apiKey.set(inputKey.trim());
  }
</script>

{#if $apiKey}
  <!-- ✅ API key already set -->
  <div class="app">
    <h2>Welcome back!</h2>
    <p>Your API key is saved.</p>
    <button
      on:click={() => {
        localStorage.removeItem("apiKey");
        apiKey.set("");
      }}
    >
      Log out / Reset key
    </button>
  </div>
{:else}
  <!-- 🔑 Ask for API key -->
  <div class="setup">
    <h2>Enter your API key</h2>
    <input type="text" bind:value={inputKey} placeholder="Paste your API key" />
    <button on:click={saveKey}>Save</button>
  </div>
{/if}

<style>
  .setup,
  .app {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 300px;
    margin: 2rem auto;
  }
  input {
    padding: 0.5rem;
    font-size: 1rem;
  }
  button {
    padding: 0.5rem;
    cursor: pointer;
  }
</style>
