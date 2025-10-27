import OpenAI from "openai";
import mammoth from "mammoth";

class AIAnalyser {
  private client: OpenAI;

  constructor(private apiKey: string) {
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    }); // The key comes from user input
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
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = result.value;

      // Create analysis prompt with the extracted text
      const analysisPrompt = `
File: ${file.name}
Size: ${file.size} bytes
Last modified: ${new Date(file.lastModified).toISOString()}

Document Content:
${extractedText}

Please provide a comprehensive analysis of this document, including:
1. A summary of the main content
2. Key topics or themes discussed
3. Any important insights or recommendations
4. Document structure and organization
      `.trim();

      return this.analyze(analysisPrompt);
    } catch (error) {
      throw new Error(`Failed to process DOCX file: ${error.message}`);
    }
  }
}

export default AIAnalyser;

class FormattingRule {
  name: string;
  instruction: string;

  constructor(name: string, instruction: string) {
    this.name = name;
    this.instruction = instruction;
  }
}
