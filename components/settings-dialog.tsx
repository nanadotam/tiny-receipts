"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useTheme } from "next-themes"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Settings, Sun, Moon, Monitor, Upload, Trash2, Check, X, ImageIcon } from "lucide-react"
import { type OrganizationSettings } from "@/lib/hooks/use-settings"

interface SettingsDialogProps {
  settings: OrganizationSettings
  onSave: (settings: Partial<OrganizationSettings>) => void
  onUploadLogo: (file: File) => Promise<string>
  onRemoveLogo: () => void
  onClear: () => void
}

export function SettingsDialog({
  settings,
  onSave,
  onUploadLogo,
  onRemoveLogo,
  onClear,
}: SettingsDialogProps) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)
  const [logoError, setLogoError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setLocalSettings(settings)
      setLogoError("")
      setSaveSuccess(false)
    }
  }

  const handleChange = (field: keyof OrganizationSettings, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }))
    setSaveSuccess(false)
  }

  const handleSave = () => {
    onSave(localSettings)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setLogoError("")

    try {
      const dataUrl = await onUploadLogo(file)
      setLocalSettings((prev) => ({ ...prev, logoDataUrl: dataUrl }))
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : "Failed to upload logo")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveLogo = () => {
    onRemoveLogo()
    setLocalSettings((prev) => ({ ...prev, logoDataUrl: null }))
  }

  const handleClearAll = () => {
    onClear()
    setLocalSettings({
      organizationName: "",
      organizationAddress: "",
      organizationPhone: "",
      organizationEmail: "",
      logoDataUrl: null,
    })
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure default organization info and appearance. These settings are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Selection */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Appearance</h3>
            <div className="flex gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isActive = theme === option.value
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(option.value)}
                    className="flex-1 gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </Card>

          {/* Logo Upload */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Organization Logo</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Add a logo to appear on all your receipts. Max 500KB.
            </p>

            {localSettings.logoDataUrl ? (
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 border border-border rounded-lg overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={localSettings.logoDataUrl}
                    alt="Organization logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 cursor-pointer"
                    asChild
                    disabled={isUploading}
                  >
                    <span>
                      {isUploading ? (
                        <>Uploading...</>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Logo
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            )}

            {logoError && (
              <p className="text-xs text-destructive mt-2">{logoError}</p>
            )}
          </Card>

          {/* Organization Defaults */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Default Organization Info</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Pre-fill organization details for new receipts.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-org-name" className="text-xs">
                  Organization Name
                </Label>
                <Input
                  id="settings-org-name"
                  value={localSettings.organizationName}
                  onChange={(e) => handleChange("organizationName", e.target.value)}
                  placeholder="Grace Community Church"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-org-address" className="text-xs">
                  Address
                </Label>
                <Input
                  id="settings-org-address"
                  value={localSettings.organizationAddress}
                  onChange={(e) => handleChange("organizationAddress", e.target.value)}
                  placeholder="123 Main St, City, ST 12345"
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="settings-org-phone" className="text-xs">
                    Phone
                  </Label>
                  <Input
                    id="settings-org-phone"
                    type="tel"
                    value={localSettings.organizationPhone}
                    onChange={(e) => handleChange("organizationPhone", e.target.value)}
                    placeholder="(555) 123-4567"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-org-email" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="settings-org-email"
                    type="email"
                    value={localSettings.organizationEmail}
                    onChange={(e) => handleChange("organizationEmail", e.target.value)}
                    placeholder="info@church.org"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1 gap-2">
              {saveSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
            <Button variant="outline" onClick={handleClearAll} className="gap-2">
              <X className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
