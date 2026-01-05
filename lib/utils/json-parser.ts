import { type Receipt, receiptSchema } from "@/lib/schemas/receipt"

export interface JSONParseResult {
  success: boolean
  receipt?: Receipt
  error?: string
}

export function parseJSON(jsonContent: string): JSONParseResult {
  try {
    const parsed = JSON.parse(jsonContent)

    const validation = receiptSchema.safeParse(parsed)

    if (!validation.success) {
      const errors = validation.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("; ")
      return {
        success: false,
        error: `Validation error: ${errors}`,
      }
    }

    return {
      success: true,
      receipt: validation.data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid JSON format",
    }
  }
}
