import { readFileSync } from "fs";

interface Project {
    title: string;
    url: string;
    description: string;
    summary: string;
    categories: string[];
}

interface CategoryStats {
    totalCount: number;
    primaryCount: number;  // number of times this category appears as first choice
    projects: {
        title: string;
        isPrimary: boolean;
    }[];
}

function generateReport() {
    // Read the categorized projects
    const rawData = readFileSync("data/categorized_projects.json", "utf-8");
    const projects: Project[] = JSON.parse(rawData);

    // Initialize statistics
    const categoryStats: Record<string, CategoryStats> = {};

    // Collect statistics
    projects.forEach(project => {
        project.categories.forEach((category, index) => {
            if (!categoryStats[category]) {
                categoryStats[category] = {
                    totalCount: 0,
                    primaryCount: 0,
                    projects: []
                };
            }

            categoryStats[category].totalCount++;
            if (index === 0) {
                categoryStats[category].primaryCount++;
            }

            categoryStats[category].projects.push({
                title: project.title,
                isPrimary: index === 0
            });
        });
    });

    // Generate report
    console.log("\n=== Category Analysis Report ===\n");
    
    // Sort categories by total count
    const sortedCategories = Object.entries(categoryStats)
        .sort(([, a], [, b]) => b.totalCount - a.totalCount);

    console.log("Summary:");
    console.log("---------");
    console.log(`Total Projects Analyzed: ${projects.length}\n`);

    console.log("Category Statistics:");
    console.log("-------------------");
    sortedCategories.forEach(([category, stats]) => {
        console.log(`\n${category}:`);
        console.log(`  Total Appearances: ${stats.totalCount}`);
        console.log(`  Primary Category: ${stats.primaryCount} times`);
        console.log(`  Usage as Primary: ${((stats.primaryCount / stats.totalCount) * 100).toFixed(1)}%`);
        
        console.log("\n  Projects:");
        stats.projects
            .sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1))
            .forEach(project => {
                console.log(`    ${project.isPrimary ? "★" : "-"} ${project.title}`);
            });
    });

    // Additional insights
    console.log("\nAdditional Insights:");
    console.log("-------------------");
    
    const avgCategoriesPerProject = projects.reduce((sum, p) => sum + p.categories.length, 0) / projects.length;
    console.log(`Average Categories per Project: ${avgCategoriesPerProject.toFixed(2)}`);
    
    const singleCategoryProjects = projects.filter(p => p.categories.length === 1).length;
    console.log(`Projects with Single Category: ${singleCategoryProjects} (${((singleCategoryProjects/projects.length) * 100).toFixed(1)}%)`);
    
    const multiCategoryProjects = projects.filter(p => p.categories.length > 1).length;
    console.log(`Projects with Multiple Categories: ${multiCategoryProjects} (${((multiCategoryProjects/projects.length) * 100).toFixed(1)}%)`);
}

console.log("Generating category analysis report...");
generateReport(); 