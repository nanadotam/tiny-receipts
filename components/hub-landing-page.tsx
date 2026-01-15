"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Receipt, FileText, ArrowRight, Settings, Sparkles } from "lucide-react"
import { SettingsDialog } from "@/components/settings-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import type { OrganizationSettings } from "@/lib/hooks/use-settings"

export type ModuleType = "receipts" | "invoices" | null

interface HubLandingPageProps {
  onSelectModule: (module: ModuleType) => void
  settings: OrganizationSettings
  onSaveSettings: (settings: Partial<OrganizationSettings>) => void
  onUploadLogo: (file: File) => Promise<string>
  onRemoveLogo: () => void
  onClearSettings: () => void
}

export function HubLandingPage({
  onSelectModule,
  settings,
  onSaveSettings,
  onUploadLogo,
  onRemoveLogo,
  onClearSettings,
}: HubLandingPageProps) {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Tiny Business</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Professional documents, zero cloud</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Create professional documents
            <br />
            <span className="text-primary">in seconds</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Generate invoices and receipts with custom branding. 
            No account needed. 100% private — everything stays in your browser.
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Invoice Card */}
          <Card 
            className="p-6 md:p-8 border-2 hover:border-primary/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-primary/5"
            onClick={() => onSelectModule("invoices")}
          >
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Tiny Invoices</h3>
                <p className="text-sm text-muted-foreground">
                  Professional invoices with line items, custom fonts, and multi-page support.
                </p>
              </div>
              
              <div className="mt-auto pt-4">
                <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Itemized billing with taxes & discounts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Custom fonts & branding
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    CSV & JSON import
                  </li>
                </ul>
                
                <Button className="w-full gap-2 group-hover:gap-3 transition-all">
                  Create Invoice
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Receipts Card */}
          <Card 
            className="p-6 md:p-8 border-2 hover:border-primary/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-primary/5"
            onClick={() => onSelectModule("receipts")}
          >
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <div className="h-12 w-12 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Receipt className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Tiny Receipts</h3>
                <p className="text-sm text-muted-foreground">
                  Simple donation and payment receipts for churches and nonprofits.
                </p>
              </div>
              
              <div className="mt-auto pt-4">
                <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    170+ currencies supported
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Bulk import via CSV
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    PDF download instantly
                  </li>
                </ul>
                
                <Button variant="outline" className="w-full gap-2 group-hover:gap-3 transition-all bg-transparent">
                  Create Receipt
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Features Highlight */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>100% Private</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>No Account Required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span>Works Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span>Custom Branding</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          <p>Tiny Business — Your documents, your privacy. Data never leaves your browser.</p>
        </div>
      </footer>
    </main>
  )
}
