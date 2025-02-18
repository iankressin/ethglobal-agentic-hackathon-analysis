import { load } from 'cheerio';
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

interface Project {
    title: string;
    url: string;
    description: string;
    summary: string;
}

async function getShowcaseLinks(page: number): Promise<string[]> {
    const url = `https://ethglobal.com/showcase?events=agents&page=${page}`;
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);
    
    const links: string[] = [];
    $('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('/showcase/')) {
            links.push('https://ethglobal.com' + href);
        }
    });
    
    return links;
}

async function getProjectDetails(url: string): Promise<Project | null> {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = load(html);
        
        const title = $('header > h1').text().trim();
        const summary = $('header > p').text().trim();
        const description = $('.flex-1.space-y-8.text-black-700.lg\\:text-lg')
            .text()
            .trim()
            .replace(/\s+/g, ' ');
        
        if (!title || !description) {
            console.log(`Skipping ${url} - Missing title or description`);
            return null;
        }
        
        return {
            title,
            url,
            description,
            summary: summary || ''  // Provide empty string if no summary found
        };
    } catch (error) {
        console.error(`Error processing ${url}:`, error);
        return null;
    }
}

async function crawlAllProjects() {
    const allProjects: Project[] = [];
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
        console.log(`Crawling page ${page}...`);
        const links = await getShowcaseLinks(page);
        
        if (links.length === 0) {
            hasMorePages = false;
            continue;
        }
        
        for (const link of links) {
            const project = await getProjectDetails(link);
            if (project) {
                allProjects.push(project);
                console.log(`Processed project: ${project.title}`);
            }
        }
        
        page++;
    }
    
    return allProjects;
}

async function main() {
    try {
        console.log('Starting to crawl ETHGlobal showcase...');
        const projects = await crawlAllProjects();
        
        const outputFile = 'ethglobal-agents-projects.json';
        writeFileSync(outputFile, JSON.stringify(projects, null, 2));
        console.log(`Successfully saved ${projects.length} projects to ${outputFile}`);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
