# ETHGlobal Agents Hackathon Project Analyzer

This project analyzes projects from the ETHGlobal Agents hackathon, categorizing and providing insights into the various types of AI agent projects built on Ethereum.

## Project Structure

```
.
├── data/                      # Data files
│   ├── ethglobal-agents-projects.json    # Raw project data
│   ├── project_categories.json           # Generated categories
│   ├── categorized_projects.json         # Projects with categories
│   └── projects_list.txt                 # Project list for analysis
├── src/                       # Source code
│   ├── models/               # Model abstractions
│   │   └── llm.ts           # LLM factory for Ollama/OpenAI
│   ├── project_extraction.ts # Project data extraction script
│   ├── create_categories.ts  # Category generation script
│   ├── categorize.ts        # Project categorization script
│   └── generate_report.ts   # Analysis report generator
├── ANALYSIS.md               # Detailed analysis results
└── README.md                 # This file
```

## Features

- Web scraping of ETHGlobal showcase projects
- AI-powered project categorization using LLMs
- Flexible support for both local (Ollama) and cloud (OpenAI) models
- Analysis and reporting

## Requirements

- [Bun](https://bun.sh/) - JavaScript runtime
- [Ollama](https://ollama.ai/) - For local LLM support (optional)
- OpenAI API key (optional, for GPT models)

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Configure environment variables:
   ```bash
   # For Ollama (local)
   export LLM_PROVIDER=ollama
   export LLM_MODEL=hermes3:8b

   # For OpenAI
   export LLM_PROVIDER=openai
   export LLM_MODEL=gpt-4-turbo-preview
   export OPENAI_API_KEY=your_api_key
   ```

## Usage

The analysis is performed in four steps:

**Note:** the final categorized projects can be found in `data/categorized_projects.json`

1. Extract project data:
   ```bash
   bun run src/project_extraction.ts
   ```
   This scrapes and extracts project data from ETHGlobal's showcase.

2. Create categories:
   ```bash
   bun run src/create_categories.ts
   ```
   This generates 6 main categories based on project analysis.

3. Categorize projects:
   ```bash
   bun run src/categorize.ts
   ```
   This assigns categories to each project.
   > **Note**: If using OpenAI models, can incur costs. Using o1-mini for categorizing all projects costs approximately $2. Consider using local models like Ollama for cost-free analysis, though processing might be slower, and if you're using smaller models, the results might not be as good.

4. Generate report:
   ```bash
   bun run src/generate_report.ts
   ```
   This creates a detailed analysis of project categories.

## Analysis Results

A comprehensive analysis of the ETHGlobal Agents hackathon projects has been conducted, revealing significant trends in how AI agents are being integrated into the Ethereum ecosystem. The analysis covers:

- Detailed category breakdowns
- Project distribution patterns
- Cross-category relationships
- Innovation trends
- Market focus analysis

For the complete analysis, please see [ANALYSIS.md](ANALYSIS.md).

## Contributing

Feel free to submit issues and improvements
