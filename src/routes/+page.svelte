<script lang="ts">
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import * as smarts from "../smarts.js";
    import { rules } from "../pediatric_journal.js";
    import "../styles/page.css";

    const apiKey = writable("");
    let analyser: smarts.AIAnalyser | null = null;
    let inputKey = "";
    let analysisResult = "";
    let rulesAnalysisResults: Record<string, smarts.RuleAnalysisResult> = {};
    let isAnalyzing = false;
    let analysisProgress = "";
    let error = "";
    let showDetailedResults = false;

    onMount(() => {
        const savedKey = localStorage.getItem("apiKey");
        if (savedKey) {
            apiKey.set(savedKey);
        }
    });

    // Whenever apiKey changes, reinitialize the analyser
    $: if ($apiKey) {
        analyser = new smarts.AIAnalyser($apiKey);
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
                        rulesAnalysisResults = {};
                        analysisProgress = "";
                        try {
                            // First extract content from DOCX file
                            analysisProgress = "Extracting content from DOCX file...";
                            const extractedContent = await analyser.analyzeFile(file);

                            // Then analyze against all pediatric journal rules
                            analysisProgress = `Analyzing document against ${rules.length} formatting rules...`;
                            rulesAnalysisResults = await analyser.analyzeRules(extractedContent, rules);

                            analysisProgress = "";
                            analysisResult = "Document analyzed successfully!";
                        } catch (err) {
                            analysisProgress = "";
                            error = err.message || "An error occurred during analysis";
                        } finally {
                            isAnalyzing = false;
                        }
                    }
                }}
            />

            {#if isAnalyzing}
                <div class="progress">
                    <div class="progress-spinner"></div>
                    <p class="status">{analysisProgress || "Analyzing file..."}</p>
                </div>
            {/if}

            {#if error}
                <div class="error">
                    <strong>Error:</strong>
                    {error}
                </div>
            {/if}

            {#if analysisResult}
                <div class="result">
                    <h4>Analysis Complete!</h4>
                    <p>{analysisResult}</p>

                    {#if Object.keys(rulesAnalysisResults).length > 0}
                        <div class="rules-results">
                            <div class="results-header">
                                <h4>Rule Analysis Results:</h4>
                                <div class="results-controls">
                                    <button
                                        class="toggle-btn"
                                        on:click={() => (showDetailedResults = !showDetailedResults)}
                                    >
                                        {showDetailedResults ? "Hide Details" : "Show Details"}
                                    </button>
                                    <button
                                        class="export-btn"
                                        on:click={() => {
                                            const exportData = {
                                                timestamp: new Date().toISOString(),
                                                results: rulesAnalysisResults,
                                                summary: {
                                                    passed: Object.values(rulesAnalysisResults).filter(
                                                        (r) => r.decision,
                                                    ).length,
                                                    total: Object.keys(rulesAnalysisResults).length,
                                                },
                                            };
                                            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                                                type: "application/json",
                                            });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url;
                                            a.download = `analysis-results-${new Date().toISOString().split("T")[0]}.json`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                    >
                                        Export Results
                                    </button>
                                </div>
                            </div>

                            <div class="rules-info">
                                <h5>Rules Being Checked:</h5>
                                <ul>
                                    {#each rules as rule}
                                        <li>
                                            <strong>{rule.name}:</strong>
                                            {rule.instruction}
                                        </li>
                                    {/each}
                                </ul>
                            </div>

                            <div class="summary">
                                <strong>
                                    Summary: {Object.values(rulesAnalysisResults).filter((r) => r.decision)
                                        .length}/{Object.keys(rulesAnalysisResults).length} rules passed
                                </strong>
                            </div>

                            {#if showDetailedResults}
                                <div class="detailed-results">
                                    {#each Object.entries(rulesAnalysisResults) as [ruleName, result]}
                                        <div class="rule-result {result.decision ? 'pass' : 'fail'}">
                                            <div class="rule-header">
                                                <h5>{ruleName}</h5>
                                                <span class="status-badge {result.decision ? 'pass' : 'fail'}">
                                                    {result.decision ? "✅ PASS" : "❌ FAIL"}
                                                </span>
                                            </div>
                                            <p class="justification">{result.justification}</p>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                <div class="compact-results">
                                    {#each Object.entries(rulesAnalysisResults) as [ruleName, result]}
                                        <div class="compact-rule">
                                            <span class="rule-name">{ruleName}</span>
                                            <span class="status-badge {result.decision ? 'pass' : 'fail'}">
                                                {result.decision ? "✅ PASS" : "❌ FAIL"}
                                            </span>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/if}
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
