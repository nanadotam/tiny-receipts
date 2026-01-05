"use client"

import { useState, useEffect } from "react"
import { type Receipt, defaultReceipt } from "@/lib/schemas/receipt"
import { ReceiptForm } from "@/components/receipt-form"
import { ReceiptPreview } from "@/components/receipt-preview"
import { LandingPage } from "@/components/landing-page"
import { SettingsDialog } from "@/components/settings-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSettings } from "@/lib/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Download, Loader2, CheckCircle2, XCircle } from "lucide-react"

export default function Home() {
  const { settings, isLoaded, saveSettings, clearSettings, uploadLogo, removeLogo } = useSettings()
  const [receipts, setReceipts] = useState<Receipt[]>([defaultReceipt])
  const [currentReceiptIndex, setCurrentReceiptIndex] = useState(0)
  const [showApp, setShowApp] = useState(false)
  const [bulkDownloadProgress, setBulkDownloadProgress] = useState<{
    isDownloading: boolean
    current: number
    total: number
    completed: number
    failed: number
  } | null>(null)

  const currentReceipt = receipts[currentReceiptIndex]

  // Apply settings defaults when starting fresh
  useEffect(() => {
    if (isLoaded && settings.organizationName) {
      setReceipts((prevReceipts) => {
        const updatedReceipts = prevReceipts.map((receipt) => ({
          ...receipt,
          organizationName: receipt.organizationName || settings.organizationName,
          organizationAddress: receipt.organizationAddress || settings.organizationAddress,
          organizationPhone: receipt.organizationPhone || settings.organizationPhone,
          organizationEmail: receipt.organizationEmail || settings.organizationEmail,
        }))
        return updatedReceipts
      })
    }
  }, [isLoaded, settings])

  const handleReceiptChange = (updated: Receipt) => {
    const newReceipts = [...receipts]
    newReceipts[currentReceiptIndex] = updated
    setReceipts(newReceipts)
  }

  const handleCSVUpload = (csvReceipts: Receipt[]) => {
    setReceipts(csvReceipts)
    setCurrentReceiptIndex(0)
    setShowApp(true)
  }

  const handleJSONInput = (receipt: Receipt) => {
    setReceipts([receipt])
    setCurrentReceiptIndex(0)
    setShowApp(true)
  }

  const handleStart = () => {
    // Create new receipt with default settings
    const newReceipt: Receipt = {
      ...defaultReceipt,
      organizationName: settings.organizationName || defaultReceipt.organizationName,
      organizationAddress: settings.organizationAddress || defaultReceipt.organizationAddress,
      organizationPhone: settings.organizationPhone || defaultReceipt.organizationPhone,
      organizationEmail: settings.organizationEmail || defaultReceipt.organizationEmail,
      receiptDate: new Date().toISOString().split("T")[0],
    }
    setReceipts([newReceipt])
    setCurrentReceiptIndex(0)
    setShowApp(true)
  }

  const handleBulkDownload = async () => {
    setBulkDownloadProgress({
      isDownloading: true,
      current: 0,
      total: receipts.length,
      completed: 0,
      failed: 0,
    })

    const { generateReceiptPDF } = await import("@/lib/utils/pdf-generator")
    let completed = 0
    let failed = 0

    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i]
      setBulkDownloadProgress((prev) => prev ? { ...prev, current: i + 1 } : null)

      try {
        const blob = await generateReceiptPDF(receipt, settings.logoDataUrl)
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `receipt-${receipt.receiptNumber || `${i + 1}`}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        completed++
        setBulkDownloadProgress((prev) => prev ? { ...prev, completed } : null)
      } catch (error) {
        console.error(`Failed to generate PDF for receipt ${i + 1}:`, error)
        failed++
        setBulkDownloadProgress((prev) => prev ? { ...prev, failed } : null)
      }

      // Small delay between downloads to avoid browser issues
      if (i < receipts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }

    // Keep progress visible for a moment before clearing
    setTimeout(() => {
      setBulkDownloadProgress(null)
    }, 3000)
  }

  if (!showApp) {
    return (
      <LandingPage
        onStart={handleStart}
        onCSVUpload={handleCSVUpload}
        onJSONInput={handleJSONInput}
        settings={settings}
        onSaveSettings={saveSettings}
        onUploadLogo={uploadLogo}
        onRemoveLogo={removeLogo}
        onClearSettings={clearSettings}
      />
    )
  }

  const showBulkDownload = receipts.length > 1

  return (
    <main className="min-h-screen bg-background">
      {/* Mobile View: Stacked scrollable sections */}
      <div className="md:hidden w-full">
        <div className="flex flex-col min-h-screen overflow-hidden bg-background">
          {/* Header with back button and receipt counter */}
          <div className="p-4 border-b border-border bg-background sticky top-0 z-10">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowApp(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                ← Back to Home
              </button>
              <div className="flex items-center gap-2">
                {receipts.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    Receipt {currentReceiptIndex + 1} of {receipts.length}
                  </span>
                )}
                <ThemeToggle />
                <SettingsDialog
                  settings={settings}
                  onSave={saveSettings}
                  onUploadLogo={uploadLogo}
                  onRemoveLogo={removeLogo}
                  onClear={clearSettings}
                />
              </div>
            </div>

            {/* Receipt navigation for multiple items */}
            {receipts.length > 1 && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setCurrentReceiptIndex(Math.max(0, currentReceiptIndex - 1))}
                  disabled={currentReceiptIndex === 0}
                  className="text-xs px-2 py-1 border border-input rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentReceiptIndex(Math.min(receipts.length - 1, currentReceiptIndex + 1))}
                  disabled={currentReceiptIndex === receipts.length - 1}
                  className="text-xs px-2 py-1 border border-input rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* Bulk Download Button - Mobile */}
            {showBulkDownload && (
              <div className="mt-3">
                <Button
                  onClick={handleBulkDownload}
                  disabled={bulkDownloadProgress?.isDownloading}
                  variant="default"
                  size="sm"
                  className="w-full gap-2"
                >
                  {bulkDownloadProgress?.isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading {bulkDownloadProgress.current}/{bulkDownloadProgress.total}...
                    </>
                  ) : bulkDownloadProgress && !bulkDownloadProgress.isDownloading ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Downloaded {bulkDownloadProgress.completed} of {bulkDownloadProgress.total}
                      {bulkDownloadProgress.failed > 0 && (
                        <span className="text-destructive">({bulkDownloadProgress.failed} failed)</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download All {receipts.length} Receipts
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto pb-6">
            {/* Form Section */}
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-6 text-foreground">Create Receipt</h1>
              <ReceiptForm onReceiptChange={handleReceiptChange} initialReceipt={currentReceipt} />
            </div>

            {/* Divider */}
            <div className="h-px bg-border my-8" />

            {/* Preview Section */}
            <div className="p-4">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Preview</h2>
              <ReceiptPreview receipt={currentReceipt} logoDataUrl={settings.logoDataUrl} />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View: Dual Pane Side-by-Side */}
      <div className="hidden md:grid md:grid-cols-2 min-h-screen bg-background gap-0">
        {/* Form Pane - Left */}
        <div className="overflow-y-auto p-6 border-r border-border flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowApp(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              ← Back to Home
            </button>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SettingsDialog
                settings={settings}
                onSave={saveSettings}
                onUploadLogo={uploadLogo}
                onRemoveLogo={removeLogo}
                onClear={clearSettings}
              />
            </div>
          </div>

          {/* Receipt counter, navigation, and bulk download for multiple items */}
          {receipts.length > 1 && (
            <div className="mb-6 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  Receipt {currentReceiptIndex + 1} of {receipts.length}
                </p>
                
                {/* Bulk Download Button - Desktop */}
                <Button
                  onClick={handleBulkDownload}
                  disabled={bulkDownloadProgress?.isDownloading}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  {bulkDownloadProgress?.isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {bulkDownloadProgress.current}/{bulkDownloadProgress.total}
                    </>
                  ) : bulkDownloadProgress && !bulkDownloadProgress.isDownloading ? (
                    <>
                      {bulkDownloadProgress.failed > 0 ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Done ({bulkDownloadProgress.completed}/{bulkDownloadProgress.total})
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download All ({receipts.length})
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentReceiptIndex(Math.max(0, currentReceiptIndex - 1))}
                  disabled={currentReceiptIndex === 0}
                  className="text-xs px-2 py-1 border border-input rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentReceiptIndex(Math.min(receipts.length - 1, currentReceiptIndex + 1))}
                  disabled={currentReceiptIndex === receipts.length - 1}
                  className="text-xs px-2 py-1 border border-input rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              
              {/* Progress bar */}
              {bulkDownloadProgress?.isDownloading && (
                <div className="mt-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(bulkDownloadProgress.current / bulkDownloadProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generating PDF {bulkDownloadProgress.current} of {bulkDownloadProgress.total}...
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Create Receipt</h1>
            <div className="max-w-md">
              <ReceiptForm onReceiptChange={handleReceiptChange} initialReceipt={currentReceipt} />
            </div>
          </div>
        </div>

        {/* Preview Pane - Right */}
        <div className="overflow-y-auto p-6 bg-muted/30 flex flex-col">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Preview</h2>
            <div className="max-w-md">
              <ReceiptPreview receipt={currentReceipt} logoDataUrl={settings.logoDataUrl} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
