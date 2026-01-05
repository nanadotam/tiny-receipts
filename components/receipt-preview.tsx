"use client"

import type { Receipt } from "@/lib/schemas/receipt"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { CURRENCIES } from "@/lib/constants/currencies"
import { useState } from "react"

interface ReceiptPreviewProps {
  receipt: Receipt
  logoDataUrl?: string | null
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  check: "Check",
  credit_card: "Credit Card",
  bank_transfer: "Bank Transfer",
  online: "Online Payment",
}

export function ReceiptPreview({ receipt, logoDataUrl }: ReceiptPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const currencyData = CURRENCIES[receipt.currency as keyof typeof CURRENCIES]
  const symbol = currencyData?.symbol || receipt.currency
  const paymentLabel = paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const { generateReceiptPDF } = await import("@/lib/utils/pdf-generator")
      const blob = await generateReceiptPDF(receipt, logoDataUrl)
      
      // Detect iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      const isIOSSafari = isIOS || (isSafari && 'ontouchend' in document)
      
      const url = URL.createObjectURL(blob)
      
      if (isIOSSafari) {
        // iOS Safari: Open in new tab for user to save manually
        // This is more reliable than programmatic download on iOS
        const newWindow = window.open(url, '_blank')
        if (!newWindow) {
          // If popup blocked, try alternative approach
          const link = document.createElement("a")
          link.href = url
          link.target = "_blank"
          link.rel = "noopener noreferrer"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        // Delay cleanup for Safari to ensure PDF loads
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      } else {
        // Standard download for other browsers
        const link = document.createElement("a")
        link.href = url
        link.download = `receipt-${receipt.receiptNumber}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      // More helpful error message for mobile users
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (isIOS) {
        alert("Failed to generate PDF on this device. Please try again, or use a desktop browser if the issue persists.")
      } else {
        alert("Failed to generate PDF. Please try again.")
      }
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6 md:p-8 bg-white text-black">
        {/* Header with Logo */}
        <div className="border-b border-gray-300 pb-6 mb-6">
          <div className="flex items-start gap-4">
            {logoDataUrl && (
              <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20">
                <img
                  src={logoDataUrl}
                  alt="Organization logo"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{receipt.organizationName}</h1>
              {receipt.organizationAddress && <p className="text-sm text-gray-600 mt-2">{receipt.organizationAddress}</p>}
              <div className="flex flex-col gap-1 mt-3 text-sm text-gray-600">
                {receipt.organizationPhone && <p>Phone: {receipt.organizationPhone}</p>}
                {receipt.organizationEmail && <p>Email: {receipt.organizationEmail}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Title & Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-300">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Receipt Number</p>
            <p className="text-lg font-bold text-gray-900">{receipt.receiptNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Receipt Date</p>
            <p className="text-lg font-bold text-gray-900">{new Date(receipt.receiptDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6 pb-6 border-b border-gray-300">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Received From</p>
          <div>
            <p className="text-sm font-semibold text-gray-900">{receipt.customerName}</p>
            {receipt.customerPhone && <p className="text-sm text-gray-600">Phone: {receipt.customerPhone}</p>}
            {receipt.customerEmail && <p className="text-sm text-gray-600">Email: {receipt.customerEmail}</p>}
          </div>
        </div>

        {/* Description */}
        {receipt.description && (
          <div className="mb-6 pb-6 border-b border-gray-300">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</p>
            <p className="text-sm text-gray-900">{receipt.description}</p>
          </div>
        )}

        {/* Amount Table */}
        <div className="mb-6 pb-6 border-b border-gray-300">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900 font-medium">
                {symbol}
                {receipt.subtotal.toFixed(2)}
              </span>
            </div>
            {receipt.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900 font-medium">
                  {symbol}
                  {receipt.tax.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">
                {symbol}
                {receipt.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6 pb-6 border-b border-gray-300">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment Method</p>
          <p className="text-sm font-semibold text-gray-900">{paymentLabel}</p>
        </div>

        {/* Notes */}
        {receipt.notes && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes</p>
            <p className="text-sm text-gray-600 italic">{receipt.notes}</p>
          </div>
        )}
      </Card>

      <Button
        onClick={handleDownloadPDF}
        disabled={isDownloading}
        variant="outline"
        className="w-full gap-2 bg-transparent"
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download as PDF
          </>
        )}
      </Button>
    </div>
  )
}
