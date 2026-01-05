"use client"

import { useState, useEffect, useCallback } from "react"

export interface OrganizationSettings {
  organizationName: string
  organizationAddress: string
  organizationPhone: string
  organizationEmail: string
  logoDataUrl: string | null
}

const SETTINGS_KEY = "tinyreceipts-settings"

const defaultSettings: OrganizationSettings = {
  organizationName: "",
  organizationAddress: "",
  organizationPhone: "",
  organizationEmail: "",
  logoDataUrl: null,
}

export function useSettings() {
  const [settings, setSettings] = useState<OrganizationSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
    setIsLoaded(true)
  }, [])

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<OrganizationSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error("Failed to save settings:", error)
      }
      return updated
    })
  }, [])

  // Clear all settings
  const clearSettings = useCallback(() => {
    setSettings(defaultSettings)
    try {
      localStorage.removeItem(SETTINGS_KEY)
    } catch (error) {
      console.error("Failed to clear settings:", error)
    }
  }, [])

  // Upload and convert logo to base64
  const uploadLogo = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Please select an image file"))
        return
      }

      // Limit file size to 500KB
      if (file.size > 500 * 1024) {
        reject(new Error("Image must be smaller than 500KB"))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        saveSettings({ logoDataUrl: dataUrl })
        resolve(dataUrl)
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })
  }, [saveSettings])

  // Remove logo
  const removeLogo = useCallback(() => {
    saveSettings({ logoDataUrl: null })
  }, [saveSettings])

  return {
    settings,
    isLoaded,
    saveSettings,
    clearSettings,
    uploadLogo,
    removeLogo,
  }
}
