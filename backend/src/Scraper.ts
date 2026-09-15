import { ApifyClient } from 'apify-client';
import * as dotenv from "dotenv";
import { failure, success, type JobPosting, type Result } from './types.js';

dotenv.config();

//list of job boards to fetch
const sitesList = [fetchSeek,fetchLinkedIn,fetchJora,fetchIndeed]


/**
 * retrieves all posts from selected websites with preset search inputs 
 * @returns list of all retrieved job posts as a JobPosting type
 */
export async function fetchJobs(): Promise<JobPosting[][]>{
    const jobLists = await Promise.all(sitesList.map(fn => fn()))
    jobLists.map(joblist => console.log(joblist.length));
    return jobLists;
}

/**
 * Functions used to call scrapers for different job boards
 */

 async function fetchLinkedIn(): Promise<JobPosting[]> {
    const input = {
        "keywords": "software",
        "location": "Canberra",
        "datePosted": "r86400",
        "limit": 50,
    }
    return await fetchWebsite("valig/linkedin-jobs-scraper",input,"linkedIn");
}

async function fetchSeek(): Promise<JobPosting[]> {
    const input = {
        "keywords": "software",
        "location": "Canberra",
        "dateRange": 1,
        "maxItems": 50,
        "fetchDescriptions": true,
    }
    return await fetchWebsite("scrapersdelight/seek-jobs-scraper",input,"seek");
}

async function fetchJora(): Promise<JobPosting[]> {
    const input = {
        "keyword": "software",
        "location": "canberra",
        "posted_date": "24h",
        "results_wanted": 60,
    }
    return await fetchWebsite("shahidirfan/jora-jobs-scraper",input,"jora");
}

async function fetchIndeed(): Promise<JobPosting[]> {
    const input = {
        "title": "software",
        "location": "canberra",
        "country": "au",
        "limit": 50,
        "datePosted": "1"
    }
    return await fetchWebsite("valig/indeed-jobs-scraper",input,"indeed");
}

/**
 * Calls the apify actor function
 * returns empty array if actor failed
 * @param actor actor being called/used
 * @param input search term/input for the job board
 * @param site string indicating which website
 * @returns a list of JobPostings for returned posts or an empty list if an error detected.
 */
async function fetchWebsite(actor:string, input: Record<string, any>,site:string): Promise<JobPosting[]>{
    const jobPostings = await callActor(actor,input,site);
    if (jobPostings.type === "Error"){
        console.log(jobPostings.error);
        return []
    }
    return jobPostings.value;
}

/**
 * Calls an Apify actor to scrape a job board with predefined inputs
 * @param actor actor being called/used
 * @param input search term/input for the job board
 * @param site string indicating which website
 * @returns a list of JobPostings for returned posts or an error.
 */
export async function callActor(actor:string, input: Record<string, any>,site:string): Promise<Result<JobPosting[],string>> {
    //provide Apify token in .env file
    const token = process.env.APIFY_TOKEN;
    if (!token) {
        throw new Error('Missing APIFY_TOKEN in environment variables.');
    }
    const client = new ApifyClient({
        token: token,
    });

    const run = await client.actor(actor).call(input);
    if(run.status !== 'SUCCEEDED'){
        return failure(`failed to scrape data from ${site} with error ${run.status}`)
    }
    //console.log(`💾 Check your data here: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`successfully scraped jobs from: ${site}`)
    return success(items.map(item => extractDetails(item,site)));

}

/**
 * Creates a JobPosting type using information returned by an Apify Actor.
 * @param details Apify return type containing information for retrieved data
 * @param site string name of the site
 * @returns JobPosting contianing information extracted from details
 */
function extractDetails(details:Record<string | number, unknown>,site:string): JobPosting{
    switch (site){
        case "seek":
            return {
                title:details.title !== undefined ? String(details.title) : "No title found",
                description: details.description !== undefined ? String(details.description_text) : "No description found",
                link: details.job_url !== undefined ? String(details.job_url) : "No url found",
                website: site,
            }
        case "jora":
            return {
                title:details.title !== undefined ? String(details.title) : "No title found",
                description: details.description !== undefined ? String(details.description_text) : "No description found",
                link: details.url !== undefined ? String(details.url) : "No url found",
                website: site,
            }
        case "linkedIn":
            return {
                title:details.title !== undefined ? String(details.title) : "no title",
                description: details.description !== undefined ? String(details.description) : "No description found",
                link: details.url !== undefined ? String(details.url) : "No url found",
                website: site,
                ...(details.experienceLevel !== undefined
                    ? { experienceLevel: String(details.experienceLevel) }
                    : {}),
            }
        case "indeed":
            return {
                title:details.title !== undefined ? String(details.title) : "no title",
                description: details.description !== undefined ? String(details.description) : "No description found",
                link: details.url !== undefined ? String(details.url) : "No url found",
                website: site,
            }
        default:
            return {
                title: "no title",
                description: "No description found",
                link: "No url found",
                website: site,
            }
    }

}