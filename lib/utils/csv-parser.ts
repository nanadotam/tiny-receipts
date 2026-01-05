import { type Receipt, receiptSchema } from "@/lib/schemas/receipt"

export interface CSVParseResult {
  success: boolean
  receipts: Receipt[]
  errors: CSVError[]
}

export interface CSVError {
  row: number
  field: string
  message: string
}

// Organization settings to merge with CSV data
export interface OrganizationDefaults {
  organizationName: string
  organizationAddress: string
  organizationPhone: string
  organizationEmail: string
}

/**
 * Parse CSV values properly handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      // Handle escaped quotes ""
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  // Push the last value
  values.push(current.trim())

  return values
}

/**
 * Parse customer/donation CSV data and merge with organization settings
 */
export function parseCSV(csvContent: string, orgDefaults?: OrganizationDefaults): CSVParseResult {
  const lines = csvContent.trim().split("\n")
  if (lines.length < 2) {
    return {
      success: false,
      receipts: [],
      errors: [{ row: 0, field: "csv", message: "CSV must have header and at least one data row" }],
    }
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, ""))
  const receipts: Receipt[] = []
  const errors: CSVError[] = []

  // Required headers for customer-focused CSV
  const requiredHeaders = [
    "customername",
    "receiptnumber",
    "receiptdate",
    "subtotal",
  ]
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))

  if (missingHeaders.length > 0) {
    return {
      success: false,
      receipts: [],
      errors: [{ row: 0, field: "headers", message: `Missing required headers: ${missingHeaders.join(", ")}` }],
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    const values = parseCSVLine(line)
    const rowData: Record<string, any> = {}

    headers.forEach((header, index) => {
      rowData[header] = values[index] || ""
    })

    // Calculate total if not provided
    const subtotal = Number.parseFloat(rowData.subtotal) || 0
    const tax = Number.parseFloat(rowData.tax) || 0
    const providedTotal = Number.parseFloat(rowData.total)
    const calculatedTotal = !isNaN(providedTotal) ? providedTotal : subtotal + tax

    // Map CSV headers to Receipt fields, using org defaults for organization info
    const receipt: any = {
      // Organization info from settings (or CSV fallback for backwards compatibility)
      organizationName: orgDefaults?.organizationName || rowData.organizationname || "Organization Name",
      organizationAddress: orgDefaults?.organizationAddress || rowData.organizationaddress || undefined,
      organizationPhone: orgDefaults?.organizationPhone || rowData.organizationphone || undefined,
      organizationEmail: orgDefaults?.organizationEmail || rowData.organizationemail || undefined,
      // Customer info from CSV
      customerName: rowData.customername || "",
      customerEmail: rowData.customeremail || rowData.email || undefined,
      customerPhone: rowData.customerphone || rowData.phone || undefined,
      // Receipt details from CSV
      receiptNumber: rowData.receiptnumber || "",
      receiptDate: rowData.receiptdate || new Date().toISOString().split("T")[0],
      paymentMethod: rowData.paymentmethod || "cash",
      currency: rowData.currency || "USD",
      subtotal: subtotal,
      tax: tax,
      total: calculatedTotal,
      description: rowData.description || rowData.purpose || undefined,
      notes: rowData.notes || undefined,
    }

    const validation = receiptSchema.safeParse(receipt)

    if (!validation.success) {
      validation.error.errors.forEach((err) => {
        errors.push({
          row: i + 1,
          field: err.path[0]?.toString() || "unknown",
          message: err.message,
        })
      })
    } else {
      receipts.push(validation.data)
    }
  }

  return {
    success: errors.length === 0,
    receipts,
    errors,
  }
}

/**
 * Generate a simplified CSV template focused on customer/donation data only
 * Organization info comes from settings
 */
export function generateCSVTemplate(): string {
  const headers = [
    "customerName",
    "customerPhone",
    "customerEmail",
    "receiptNumber",
    "receiptDate",
    "description",
    "paymentMethod",
    "currency",
    "subtotal",
    "tax",
    "notes",
  ]

  const sampleRows = [
    [
      "John Doe",
      "(555) 123-4567",
      "john.doe@email.com",
      "REC-001",
      "2026-01-05",
      "Tithe",
      "cash",
      "USD",
      "100.00",
      "0",
      "January tithe payment",
    ],
    [
      "Jane Smith",
      "(555) 987-6543",
      "jane.smith@email.com",
      "REC-002",
      "2026-01-05",
      "Building Fund Donation",
      "check",
      "USD",
      "250.00",
      "0",
      "For new sanctuary",
    ],
  ]

  return [headers.join(","), ...sampleRows.map((row) => row.join(","))].join("\n")
}
