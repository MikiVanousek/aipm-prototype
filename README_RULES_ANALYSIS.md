# Rules Analysis Functionality

This document describes the new `analyzeRules` method added to the `AIAnalyser` class, which allows you to validate documents against a set of formatting rules using AI.

## Overview

The `analyzeRules` method takes a document's content and a list of formatting rules, then uses AI to analyze whether each rule is followed in the document. It returns a structured result with decisions and justifications for each rule.

## Key Components

### RuleAnalysisResult Interface

```typescript
interface RuleAnalysisResult {
  rule: string;           // Name of the rule
  decision: boolean;      // true if rule is followed, false if not
  justification: string;  // AI's explanation for the decision
}
```

### FormattingRule Class

```typescript
class FormattingRule {
  name: string;        // Human-readable name for the rule
  instruction: string; // Detailed instruction for what to check

  constructor(name: string, instruction: string) {
    this.name = name;
    this.instruction = instruction;
  }
}
```

## Usage

### Basic Usage

```typescript
import { AIAnalyser, FormattingRule } from "./smarts";

const analyzer = new AIAnalyser("your-api-key");

const rules = [
  new FormattingRule(
    "Abstract Length",
    "Verify that the abstract is between 150 and 250 words."
  ),
  new FormattingRule(
    "Figure Captions",
    "Each figure caption must begin with 'Fig.' in bold type."
  )
];

const documentContent = "Your document content here...";

const results = await analyzer.analyzeRules(documentContent, rules);

// Results is a Record<string, RuleAnalysisResult>
for (const [ruleName, result] of Object.entries(results)) {
  console.log(`${ruleName}: ${result.decision ? 'PASS' : 'FAIL'}`);
  console.log(`Reason: ${result.justification}`);
}
```

### With File Upload

```typescript
// Extract content from DOCX file first
const fileContent = await analyzer.analyzeFile(uploadedFile);

// Then analyze against rules
const results = await analyzer.analyzeRules(fileContent, rules);
```

## Predefined Rules

The `pediatric_journal.ts` file contains predefined rules for academic journal formatting:

- **Abstract Length and Content**: Checks word count (150-250 words) and undefined abbreviations
- **Figure Caption Formatting**: Validates figure caption format with "Fig." in bold
- **Reference Citation Style**: Ensures proper citation format with square brackets

## Error Handling

The method includes robust error handling:

- If the AI response cannot be parsed as JSON, it falls back to a safe error state
- Individual rule failures don't stop the analysis of other rules
- All errors are captured in the justification field

## Return Format

The method returns a `Record<string, RuleAnalysisResult>` where:
- Keys are rule names
- Values contain the analysis result with decision and justification

Example return value:
```typescript
{
  "Abstract Length and Content": {
    rule: "Abstract Length and Content",
    decision: true,
    justification: "The abstract contains 180 words, which is within the required range of 150-250 words."
  },
  "Figure Caption Formatting": {
    rule: "Figure Caption Formatting",
    decision: false,
    justification: "Figure caption does not start with 'Fig.' in bold format."
  }
}
```

## Performance Considerations

- Each rule is analyzed individually, so analysis time scales linearly with the number of rules
- Consider batching rules or implementing parallel processing for large rule sets
- The AI model used is `gpt-4o-mini` for cost-effectiveness while maintaining quality

## Extending with Custom Rules

You can easily create custom rules for different document types or standards:

```typescript
const customRules = [
  new FormattingRule(
    "Title Formatting",
    "The document title must be in Title Case and not exceed 15 words."
  ),
  new FormattingRule(
    "Page Numbers",
    "All pages except the title page must have page numbers in the bottom right corner."
  )
];

const results = await analyzer.analyzeRules(documentContent, customRules);
```
