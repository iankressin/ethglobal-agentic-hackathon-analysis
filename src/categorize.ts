import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { readFileSync, writeFileSync } from "fs";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { LLMFactory, type ModelProvider, type OllamaModelName, type OpenAIModelName } from "./models/llm";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";

interface Project {
    title: string;
    url: string;
    description: string;
    summary: string;
}

interface CategorizedProject extends Project {
    categories: string[];
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

async function categorizeProject(
    project: Project,
    categories: string[]
): Promise<string[]> {
    const provider = Bun.env.LLM_PROVIDER as ModelProvider;
    const model = Bun.env.LLM_MODEL as OllamaModelName | OpenAIModelName;

    console.log("Provider:", provider);
    console.log("Model:", model);

    if (!provider || !model) {
        throw new Error("LLM_PROVIDER or LLM_MODEL environment variable is not set");
    }

    const llm = new LLMFactory({
        provider,
        model: model,
    }).getModel();

    const classifyPrompt = PromptTemplate.fromTemplate(`
        You are an expert in categorizing blockchain and AI projects, particularly those from the Ethereum ecosystem.
        Given the following project and list of categories, assign the most relevant categories to the project.
        Order the categories by relevance, with the most relevant category first.
        Only assign multiple categories if the project clearly spans multiple domains - if a single category fits well, use just that one.
        If none of the provided categories accurately describe the project's purpose, use the "Other" category.
        The "Other" category should ONLY be used if none of the main categories fit the project.
        
        Project Title: {title}
        Project Description: {description}
        
        Available Categories:
        {categories}
        
        IMPORTANT: Return ONLY a raw JSON array of strings, without any code block formatting, explanation, or additional text.
        BAD Response:  \`\`\`json ["Category1", "Category2"]\`\`\`
        BAD Response:  Here are the categories: ["Category1", "Category2"]
        GOOD Response: ["Category1", "Category2"]
    `);

    const chain = classifyPrompt.pipe(llm);

    const result = await chain.invoke({
        title: project.title,
        description: project.description,
        categories: categories.join(", "),
    });

    try {
        return parseJsonResponse(extractContent(result));
    } catch (error) {
        console.error("Error parsing categories for project:", project.title);
        console.error("Model output:", extractContent(result));
        throw error;
    }
}

async function main() {
    try {
        // Load categories from the previously generated file
        const categoriesData = readFileSync("data/project_categories.json", "utf-8");
        const categories: string[] = JSON.parse(categoriesData);
        console.log("Categories:", categories);
        const rawData = readFileSync("data/ethglobal-agents-projects.json", "utf-8");
        const projects: Project[] = JSON.parse(rawData);

        console.log("Categorizing projects...");
        const categorizedProjects: CategorizedProject[] = [];

        for (const project of projects) {
            console.log(`Categorizing ${project.title}...`);
            const projectCategories = await categorizeProject(project, categories);
            categorizedProjects.push({
                ...project,
                categories: projectCategories,
            });
        }

        // Save categorized projects to a new file
        writeFileSync(
            "data/categorized_projects.json",
            JSON.stringify(categorizedProjects, null, 2)
        );
        console.log("Categorized projects saved to categorized_projects.json");
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main(); 