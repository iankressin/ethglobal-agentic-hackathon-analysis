import { readFileSync, writeFileSync } from "fs";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { LLMFactory } from "./models/llm";
import type { ModelProvider, OllamaModelName, OpenAIModelName } from "./models/llm";

interface Project {
    title: string;
    url: string;
    description: string;
    summary: string;
}

function extractContent(message: BaseMessage): string {
    return typeof message.content === 'string' ? message.content : '';
}

function parseJsonResponse(content: string): string[] {
    // Remove any markdown code block syntax
    const cleanContent = content.replace(/```json\n?|\n?```/g, '');
    
    try {
        const parsed = JSON.parse(cleanContent.trim());
        if (!Array.isArray(parsed)) {
            throw new Error('Response is not an array');
        }
        return parsed;
    } catch (error) {
        // If initial parse fails, try to find array-like content
        const arrayMatch = cleanContent.match(/\[(.*?)\]/s);
        if (arrayMatch) {
            try {
                return JSON.parse(arrayMatch[0]);
            } catch {
                throw error; // If this also fails, throw the original error
            }
        }
        throw error;
    }
}

async function createCategories(projects: Project[]): Promise<string[]> {
    // Create a new LLMFactory instance with configuration
    const model = new LLMFactory({
        provider: (Bun.env.LLM_PROVIDER as ModelProvider) || "ollama",
        model: (Bun.env.LLM_MODEL as OllamaModelName | OpenAIModelName) || "hermes3:8b",
        temperature: 0.7
    }).getModel();

    const categoryPrompt = PromptTemplate.fromTemplate(`
        You are an expert in categorizing blockchain and AI projects, particularly those involving Ethereum and AI agents.
        Based on the following list of project titles and summaries, create exactly 6 distinct categories that represent the main domains or purposes of these projects.
        
        The categories should be similar to these examples, but based on the actual projects:
        - "DeFi" (decentralized finance projects)
        - "Social" (social networking and community projects)
        - "Infrastructure" (blockchain infrastructure and tooling)
        - "Gaming" (blockchain games and entertainment)
        - "NFT" (NFT-related projects)
        - "DAO" (decentralized autonomous organizations)
        
        Remember these are AI agent projects from an Ethereum hackathon, so focus on the intersection of AI, blockchain, and their practical applications.
        Consider that these projects are specifically about AI agents interacting with blockchain systems.
        Focus on the primary purpose or domain of the AI agents (e.g., trading, security, automation, etc.).
        
        Projects:
        {projects}
        
        IMPORTANT: Return ONLY a raw JSON array of strings containing exactly 6 categories, without any code block formatting, explanation, or additional text.
        BAD Response:  \`\`\`json ["Category1", "Category2", "Category3", "Category4", "Category5", "Category6"]\`\`\`
        BAD Response:  Here are the categories: ["Category1", "Category2", "Category3", "Category4", "Category5", "Category6"]
        GOOD Response: ["Category1", "Category2", "Category3", "Category4", "Category5", "Category6"]
    `);

    const projectsList = projects
        .map(p => `Title: ${p.title}\nSummary: ${p.summary}`)
        .join("\n\n");

    writeFileSync("data/projects_list.txt", projectsList);

    const chain = categoryPrompt.pipe(model);

    const result = await chain.invoke({
        projects: projectsList,
    });

    try {
        const categories = parseJsonResponse(extractContent(result));
        if (categories.length !== 6) {
            throw new Error(`Expected 6 categories, got ${categories.length}`);
        }
        return categories;
    } catch (error) {
        console.error("Error parsing categories:", extractContent(result));
        throw error;
    }
}

async function main() {
    try {
        // Load projects from the existing JSON file
        const rawData = readFileSync("data/ethglobal-agents-projects.json", "utf-8");
        const projects: Project[] = JSON.parse(rawData);

        console.log("Creating categories...");
        const categories = await createCategories(projects);
        console.log("Categories created:", categories);

        // Save categories to a separate file
        writeFileSync("data/project_categories.json", JSON.stringify(categories, null, 2));
        console.log("Categories saved to project_categories.json");
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main(); 