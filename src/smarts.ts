import OpenAI from "openai";
import mammoth from "mammoth";

export type RuleAnalysisResult = {
  rule: string;
  decision: boolean;
  justification: string;
};

export class AIAnalyser {
  private client: OpenAI;

  constructor(private apiKey: string) {
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
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

    for (const rule of rules) {
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
          const parsed = JSON.parse(response);
          results[rule.name] = {
            rule: rule.name,
            decision: Boolean(parsed.decision),
            justification: String(parsed.justification || "No justification provided"),
          };
        } catch (parseError) {
          // Fallback if JSON parsing fails
          results[rule.name] = {
            rule: rule.name,
            decision: false,
            justification: `Failed to parse AI response: ${response}`,
          };
        }
      } catch (error) {
        results[rule.name] = {
          rule: rule.name,
          decision: false,
          justification: `Error analyzing rule: ${error.message}`,
        };
      }
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
