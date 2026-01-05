"use client"

import { useState, useEffect } from "react"
import { type Receipt, receiptSchema, defaultReceipt } from "@/lib/schemas/receipt"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CURRENCY_OPTIONS } from "@/lib/constants/currencies"

interface ReceiptFormProps {
  onReceiptChange: (receipt: Receipt) => void
  initialReceipt?: Receipt
}

export function ReceiptForm({ onReceiptChange, initialReceipt = defaultReceipt }: ReceiptFormProps) {
  const [receipt, setReceipt] = useState<Receipt>(initialReceipt)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setReceipt(initialReceipt)
    setErrors({})
  }, [initialReceipt])

  const handleChange = (field: keyof Receipt, value: any) => {
    const updated = { ...receipt, [field]: value }

    // Auto-calculate total
    if (field === "subtotal" || field === "tax") {
      const subtotal = field === "subtotal" ? Number.parseFloat(value) : receipt.subtotal
      const tax = field === "tax" ? Number.parseFloat(value) : receipt.tax
      updated.total = Number.parseFloat((subtotal + tax).toFixed(2))
    }

    setReceipt(updated)
    onReceiptChange(updated)

    // Clear error for this field when user edits it
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const validateForm = () => {
    const result = receiptSchema.safeParse(receipt)
    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        const path = err.path[0]?.toString() || "unknown"
        newErrors[path] = err.message
      })
      setErrors(newErrors)
      return false
    }
    setErrors({})
    return true
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Organization Section */}
      <Card className="p-4 md:p-6">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Organization</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="org-name" className="text-xs">
              Organization Name *
            </Label>
            <Input
              id="org-name"
              value={receipt.organizationName}
              onChange={(e) => handleChange("organizationName", e.target.value)}
              placeholder="Grace Community Church"
              className="text-sm"
            />
            {errors.organizationName && <p className="text-xs text-destructive">{errors.organizationName}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="org-address" className="text-xs">
              Address
            </Label>
            <Input
              id="org-address"
              value={receipt.organizationAddress || ""}
              onChange={(e) => handleChange("organizationAddress", e.target.value)}
              placeholder="123 Main St, City, ST 12345"
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="org-phone" className="text-xs">
                Phone
              </Label>
              <Input
                id="org-phone"
                type="tel"
                value={receipt.organizationPhone || ""}
                onChange={(e) => handleChange("organizationPhone", e.target.value)}
                placeholder="(555) 123-4567"
                className="text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org-email" className="text-xs">
                Email
              </Label>
              <Input
                id="org-email"
                type="email"
                value={receipt.organizationEmail || ""}
                onChange={(e) => handleChange("organizationEmail", e.target.value)}
                placeholder="info@church.org"
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Customer Section */}
      <Card className="p-4 md:p-6">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Customer</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="customer-name" className="text-xs">
              Customer Name *
            </Label>
            <Input
              id="customer-name"
              value={receipt.customerName}
              onChange={(e) => handleChange("customerName", e.target.value)}
              placeholder="John Doe"
              className="text-sm"
            />
            {errors.customerName && <p className="text-xs text-destructive">{errors.customerName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="customer-phone" className="text-xs">
                Phone
              </Label>
              <Input
                id="customer-phone"
                type="tel"
                value={receipt.customerPhone || ""}
                onChange={(e) => handleChange("customerPhone", e.target.value)}
                placeholder="(555) 987-6543"
                className="text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email" className="text-xs">
                Email
              </Label>
              <Input
                id="customer-email"
                type="email"
                value={receipt.customerEmail || ""}
                onChange={(e) => handleChange("customerEmail", e.target.value)}
                placeholder="john@example.com"
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Receipt Details Section */}
      <Card className="p-4 md:p-6">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Receipt Details</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="receipt-number" className="text-xs">
                Receipt Number *
              </Label>
              <Input
                id="receipt-number"
                value={receipt.receiptNumber}
                onChange={(e) => handleChange("receiptNumber", e.target.value)}
                placeholder="REC-001"
                className="text-sm"
              />
              {errors.receiptNumber && <p className="text-xs text-destructive">{errors.receiptNumber}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receipt-date" className="text-xs">
                Receipt Date *
              </Label>
              <Input
                id="receipt-date"
                type="date"
                value={receipt.receiptDate}
                onChange={(e) => handleChange("receiptDate", e.target.value)}
                className="text-sm"
              />
              {errors.receiptDate && <p className="text-xs text-destructive">{errors.receiptDate}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-xs">
              Description
            </Label>
            <Input
              id="description"
              value={receipt.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Church donation, tithes, etc."
              className="text-sm"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-xs">
              Notes
            </Label>
            <Input
              id="notes"
              value={receipt.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes or special instructions"
              className="text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Payment Section */}
      <Card className="p-4 md:p-6">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Payment</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="payment-method" className="text-xs">
                Payment Method *
              </Label>
              <Select value={receipt.paymentMethod} onValueChange={(value) => handleChange("paymentMethod", value)}>
                <SelectTrigger id="payment-method" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="currency" className="text-xs">
                Currency *
              </Label>
              <Select value={receipt.currency} onValueChange={(value) => handleChange("currency", value)}>
                <SelectTrigger id="currency" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {CURRENCY_OPTIONS.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Amount Section */}
      <Card className="p-4 md:p-6">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Amounts</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="subtotal" className="text-xs">
                Subtotal *
              </Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                value={receipt.subtotal}
                onChange={(e) => handleChange("subtotal", Number.parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tax" className="text-xs">
                Tax
              </Label>
              <Input
                id="tax"
                type="number"
                step="0.01"
                value={receipt.tax}
                onChange={(e) => handleChange("tax", Number.parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total" className="text-xs">
                Total *
              </Label>
              <div className="flex items-center justify-center px-3 py-2 border border-input rounded-md bg-muted text-sm font-semibold">
                {receipt.total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <Button onClick={validateForm} className="w-full h-11">
        Generate Receipt
      </Button>
    </div>
  )
}
