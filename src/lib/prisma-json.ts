import { Prisma } from "@prisma/client";

/**
 * Safely convert Prisma JsonValue to InputJsonValue for write operations.
 * Handles null values properly to avoid type errors in strict TypeScript mode.
 * 
 * Use this when copying JSON data from read operations to write operations.
 * 
 * @example
 * // Reading then writing JSON field
 * const version = await prisma.pageVersion.findUnique({ where: { id } });
 * await prisma.pageVersion.create({
 *   data: {
 *     contentJSON: toInputJson(version.contentJSON)
 *   }
 * });
 */
export function toInputJson(
  value: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue;
}
