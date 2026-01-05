"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUp, Code, ArrowRight, Download, AlertCircle, Info } from "lucide-react"
import { parseCSV, generateCSVTemplate } from "@/lib/utils/csv-parser"
import { parseJSON } from "@/lib/utils/json-parser"
import type { Receipt } from "@/lib/schemas/receipt"
import { SettingsDialog } from "@/components/settings-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import type { OrganizationSettings } from "@/lib/hooks/use-settings"

interface LandingPageProps {
  onStart: () => void
  onCSVUpload: (receipts: Receipt[]) => void
  onJSONInput: (receipt: Receipt) => void
  settings: OrganizationSettings
  onSaveSettings: (settings: Partial<OrganizationSettings>) => void
  onUploadLogo: (file: File) => Promise<string>
  onRemoveLogo: () => void
  onClearSettings: () => void
}

export function LandingPage({
  onStart,
  onCSVUpload,
  onJSONInput,
  settings,
  onSaveSettings,
  onUploadLogo,
  onRemoveLogo,
  onClearSettings,
}: LandingPageProps) {
  const [jsonInput, setJsonInput] = useState("")
  const [jsonError, setJsonError] = useState("")
  const [csvErrors, setCsvErrors] = useState<Array<{ row: number; field: string; message: string }>>([])
  const [isLoadingCSV, setIsLoadingCSV] = useState(false)

  const handleJSONSubmit = () => {
    setJsonError("")
    const result = parseJSON(jsonInput)
    if (result.success && result.receipt) {
      onJSONInput(result.receipt)
    } else {
      setJsonError(result.error || "Invalid JSON")
    }
  }

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoadingCSV(true)
    setCsvErrors([])

    try {
      const text = await file.text()
      // Pass organization settings to merge with CSV data
      const result = parseCSV(text, {
        organizationName: settings.organizationName,
        organizationAddress: settings.organizationAddress,
        organizationPhone: settings.organizationPhone,
        organizationEmail: settings.organizationEmail,
      })

      if (!result.success) {
        setCsvErrors(result.errors)
      } else if (result.receipts.length > 0) {
        onCSVUpload(result.receipts)
      }
    } catch (error) {
      setCsvErrors([
        {
          row: 0,
          field: "file",
          message: error instanceof Error ? error.message : "Failed to read file",
        },
      ])
    } finally {
      setIsLoadingCSV(false)
      // Reset file input
      event.target.value = ""
    }
  }

  const downloadCSVTemplate = () => {
    const csv = generateCSVTemplate()
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "donation-receipt-template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const hasOrgSettings = settings.organizationName && settings.organizationName.trim() !== ""

  return (
    <main className="min-h-screen bg-background">
      {/* Mobile: Single column scrollable */}
      <div className="md:hidden w-full">
        <div className="flex flex-col min-h-screen p-4 gap-6 pb-8">
          {/* Header */}
          <div className="pt-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">TinyReceipts</h1>
              <p className="text-sm text-muted-foreground">Simple, fast receipt generation for churches</p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <SettingsDialog
                settings={settings}
                onSave={onSaveSettings}
                onUploadLogo={onUploadLogo}
                onRemoveLogo={onRemoveLogo}
                onClear={onClearSettings}
              />
            </div>
          </div>

          {/* Quick Start Card */}
          <Card className="p-6 border-2 border-primary bg-primary/5">
            <h2 className="text-lg font-bold text-foreground mb-4">Get Started Now</h2>
            <p className="text-sm text-muted-foreground mb-4">Create receipts manually or import in bulk</p>
            <Button onClick={onStart} className="w-full h-11 gap-2">
              <span>Create Receipt</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>

          {/* Tabs for other methods */}
          <Tabs defaultValue="howto" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="howto" className="text-xs">
                How It Works
              </TabsTrigger>
              <TabsTrigger value="csv" className="text-xs">
                CSV Bulk
              </TabsTrigger>
              <TabsTrigger value="json" className="text-xs">
                JSON
              </TabsTrigger>
            </TabsList>

            {/* How It Works Tab */}
            <TabsContent value="howto" className="space-y-4 mt-4">
              <div className="space-y-4">
                {[
                  { num: 1, title: "Configure Settings", desc: "Set your organization details once in Settings ⚙️" },
                  { num: 2, title: "Add Donor Info", desc: "Name, email, and phone of the person giving" },
                  { num: 3, title: "Receipt Details", desc: "Number, date, and donation description" },
                  { num: 4, title: "Choose Currency", desc: "Select from 170+ currencies worldwide" },
                  { num: 5, title: "Enter Amount", desc: "Subtotal and tax, total auto-calculates" },
                  { num: 6, title: "Download PDF", desc: "Print or email the receipt instantly" },
                ].map((step) => (
                  <div key={step.num} className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                      {step.num}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* CSV Tab */}
            <TabsContent value="csv" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                {/* Settings reminder */}
                {!hasOrgSettings && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-700 dark:text-amber-400">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs">
                      <strong>Tip:</strong> Set your organization details in Settings ⚙️ first. They'll be applied to all imported receipts.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FileUp className="w-4 h-4" />
                    CSV Headers (Customer & Donation Data)
                  </h3>
                  <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto text-foreground leading-relaxed">
                    <p>customerName, customerPhone, customerEmail,</p>
                    <p>receiptNumber, receiptDate, description,</p>
                    <p>paymentMethod, currency, subtotal, tax, notes</p>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Organization info is pulled from your Settings automatically.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Payment Methods</h3>
                  <p className="text-sm text-muted-foreground">cash, check, credit_card, bank_transfer, online</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Date Format</h3>
                  <p className="text-sm text-muted-foreground">YYYY-MM-DD (e.g., 2026-01-05)</p>
                </div>

                <Button onClick={downloadCSVTemplate} variant="outline" className="w-full gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </Button>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground block">Upload CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    disabled={isLoadingCSV}
                    className="w-full p-2 border border-input rounded-md bg-background text-foreground text-sm file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-primary file:text-primary-foreground cursor-pointer"
                  />
                </div>

                {csvErrors.length > 0 && (
                  <div className="space-y-2 p-3 bg-destructive/10 border border-destructive/30 rounded">
                    <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {csvErrors.length} error(s) found
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {csvErrors.slice(0, 5).map((err, idx) => (
                        <p key={idx} className="text-xs text-destructive">
                          Row {err.row}, {err.field}: {err.message}
                        </p>
                      ))}
                      {csvErrors.length > 5 && (
                        <p className="text-xs text-destructive">... and {csvErrors.length - 5} more</p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* JSON Tab */}
            <TabsContent value="json" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Paste JSON Receipt Data</label>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`{
  "organizationName": "Grace Community Church",
  "customerName": "John Doe",
  "receiptNumber": "REC-001",
  "receiptDate": "2026-01-05",
  "paymentMethod": "cash",
  "currency": "USD",
  "subtotal": 100,
  "tax": 0
}`}
                    className="w-full h-56 p-3 border border-input rounded-md bg-background text-foreground text-xs font-mono"
                  />
                  {jsonError && <p className="text-xs text-destructive mt-2">{jsonError}</p>}
                </div>

                <Button onClick={handleJSONSubmit} className="w-full h-11 gap-2">
                  <Code className="w-4 h-4" />
                  Create from JSON
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Desktop: Information and Features Layout */}
      <div className="hidden md:grid md:grid-cols-2 min-h-screen">
        {/* Left Pane: How It Works */}
        <div className="overflow-y-auto p-8 border-r border-border flex flex-col justify-center bg-background">
          <div className="max-w-md mx-auto w-full space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-3">TinyReceipts</h1>
                <p className="text-lg text-muted-foreground">
                  Simple, fast receipt generation for churches. No login required. No payment needed.
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                <ThemeToggle />
                <SettingsDialog
                  settings={settings}
                  onSave={onSaveSettings}
                  onUploadLogo={onUploadLogo}
                  onRemoveLogo={onRemoveLogo}
                  onClear={onClearSettings}
                />
              </div>
            </div>

            <Button onClick={onStart} size="lg" className="w-full h-12 text-base gap-2">
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Button>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">How It Works</h2>
              <div className="space-y-4">
                {[
                  { num: 1, title: "Configure Settings", desc: "Set organization details & logo once ⚙️" },
                  { num: 2, title: "Donor Information", desc: "Enter donor name, email, and contact" },
                  { num: 3, title: "Receipt Details", desc: "Number, date, and donation type" },
                  { num: 4, title: "170+ Currencies", desc: "Support for all global currencies" },
                  { num: 5, title: "Auto Calculation", desc: "Tax and totals compute instantly" },
                  { num: 6, title: "Download PDF", desc: "Print or email your receipt" },
                ].map((step) => (
                  <div key={step.num} className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0 text-sm">
                      {step.num}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: CSV & JSON Import */}
        <div className="overflow-y-auto p-8 bg-muted/30 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">Bulk Import & JSON</h2>

            <Tabs defaultValue="csv" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                <TabsTrigger value="json">JSON Input</TabsTrigger>
              </TabsList>

              {/* CSV Tab */}
              <TabsContent value="csv" className="space-y-4">
                <Card className="p-4 space-y-4">
                  {/* Settings reminder */}
                  {!hasOrgSettings && (
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-700 dark:text-amber-400">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-xs">
                        <strong>Tip:</strong> Set your organization details in Settings ⚙️ first. They'll be applied to all imported receipts.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                      <FileUp className="w-4 h-4" />
                      CSV Headers
                    </h3>
                    <div className="bg-background p-2 rounded text-xs font-mono overflow-x-auto text-foreground leading-relaxed">
                      <p className="whitespace-nowrap">customerName, customerPhone, customerEmail,</p>
                      <p className="whitespace-nowrap">receiptNumber, receiptDate, description,</p>
                      <p className="whitespace-nowrap">paymentMethod, currency, subtotal, tax, notes</p>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      Organization info comes from Settings ⚙️
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground text-sm">Payment Methods</h3>
                      <p className="text-xs text-muted-foreground">cash, check, credit_card, bank_transfer, online</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground text-sm">Date Format</h3>
                      <p className="text-xs text-muted-foreground">YYYY-MM-DD</p>
                    </div>
                  </div>

                  <Button onClick={downloadCSVTemplate} variant="outline" className="w-full gap-2 bg-transparent">
                    <Download className="w-4 h-4" />
                    Download Template
                  </Button>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground block">Upload CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      disabled={isLoadingCSV}
                      className="w-full p-2 border border-input rounded-md bg-background text-foreground text-sm file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-primary file:text-primary-foreground cursor-pointer"
                    />
                  </div>

                  {csvErrors.length > 0 && (
                    <div className="space-y-2 p-3 bg-destructive/10 border border-destructive/30 rounded">
                      <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {csvErrors.length} error(s) found
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {csvErrors.slice(0, 5).map((err, idx) => (
                          <p key={idx} className="text-xs text-destructive">
                            Row {err.row}, {err.field}: {err.message}
                          </p>
                        ))}
                        {csvErrors.length > 5 && (
                          <p className="text-xs text-destructive">... and {csvErrors.length - 5} more</p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* JSON Tab */}
              <TabsContent value="json" className="space-y-4">
                <Card className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Paste JSON Data</label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder={`{
  "organizationName": "Grace Community Church",
  "customerName": "John Doe",
  "receiptNumber": "REC-001",
  "receiptDate": "2026-01-05",
  "paymentMethod": "cash",
  "currency": "USD",
  "subtotal": 100,
  "tax": 0
}`}
                      className="w-full h-40 p-2 border border-input rounded text-xs font-mono bg-background text-foreground"
                    />
                    {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
                  </div>

                  <Button onClick={handleJSONSubmit} className="w-full h-11 gap-2">
                    <Code className="w-4 h-4" />
                    Create from JSON
                  </Button>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  )
}
