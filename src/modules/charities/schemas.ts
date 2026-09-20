import { z } from "zod";

export const charityCategoryEnum = z.enum([
  "Youth & Sports",
  "Environment",
  "Health & Veterans",
  "Community Development",
  "Education",
  "Animal Welfare",
]);

export const createCharitySchema = z.object({
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  description: z.string().min(20, "Detailed description must be at least 20 characters"),
  category: z.string().min(2, "Category is required"),
  logoUrl: z.string().optional().nullable(),
  heroImageUrl: z.string().optional().nullable(),
  websiteUrl: z.string().url("Please provide a valid URL").optional().nullable(),
  isFeatured: z.boolean().default(false),
  featuredOrder: z.number().int().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateCharitySchema = createCharitySchema.partial().extend({
  id: z.string().uuid("Invalid charity ID"),
});

export const createCharityEventSchema = z.object({
  charityId: z.string().uuid("Invalid charity ID"),
  title: z.string().min(3, "Event title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  startsAt: z.string().min(10, "Event date and time is required"),
  location: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
});

export const updateCharitySelectionSchema = z.object({
  charityId: z.string().uuid("Please select a valid charity"),
  charityPercent: z
    .number()
    .min(10, "Minimum charity contribution is 10%")
    .max(100, "Maximum charity contribution is 100%"),
});

export const charityFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  featuredOnly: z.boolean().optional(),
});

export type CreateCharityInput = z.infer<typeof createCharitySchema>;
export type UpdateCharityInput = z.infer<typeof updateCharitySchema>;
export type CreateCharityEventInput = z.infer<typeof createCharityEventSchema>;
export type UpdateCharitySelectionInput = z.infer<typeof updateCharitySelectionSchema>;
export type CharityFilterInput = z.infer<typeof charityFilterSchema>;
