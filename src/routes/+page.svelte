<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import AIAnalyser from "../smarts";

  const apiKey = writable("");
  let analyser: AIAnalyser | null = null;
  let inputKey = "";
  let analysisResult = "";
  let isAnalyzing = false;
  let error = "";

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

    <div class="upload-section">
      <h3>Upload a DOCX file for analysis</h3>
      <input
        type="file"
        accept=".docx"
        disabled={isAnalyzing}
        on:change={async (e) => {
          const file = e.target.files[0];
          if (file && analyser) {
            isAnalyzing = true;
            error = "";
            analysisResult = "";
            try {
              const result = await analyser.analyzeFile(file);
              analysisResult = result;
            } catch (err) {
              error = err.message || "An error occurred during analysis";
            } finally {
              isAnalyzing = false;
            }
          }
        }}
      />

      {#if isAnalyzing}
        <p class="status">Analyzing file...</p>
      {/if}

      {#if error}
        <div class="error">
          <strong>Error:</strong> {error}
        </div>
      {/if}

      {#if analysisResult}
        <div class="result">
          <h4>Analysis Result:</h4>
          <pre>{analysisResult}</pre>
        </div>
      {/if}
    </div>

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
    max-width: 600px;
    margin: 2rem auto;
  }

  .upload-section {
    margin: 1rem 0;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  input {
    padding: 0.5rem;
    font-size: 1rem;
  }

  input[type="file"] {
    margin: 0.5rem 0;
  }

  button {
    padding: 0.5rem;
    cursor: pointer;
  }

  .status {
    color: #0066cc;
    font-style: italic;
  }

  .error {
    color: #cc0000;
    background: #ffeeee;
    padding: 0.5rem;
    border-radius: 4px;
    margin: 0.5rem 0;
  }

  .result {
    background: #f0f8ff;
    border: 1px solid #b3d9ff;
    border-radius: 4px;
    padding: 1rem;
    margin: 0.5rem 0;
  }

  .result h4 {
    margin: 0 0 0.5rem 0;
    color: #0066cc;
  }

  .result pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
    font-family: inherit;
    line-height: 1.4;
  }
</style>
