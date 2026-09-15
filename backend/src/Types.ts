export type JobPosting = {
    title: string,
    description: string; 
    link: string,
    website:string,
    experienceLevel?: string,
}

export type Result<T,E> = Success<T>|Failure<E>;

export type Success<T> = {
    type: "Success"
    value: T
}

export type Failure<E> = {
    type: "Error"
    error: E
}

export function success<T>(val: T): Result<T,never>{
    return {
        type:"Success",
        value:val,
    }
}

export function failure<E>(err: E): Result<never,E>{
    return {
        type:"Error",
        error:err,
    }
}

const levels = ["entry", "junior", "mid", "senior","NA"] as const;
const gradTargets = ["Targetted", "Can apply", "Not targetted", "NA"] as const;

export type level = typeof levels[number];
export type gradTarget = typeof gradTargets[number];

export function isLevel(val: string): val is level {
  return (levels as readonly string[]).includes(val);
}

export function isGradLevel(val: string): val is gradTarget {
  return (gradTargets as readonly string[]).includes(val);
}

export type JobItem = {
    title:string,
    jobLevel: level,
    gradTarget: gradTarget,
    requireCommercialExperience: boolean,
    url: string,
    experienceLevel?: string,
}
