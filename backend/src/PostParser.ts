import { fetchJobs } from "./Scraper.js";
import { askGemini } from "./LLMClassifier.js";
import {failure, isGradLevel, isLevel, success, type JobItem, type JobPosting, type Result} from "./types.js";
import * as fs from 'fs/promises';
import path from 'path';
import { error } from "console";

const filterOutWords = ["senior","principle","lead"] as const

const filterKeepWords = ["graduate","junior","associate","entry","jr"] as const

const filter: boolean = false as const;

const LLMRetries: number = 2 as const


/**
 * convert JobPosting types to JobItems
 * @param jobPostings 2d list of JobPostings. Each website posts are bundled into the itnernal arrays
 * @returns list of the job postings turned in JobItems
 */
async function toJobItems(jobPostings: JobPosting[][]): Promise<JobItem[]>{
    const jobItems = await classifyAll(jobPostings);
    return jobItems;
}

/**
 * Uses a JobPosting type and job classification string from LLM to create a JobItem
 * @param jobPosting JobPosting type to be used to create JobItem
 * @param jobClassification string containing LLM classification of job post
 * @returns JobItem
 */
function createJobItem(jobPosting: JobPosting, jobClassification: string): JobItem{
    const [jobLevel = "", gradFriendly = "", requireCommercialExperience = ""] = jobClassification.split("|");
        return {
            title: jobPosting.title,
            jobLevel: isLevel(jobLevel) ? jobLevel : "NA",
            gradTarget: isGradLevel(gradFriendly) ? gradFriendly : "NA",
            requireCommercialExperience: requireCommercialExperience === "true",
            url: jobPosting.link, 
            ...(jobPosting.experienceLevel !== undefined
                ? { experienceLevel: String(jobPosting.experienceLevel) }
                : {}),
        }
}

/**
 * converts a lsit of JobPostings to JobItems
 * @param jobPostings list of JobPosting types
 * @returns list of JobItems generated from jobPostings
 */
async function classifyAll(jobPostings: JobPosting[][]):Promise<JobItem[]>{
    const classifications = await Promise.all(jobPostings.map(classify,LLMRetries));
    classifications.forEach(c => {
                        if (c.type === "Error"){
                            console.log(c.error)
                        }
                    })
    return classifications.filter(c => c.type == "Success")
                            .map(classification => classification.value)
                            .flat();
}

/**
 * converts a JobPosting type to a JobItem
 * @param jobPostings JobPosting to convert
 * @returns JobItem generated from jobPosting
 */
async function classify(jobPostings: JobPosting[], retriesLeft:number):Promise<Result<JobItem[],string>>{
    const filteredPostings = filterByTitle(jobPostings);
    if(filteredPostings.length <= 0){
        return failure(`no job posts`);
    }
    const site = filteredPostings[0]?.website;
    const jobStrings = createJobString(filteredPostings);
    const jobClassifications = await askGemini(jobStrings); 
    //verfiy that the LLM output has returned a valid output
    if(validateLMMAns(jobClassifications,filteredPostings.length)){
        //use LLM answer to build jobItem along with the supplied job posting.
        const jobItems = jobClassifications.split(/\r?\n/).map((jobClassification,index) =>  
            createJobItem(filteredPostings[index]!,jobClassification))
        console.log(`LLM successfully returned result for: ${site}`)
        return success(jobItems);
    }
    //try again if generated answer is not correctly formatted
    if (retriesLeft > 0){
        console.log("something went wrong, job postings does not match number of AI answers, retrying")
        return classify(jobPostings,retriesLeft-1);
    }
    return failure(`did not generate a valid LLM response for site: ${site}`);
}


function validateLMMAns(ans:string,len:number):boolean{
    const correct_len = ans.split(/\r?\n/).length === len;
    const correctly_formatted = ans.split(/\r?\n/)
                                   .map(validLLMPostClassification)
                                   .every(val => val === true);
    return correct_len && correctly_formatted;
}

function validLLMPostClassification(classification:string): boolean{
    const [level, target, requireExp] = classification.split('|');
    return isLevel(level ?? " ") && isGradLevel(target ?? " ") && (requireExp === "true" || requireExp === "false");
}

/**
 * converts a list of JobPosting types to a string containing every job description and title
 * @param jobPostings list of JobPosting types
 * @returns string of job information
 */
function createJobString(jobPostings:JobPosting[]): string{
    return jobPostings.map((job,index) => {
                        const x = index+1;
                        return `post ${x}: Title: ${job.title} Job description: ${job.description}`
                      })
                      .join("|");
}

/**
 * filters a list of JobPostings
 * @param jobPostings list of JobPosting types
 * @returns filtered list of JobPosting Types
 */
function filterByTitle(jobPostings: JobPosting[]):JobPosting[]{
    if (!filter){
        return jobPostings;
    }
    return jobPostings.filter(isSeniorRoles);
}   

//filter a job post by whether title indicates a senior role.
function isSeniorRoles(jobPost: JobPosting): boolean{
    const isEntry: Boolean = filterKeepWords.some(word =>
        jobPost.title.toLowerCase().includes(word.toLowerCase())
    ); 
    if(isEntry){
        return false;
    }
    return !filterOutWords.some(word =>
        jobPost.title.toLowerCase().includes(word.toLowerCase())
    );
}

// grabs posts, classifies with LLM and saves to JSON
async function grabPosts(): Promise<void>{
    const postData: JobPosting[][] = await fetchJobs();
    console.log("asking gemini");
    const jobItems = await toJobItems(postData);
    console.log(jobItems);
    //save to folder containing React display so that the JSON can be easily referenced when displaying
    const filePath = path.join(import.meta.dirname, '../../display/posts.json');

    // Write the list to a JSON file
    await fs.writeFile(filePath, JSON.stringify(jobItems, null, 2), 'utf-8');
}

await grabPosts();