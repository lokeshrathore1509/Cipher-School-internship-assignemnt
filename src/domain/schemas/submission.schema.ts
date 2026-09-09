import { z } from "zod";

export const structuredSubmissionSchema = z.object({
  requirementsUnderstanding: z
    .string()
    .min(15, "Please summarize your understanding of the requirements (at least 15 characters)."),
  assumptions: z
    .string()
    .min(10, "Please list at least a couple of assumptions or constraints you are designing for."),
  coreClasses: z
    .string()
    .min(15, "Please list the primary classes, interfaces, and enums in your design."),
  responsibilities: z
    .string()
    .min(15, "Please explain the single responsibility of each key class."),
  relationships: z
    .string()
    .min(10, "Please describe the relationships (Inheritance, Composition, Association) between classes."),
  importantMethods: z
    .string()
    .min(10, "Please outline the key public methods and their behavioral contracts."),
  designPatterns: z
    .string()
    .min(5, "Please state which design patterns or abstractions you used and why."),
  edgeCases: z
    .string()
    .min(10, "Please detail how your design handles edge cases, concurrency, or failures."),
  tradeOffs: z
    .string()
    .min(10, "Please discuss trade-offs (e.g., complexity vs extensibility, memory vs speed)."),
  solutionNotes: z.string().optional().default(""),
});

export type StructuredSubmissionInput = z.infer<typeof structuredSubmissionSchema>;
