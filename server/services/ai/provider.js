import OpenAI from 'openai';

class AIProvider {
    constructor(config) {
        this.config = config;
    }

    async chat(messages, options = {}) {
        throw new Error('Method not implemented');
    }
}

class OpenAIProvider extends AIProvider {
    constructor(apiKey, orgId) {
        super();
        this.client = new OpenAI({
            apiKey: apiKey,
            organization: orgId
        });
    }

    async chat(messages, options = {}) {
        const { model = 'gpt-4o', temperature = 0.7, jsonMode = false } = options;

        // GLOBAL RULE: Omit temperature for models that don't support it (e.g. gpt-5-nano / o1)
        const requestBody = {
            messages,
            model,
            response_format: jsonMode ? { type: "json_object" } : { type: "text" },
            tools: options.tools,
            tool_choice: options.tool_choice
        };

        // If the model name implies it doesn't support temp (like 'nano' or 'o1'), don't send it.
        if (!model.toLowerCase().includes('nano') && !model.startsWith('o1-')) {
            requestBody.temperature = temperature;
        }

        try {
            const completion = await this.client.chat.completions.create(requestBody);

            if (options.fullResponse) {
                return completion.choices[0].message;
            }

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('[OpenAI] Chat Error:', error);
            throw error;
        }
    }

    async stream(messages, options = {}, onChunk) {
        const { model = 'gpt-4o', temperature = 0.7 } = options;

        // GLOBAL RULE: Omit temperature for gpt-5-nano
        const requestBody = {
            messages,
            model,
            stream: true,
        };

        if (!model.toLowerCase().includes('nano') && !model.startsWith('o1-')) {
            requestBody.temperature = temperature;
        }

        try {
            const stream = await this.client.chat.completions.create(requestBody);

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    onChunk(content);
                }
            }
        } catch (error) {
            console.error('[OpenAI] Stream Error:', error);
            throw error;
        }
    }
}

export { OpenAIProvider };
