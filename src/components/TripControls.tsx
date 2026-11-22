'use client'

import { useRef, useState, useEffect } from 'react'
import { Download, Upload, RotateCcw, CheckCircle2, AlertTriangle, X, FileJson } from 'lucide-react'
import {
  downloadTripFile,
  readTripFromFile,
  saveStoredTrip,
  clearStoredTrip,
  TripValidationError,
} from '@/lib/storage'
import type { Roadmap } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TripControlsProps {
  roadmap: Roadmap
  onTripChange: (newRoadmap: Roadmap) => void
  onResetDefault: () => void
  className?: string
}

interface NotificationState {
  type: 'success' | 'error' | 'info'
  title: string
  message: string
  details?: string[]
}

export function TripControls({
  roadmap,
  onTripChange,
  onResetDefault,
  className,
}: TripControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notification, setNotification] = useState<NotificationState | null>(null)
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Auto-dismiss success and info notifications after 6 seconds
  useEffect(() => {
    if (!notification || notification.type === 'error') return
    const timer = setTimeout(() => {
      setNotification(null)
    }, 6000)
    return () => clearTimeout(timer)
  }, [notification])

  const handleExport = () => {
    try {
      downloadTripFile(roadmap)
      setNotification({
        type: 'success',
        title: 'Trip Exported',
        message: `Successfully downloaded trip JSON file (${roadmap.layers.length} layers, ${roadmap.milestones.length} milestones).`,
      })
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Export Failed',
        message: err instanceof Error ? err.message : 'Unknown error during export',
      })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setIsProcessing(true)

    try {
      const loadedRoadmap = await readTripFromFile(file)
      saveStoredTrip(loadedRoadmap)
      onTripChange(loadedRoadmap)
      setNotification({
        type: 'success',
        title: 'Trip Loaded Successfully',
        message: `Loaded "${loadedRoadmap.source || file.name}" with ${loadedRoadmap.layers.length} layers and ${loadedRoadmap.milestones.length} milestones.`,
      })
    } catch (err) {
      if (err instanceof TripValidationError) {
        setNotification({
          type: 'error',
          title: 'Invalid Trip File',
          message: `The file "${file.name}" failed schema validation:`,
          details: err.errors,
        })
      } else {
        setNotification({
          type: 'error',
          title: 'Failed to Read File',
          message: err instanceof Error ? err.message : 'Unknown file reading error',
        })
      }
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleResetClick = () => {
    if (!isConfirmingReset) {
      setIsConfirmingReset(true)
      return
    }

    clearStoredTrip()
    onResetDefault()
    setIsConfirmingReset(false)
    setNotification({
      type: 'info',
      title: 'Reset Completed',
      message: 'Roadmap reset to default template. Any custom modifications have been cleared.',
    })
  }

  const cancelReset = () => {
    setIsConfirmingReset(false)
  }

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      {/* Hidden file input for trip import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Upload trip JSON file"
      />

      {/* Control Buttons Toolbar */}
      <div className="flex items-center gap-2" role="toolbar" aria-label="Trip persistence and export controls">
        {/* Save Trip (Export) */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/70 hover:border-primary/50 text-foreground hover:text-primary transition-all duration-200 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
          title="Save and download current trip to a JSON file"
          aria-label="Save Trip (Export JSON)"
        >
          <Download className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Save Trip</span>
          <span className="sm:hidden">Save</span>
        </button>

        {/* Load Trip (Import) */}
        <button
          onClick={handleImportClick}
          disabled={isProcessing}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/70 hover:border-primary/50 text-foreground hover:text-primary transition-all duration-200 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm',
            isProcessing && 'opacity-60 cursor-not-allowed'
          )}
          title="Load trip from a JSON file"
          aria-label="Load Trip (Import JSON)"
        >
          <Upload className="w-4 h-4 text-primary" />
          <span>{isProcessing ? 'Loading...' : 'Load Trip'}</span>
        </button>

        {/* Reset Default */}
        {!isConfirmingReset ? (
          <button
            onClick={handleResetClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/70 hover:border-destructive/50 text-muted-foreground hover:text-destructive transition-all duration-200 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive shadow-sm"
            title="Reset roadmap to default template"
            aria-label="Reset roadmap to default"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">Reset Default</span>
            <span className="md:hidden">Reset</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-destructive/15 border border-destructive/40 px-2 py-1 rounded-lg animate-fade-in shadow-sm">
            <span className="text-xs text-destructive font-medium px-1">Reset?</span>
            <button
              onClick={handleResetClick}
              className="px-2 py-0.5 rounded text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              aria-label="Confirm reset default roadmap"
            >
              Yes
            </button>
            <button
              onClick={cancelReset}
              className="px-2 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cancel reset"
            >
              No
            </button>
          </div>
        )}
      </div>

      {/* Accessible Floating Toast / Banner Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed top-20 right-4 z-50 max-w-md w-[calc(100vw-2rem)] p-4 rounded-xl border text-sm transition-all duration-300 animate-slide-up shadow-2xl backdrop-blur-md',
            notification.type === 'success' && 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100',
            notification.type === 'error' && 'bg-rose-950/90 border-rose-500/50 text-rose-100',
            notification.type === 'info' && 'bg-sky-950/90 border-sky-500/50 text-sky-100'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {notification.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              {notification.type === 'error' && (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              {notification.type === 'info' && (
                <FileJson className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold text-sm leading-tight">{notification.title}</p>
                <p className="text-xs opacity-90 leading-normal">{notification.message}</p>
                {notification.details && notification.details.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-xs space-y-1 opacity-90 bg-black/40 p-2.5 rounded-lg max-h-48 overflow-y-auto border border-white/10">
                    {notification.details.slice(0, 8).map((err, idx) => (
                      <li key={idx} className="font-mono text-[11px]">
                        {err}
                      </li>
                    ))}
                    {notification.details.length > 8 && (
                      <li className="text-[11px] italic">
                        ...and {notification.details.length - 8} more errors
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
