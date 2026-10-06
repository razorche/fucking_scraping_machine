import { z } from "zod";

export const personalizationOutputSchema = z.object({
  subject: z.string().min(1).max(200),
  bodyText: z.string().min(1).max(8000),
  usedCaseStudy: z.enum(["none", "roma_trans", "la_travel"]).default("none"),
  confidence: z.number().min(0).max(1),
  rationale: z.string().max(500).optional(),
});

export type PersonalizationOutput = z.infer<typeof personalizationOutputSchema>;

export const APPROVED_CASE_STUDIES = {
  roma_trans: {
    id: "roma_trans" as const,
    name: "Roma Trans Inc",
    summary:
      "Roma Trans Inc improved fleet utilization and reduced empty miles using structured outreach and operational follow-up.",
  },
  la_travel: {
    id: "la_travel" as const,
    name: "LA Travel",
    summary:
      "LA Travel increased qualified meeting volume with targeted messaging and consistent follow-up sequences.",
  },
} as const;
