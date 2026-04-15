/**
 * schemaHelpers.ts
 * 
 * Reusable Zod helpers for content schemas
 */

import { z } from "./collectionImports";

export const nonEmptyString = z.string().min(1);
export const optionalString = z.string().optional();
export const positiveInt = z.number().int().positive();