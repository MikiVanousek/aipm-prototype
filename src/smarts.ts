import OpenAI from "openai";
import mammoth from "mammoth";

export type RuleAnalysisResult = {
  rule: string;
  decision: boolean;
  justification: string;
};

export class AIAnalyser {
  private client: OpenAI;
  private parallelThreads: number;

  constructor(
    private apiKey: string,
    parallelThreads: number = 8,
  ) {
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.parallelThreads = Math.max(1, parallelThreads);
  }

  async analyze(data: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an analytical assistant." },
        { role: "user", content: data },
      ],
    });

    return response.choices[0].message.content ?? "";
  }

  async analyzeFile(file: File): Promise<string> {
    if (!file.name.endsWith(".docx")) {
      throw new Error("Only DOCX files are supported");
    }

    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Extract text from DOCX using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const extractedText = result.value;

      // Return the extracted text content for further analysis
      return extractedText;
    } catch (error) {
      throw new Error(`Failed to process DOCX file: ${error.message}`);
    }
  }

  async analyzeRules(documentContent: string, rules: FormattingRule[]): Promise<Record<string, RuleAnalysisResult>> {
    const results: Record<string, RuleAnalysisResult> = {};

    // Process rules in batches with parallel execution
    for (let i = 0; i < rules.length; i += this.parallelThreads) {
      const batch = rules.slice(i, i + this.parallelThreads);

      const batchPromises = batch.map(async (rule) => {
        try {
          const analysisPrompt = `
Document Content:
${documentContent}

Rule to Analyze: ${rule.name}
Rule Instruction: ${rule.instruction}

Please analyze whether the document follows this rule. Respond with a JSON object containing:
- "decision": true if the rule is followed, false if not
- "justification": a clear explanation of why you made this decision

Format your response as valid JSON only.
          `.trim();

          const response = await this.analyze(analysisPrompt);

          try {
            // Extract JSON from markdown code blocks if present
            let jsonString = response.trim();
            const jsonMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch) {
              jsonString = jsonMatch[1];
            }

            const parsed = JSON.parse(jsonString);
            return {
              ruleName: rule.name,
              result: {
                rule: rule.name,
                decision: Boolean(parsed.decision),
                justification: String(parsed.justification || "No justification provided"),
              },
            };
          } catch (parseError) {
            // Fallback if JSON parsing fails
            return {
              ruleName: rule.name,
              result: {
                rule: rule.name,
                decision: false,
                justification: `Failed to parse AI response: ${response}`,
              },
            };
          }
        } catch (error) {
          return {
            ruleName: rule.name,
            result: {
              rule: rule.name,
              decision: false,
              justification: `Error analyzing rule: ${error.message}`,
            },
          };
        }
      });

      // Wait for all promises in this batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Add results to the main results object
      batchResults.forEach(({ ruleName, result }) => {
        results[ruleName] = result;
      });
    }

    return results;
  }
}

export class FormattingRule {
  name: string;
  instruction: string;

  constructor(name: string, instruction: string) {
    this.name = name;
    this.instruction = instruction;
  }
}
