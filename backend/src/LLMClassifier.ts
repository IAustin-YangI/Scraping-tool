import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

/**
 * Additional instructions to give LLM
 */
const inputInstructions = `Given these job descriptions, for each job posting, classify each job on the following criteria:
                           what level the role is: entry|junior|mid|senior, 
                           whether the job is graduate friendly: Targetted|Can apply|Not targetted,
                           does the job require commercial experience: true:false`
//const responseFormat = `give your answer in the following format using the values given above: Job title - job level|graduate friendly|require commercial experience seperated by ",`
const responseFormat = `give your answer in the exact following format(do not include anything else in the output) using the values given above: job level|graduate friendly|require commercial experience. seperate each posting with a new line`

dotenv.config();

/**
 * Call gemini api to classify job descriptions
 * @param jobDescInput input string containing all the job descriptions
 * @returns String containing Gemini Answers
 */
export async function askGemini(jobDescInput: string): Promise<string>{
    const ai = new GoogleGenAI({});

    const input = `${jobDescInput} ${inputInstructions} ${responseFormat}`
    const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash-lite",
        input: input,
    });
    return String(interaction.output_text) || "no output";
}