import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type ModelProvider = "ollama" | "openai";
export type OllamaModelName = "hermes3:8b" | "llama2" | "mistral" | "mixtral";
export type OpenAIModelName = "gpt-3.5-turbo" | "gpt-4" | "gpt-4-turbo-preview" | "o1-mini";

interface ModelConfig {
    provider: ModelProvider;
    model: OllamaModelName | OpenAIModelName;
    temperature?: number;
}

export class LLMFactory {
    private model: BaseChatModel;

    constructor(config?: Partial<ModelConfig>) {
        const finalConfig: ModelConfig = {
            provider: "ollama",
            model: "hermes3:8b",
            temperature: 1,
            ...config
        };

        if (finalConfig.provider === "ollama") {
            this.model = new ChatOllama({
                baseUrl: "http://localhost:11434",
                model: finalConfig.model as OllamaModelName,
                temperature: finalConfig.temperature,
            });
        } else {
            const apiKey = Bun.env.OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error("OPENAI_API_KEY environment variable is not set");
            }
            this.model = new ChatOpenAI({
                modelName: finalConfig.model as OpenAIModelName,
                temperature: finalConfig.temperature,
                openAIApiKey: apiKey,
            });
        }
    }

    public getModel(): BaseChatModel {
        return this.model;
    }
} 