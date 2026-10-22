import { gradeLocally } from "./local-grader";
import type { Exercise, GradeResult } from "./types";

/** Compares the answer with the accepted translations and explains each mistake with the rule bank. */
export function gradeAnswer(exercise: Exercise, answer: string): GradeResult {
  return gradeLocally(exercise, answer).result;
}
