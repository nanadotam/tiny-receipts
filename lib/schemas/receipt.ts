import { z } from "zod"
import { CURRENCIES } from "@/lib/constants/currencies"

const currencyCodes = Object.keys(CURRENCIES) as [string, ...string[]]

export const receiptSchema = z.object({
  // Organization
  organizationName: z.string().min(1, "Organization name is required"),
  organizationAddress: z.string().optional(),
  organizationPhone: z.string().optional(),
  organizationEmail: z.string().email().optional(),

  // Customer
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),

  // Receipt Details
  receiptNumber: z.string().min(1, "Receipt number is required"),
  receiptDate: z.string().min(1, "Receipt date is required"),

  // Payment
  paymentMethod: z.enum(["cash", "check", "credit_card", "bank_transfer", "online"]),
  currency: z.enum(currencyCodes),

  // Amounts
  subtotal: z.number().min(0, "Subtotal must be positive"),
  tax: z.number().min(0, "Tax must be non-negative"),
  total: z.number().min(0, "Total must be positive"),

  // Optional
  description: z.string().optional(),
  notes: z.string().optional(),
})

export type Receipt = z.infer<typeof receiptSchema>

export const defaultReceipt: Receipt = {
  organizationName: "Grace Community Church",
  organizationAddress: "123 Main St, City, ST 12345",
  organizationPhone: "(555) 123-4567",
  organizationEmail: "info@gracecc.org",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  receiptNumber: "",
  receiptDate: new Date().toISOString().split("T")[0],
  paymentMethod: "cash",
  currency: "USD",
  subtotal: 0,
  tax: 0,
  total: 0,
  description: "",
  notes: "",
}
