import OpenAI from "openai";

class AIAnalyser {
    private client: OpenAI;

    constructor(private apiKey: string) {
        this.client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: apiKey, dangerouslyAllowBrowser: true }); // The key comes from user input
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
}

export default AIAnalyser;
