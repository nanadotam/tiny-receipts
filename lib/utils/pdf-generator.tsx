import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import type { Receipt } from "@/lib/schemas/receipt"
import { CURRENCIES } from "@/lib/constants/currencies"

export async function generateReceiptPDF(receipt: Receipt, logoDataUrl?: string | null): Promise<Blob> {
  // Detect browser and OS
  const isWindows = /Windows/.test(navigator.userAgent)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isIOSSafari = isIOS || (isSafari && 'ontouchend' in document)
  
  console.log('[PDF Generator] Starting PDF generation...', { isWindows, isIOS, isIOSSafari })

  // Create a temporary container with the receipt HTML
  const container = document.createElement("div")
  container.style.position = "absolute"
  container.style.left = "-9999px"
  container.style.top = "0"
  container.style.width = "794px" // A4 width in pixels at 96 DPI (210mm)
  container.style.padding = "40px"
  container.style.background = "#ffffff"
  container.style.fontFamily = "Arial, sans-serif"

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

  // Build logo HTML if available - use table layout for better Windows compatibility
  const logoHtml = logoDataUrl
    ? `<td style="width: 80px; vertical-align: top; padding-right: 16px;">
        <img src="${logoDataUrl}" alt="Logo" style="width: 80px; height: 80px; object-fit: contain; display: block;" crossorigin="anonymous" />
      </td>`
    : ""

  // Build receipt HTML using table layouts for better cross-browser support
  container.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #000; background: #fff; padding: 24px; box-sizing: border-box;">
      <!-- Header with Logo -->
      <div style="border-bottom: 2px solid #ccc; padding-bottom: 24px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${logoHtml}
            <td style="vertical-align: top;">
              <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 8px 0; color: #000;">${escapeHtml(receipt.organizationName)}</h1>
              ${receipt.organizationAddress ? `<p style="font-size: 12px; color: #666; margin: 8px 0 0 0;">${escapeHtml(receipt.organizationAddress)}</p>` : ""}
              <div style="font-size: 12px; color: #666; margin-top: 12px;">
                ${receipt.organizationPhone ? `<div style="margin: 4px 0;">Phone: ${escapeHtml(receipt.organizationPhone)}</div>` : ""}
                ${receipt.organizationEmail ? `<div style="margin: 4px 0;">Email: ${escapeHtml(receipt.organizationEmail)}</div>` : ""}
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Receipt Number and Date -->
      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #ccc;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 4px 0;">Receipt Number</p>
              <p style="font-size: 18px; font-weight: bold; color: #000; margin: 0;">${escapeHtml(receipt.receiptNumber)}</p>
            </td>
            <td style="width: 50%; text-align: right; vertical-align: top;">
              <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 4px 0;">Receipt Date</p>
              <p style="font-size: 18px; font-weight: bold; color: #000; margin: 0;">${new Date(receipt.receiptDate).toLocaleDateString()}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Customer Info -->
      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #ccc;">
        <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 12px 0;">Received From</p>
        <div>
          <p style="font-size: 12px; font-weight: bold; color: #000; margin: 0;">${escapeHtml(receipt.customerName)}</p>
          ${receipt.customerPhone ? `<p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Phone: ${escapeHtml(receipt.customerPhone)}</p>` : ""}
          ${receipt.customerEmail ? `<p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Email: ${escapeHtml(receipt.customerEmail)}</p>` : ""}
        </div>
      </div>

      <!-- Description -->
      ${
        receipt.description
          ? `
        <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #ccc;">
          <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 8px 0;">Description</p>
          <p style="font-size: 12px; color: #000; margin: 0; white-space: pre-wrap;">${escapeHtml(receipt.description)}</p>
        </div>
      `
          : ""
      }

      <!-- Amount Table -->
      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #ccc;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-size: 12px; color: #666; padding: 6px 0;">Subtotal</td>
            <td style="font-size: 12px; color: #000; font-weight: 500; text-align: right; padding: 6px 0;">${symbol}${receipt.subtotal.toFixed(2)}</td>
          </tr>
          ${
            receipt.tax > 0
              ? `
          <tr>
            <td style="font-size: 12px; color: #666; padding: 6px 0;">Tax</td>
            <td style="font-size: 12px; color: #000; font-weight: 500; text-align: right; padding: 6px 0;">${symbol}${receipt.tax.toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          <tr style="border-top: 1px solid #ccc;">
            <td style="font-size: 16px; font-weight: bold; color: #000; padding: 12px 0 6px 0;">Total</td>
            <td style="font-size: 16px; font-weight: bold; color: #000; text-align: right; padding: 12px 0 6px 0;">${symbol}${receipt.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Payment Method -->
      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #ccc;">
        <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 8px 0;">Payment Method</p>
        <p style="font-size: 12px; font-weight: bold; color: #000; margin: 0;">${paymentLabel}</p>
      </div>

      <!-- Notes -->
      ${
        receipt.notes
          ? `
        <div style="margin-bottom: 24px;">
          <p style="font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 8px 0;">Notes</p>
          <p style="font-size: 12px; color: #666; font-style: italic; margin: 0; white-space: pre-wrap;">${escapeHtml(receipt.notes)}</p>
        </div>
      `
          : ""
      }
    </div>
  `

  document.body.appendChild(container)

  try {
    console.log('[PDF Generator] Container created and appended to DOM')
    
    // Wait a bit for images to load (especially on Windows)
    if (logoDataUrl) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Convert HTML to canvas with platform-optimized settings
    console.log('[PDF Generator] Starting html2canvas conversion...')
    const canvas = await html2canvas(container, {
      scale: isIOSSafari ? 1.5 : (isWindows ? 1.5 : 2), // Lower scale on iOS and Windows to prevent issues
      backgroundColor: "#ffffff",
      logging: true, // Enable logging for debugging
      useCORS: true,
      allowTaint: false, // Stricter CORS for Windows
      imageTimeout: 15000,
      removeContainer: false,
      foreignObjectRendering: false, // Disable foreignObject rendering for better compatibility
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
      // Add explicit width/height for Windows
      width: container.scrollWidth,
      height: container.scrollHeight,
    })
    
    console.log('[PDF Generator] Canvas created successfully', {
      width: canvas.width,
      height: canvas.height
    })

    // Create PDF from canvas
    const imgData = canvas.toDataURL("image/png")
    console.log('[PDF Generator] Image data URL created, length:', imgData.length)
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    })

    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    console.log('[PDF Generator] Adding image to PDF...', {
      imgWidth,
      imgHeight,
      pageHeight
    })

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    console.log('[PDF Generator] PDF generation complete!')
    return pdf.output("blob")
  } catch (error) {
    console.error('[PDF Generator] Error during PDF generation:', error)
    throw error
  } finally {
    document.body.removeChild(container)
    console.log('[PDF Generator] Cleanup complete')
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
