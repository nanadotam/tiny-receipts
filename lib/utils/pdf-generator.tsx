import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import type { Receipt } from "@/lib/schemas/receipt"
import { CURRENCIES } from "@/lib/constants/currencies"

export async function generateReceiptPDF(receipt: Receipt, logoDataUrl?: string | null): Promise<Blob> {
  // Create a temporary container with the receipt HTML
  const container = document.createElement("div")
  container.style.position = "absolute"
  container.style.left = "-9999px"
  container.style.width = "210mm" // A4 width
  container.style.padding = "20px"
  container.style.background = "white"

  const currencyData = CURRENCIES[receipt.currency as keyof typeof CURRENCIES]
  const symbol = currencyData?.symbol || receipt.currency

  const paymentMethodLabels: Record<string, string> = {
    cash: "Cash",
    check: "Check",
    credit_card: "Credit Card",
    bank_transfer: "Bank Transfer",
    online: "Online Payment",
  }

  const paymentLabel = paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod

  // Build logo HTML if available
  const logoHtml = logoDataUrl
    ? `<div style="flex-shrink: 0; width: 80px; height: 80px; margin-right: 16px;">
        <img src="${logoDataUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>`
    : ""

  // Build receipt HTML
  container.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #000; background: #fff; padding: 24px;">
      <div style="border-bottom: 1px solid #ccc; padding-bottom: 24px; margin-bottom: 24px;">
        <div style="display: flex; align-items: flex-start;">
          ${logoHtml}
          <div style="flex: 1;">
            <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 8px 0;">${escapeHtml(receipt.organizationName)}</h1>
            ${receipt.organizationAddress ? `<p style="font-size: 12px; color: #666; margin: 8px 0;">${escapeHtml(receipt.organizationAddress)}</p>` : ""}
            <div style="font-size: 12px; color: #666; margin-top: 12px;">
              ${receipt.organizationPhone ? `<p style="margin: 4px 0;">Phone: ${escapeHtml(receipt.organizationPhone)}</p>` : ""}
              ${receipt.organizationEmail ? `<p style="margin: 4px 0;">Email: ${escapeHtml(receipt.organizationEmail)}</p>` : ""}
            </div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #ccc;">
        <div>
          <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 4px 0;">Receipt Number</p>
          <p style="font-size: 18px; font-weight: bold; color: #000; margin: 0;">${escapeHtml(receipt.receiptNumber)}</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 4px 0;">Receipt Date</p>
          <p style="font-size: 18px; font-weight: bold; color: #000; margin: 0;">${new Date(receipt.receiptDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #ccc;">
        <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 12px 0;">Received From</p>
        <div>
          <p style="font-size: 12px; font-weight: bold; color: #000; margin: 0;">${escapeHtml(receipt.customerName)}</p>
          ${receipt.customerPhone ? `<p style="font-size: 12px; color: #666; margin: 4px 0;">Phone: ${escapeHtml(receipt.customerPhone)}</p>` : ""}
          ${receipt.customerEmail ? `<p style="font-size: 12px; color: #666; margin: 4px 0;">Email: ${escapeHtml(receipt.customerEmail)}</p>` : ""}
        </div>
      </div>

      ${
        receipt.description
          ? `
        <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #ccc;">
          <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 8px 0;">Description</p>
          <p style="font-size: 12px; color: #000; margin: 0;">${escapeHtml(receipt.description)}</p>
        </div>
      `
          : ""
      }

      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #ccc;">
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px;">
            <span style="color: #666;">Subtotal</span>
            <span style="color: #000; font-weight: 500;">${symbol}${receipt.subtotal.toFixed(2)}</span>
          </div>
          ${
            receipt.tax > 0
              ? `
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px;">
              <span style="color: #666;">Tax</span>
              <span style="color: #000; font-weight: 500;">${symbol}${receipt.tax.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          <div style="display: flex; justify-content: space-between; font-size: 16px;">
            <span style="font-weight: bold; color: #000;">Total</span>
            <span style="font-weight: bold; color: #000;">${symbol}${receipt.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #ccc;">
        <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 8px 0;">Payment Method</p>
        <p style="font-size: 12px; font-weight: bold; color: #000; margin: 0;">${paymentLabel}</p>
      </div>

      ${
        receipt.notes
          ? `
        <div style="margin-bottom: 24px;">
          <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 8px 0;">Notes</p>
          <p style="font-size: 12px; color: #666; font-style: italic; margin: 0;">${escapeHtml(receipt.notes)}</p>
        </div>
      `
          : ""
      }
    </div>
  `

  document.body.appendChild(container)

  try {
    // Detect iOS Safari for mobile-specific optimizations
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    const isIOSSafari = isIOS || (isSafari && 'ontouchend' in document)
    
    // Convert HTML to canvas with mobile-optimized settings
    const canvas = await html2canvas(container, {
      scale: isIOSSafari ? 1.5 : 2, // Lower scale on iOS to prevent memory issues
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      allowTaint: true,
      // iOS Safari needs these optimizations
      imageTimeout: 15000,
      removeContainer: false,
      foreignObjectRendering: false, // Disable foreignObject which fails on iOS
    })

    // Create PDF from canvas
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    return pdf.output("blob")
  } finally {
    document.body.removeChild(container)
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
