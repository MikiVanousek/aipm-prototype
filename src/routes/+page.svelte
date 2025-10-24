<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import AIAnalyser from "../smarts";

  const apiKey = writable("");
  let analyser: AIAnalyser | null = null;
  let inputKey = "";

  // Load saved key on mount
  onMount(() => {
    const savedKey = localStorage.getItem("apiKey");
    if (savedKey) {
      apiKey.set(savedKey);
    }
  });

  // Whenever apiKey changes, reinitialize the analyser
  $: if ($apiKey) {
    analyser = new AIAnalyser($apiKey);
    analyser.analyze("Some input data").then((result) => {
      console.log("Analysis result:", result);
    });
  }

  function saveKey() {
    if (!inputKey.trim()) return;
    localStorage.setItem("apiKey", inputKey.trim());
    apiKey.set(inputKey.trim());
  }

  function resetKey() {
    localStorage.removeItem("apiKey");
    apiKey.set("");
    analyser = null;
  }
</script>

{#if $apiKey}
  <!-- ✅ API key already set -->
  <div class="app">
    <h2>Welcome back!</h2>
    <p>Your API key is saved.</p>
    <button on:click={resetKey}>Log out / Reset key</button>
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
