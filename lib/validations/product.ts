import { z } from "zod";

export const createProductSchema = z.object({
    name: z
        .string()
        .min(1, "Product name is required")
        .max(100, "Name too long"),
    quantity: z
        .number()
        .positive("Quantity must be positive")
        .max(10000, "Quantity too large"),
    kcal: z
        .number()
        .positive("Calories must be positive")
        .max(10000, "Calories too large"),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
