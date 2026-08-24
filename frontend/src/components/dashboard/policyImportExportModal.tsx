'use client'

import { useState, useMemo, useRef } from 'react'
import {
  Download,
  Upload,
  Copy,
  Check,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  FileUp,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

type PolicyRaw = {
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  is_active?: boolean
}

type PolicyImportExportModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  policies: Array<any>
  onImport: (policies: Array<PolicyRaw>, mode: 'append' | 'replace') => Promise<{ imported: number; skipped: number; total: number }>
}

const SAMPLE_JSON: Array<PolicyRaw> = [
  {
    title: 'Disallow Hardcoded Credentials',
    description: 'Ensure API keys, tokens, passwords, and private secrets are not committed; use environment variables.',
    severity: 'critical',
    is_active: true,
  },
  {
    title: 'Sanitize Database Queries',
    description: 'Prevent raw string interpolation in SQL queries to prevent SQL Injection vulnerabilities.',
    severity: 'critical',
    is_active: true,
  },
  {
    title: 'Strict Input Validation',
    description: 'Validate and schema-check external input parameters on all newly created API endpoints.',
    severity: 'high',
    is_active: true,
  },
]

export function PolicyImportExportModal({
  open,
  onOpenChange,
  policies,
  onImport,
}: PolicyImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Import State
  const [importJson, setImportJson] = useState('')
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // Clean formatted JSON for export
  const exportJsonString = useMemo(() => {
    const exportData = policies.map((p) => ({
      title: p.title,
      description: p.description,
      severity: p.severity,
      is_active: p.is_active ?? true,
    }))
    return JSON.stringify(exportData, null, 2)
  }, [policies])

  // Parse and validate imported JSON
  const validationResult = useMemo(() => {
    if (!importJson.trim()) return null
    try {
      const parsed = JSON.parse(importJson)
      if (!Array.isArray(parsed)) {
        return { valid: false, error: 'JSON root must be an array of policy objects [ { ... } ]', policies: [] }
      }
      if (parsed.length === 0) {
        return { valid: false, error: 'The provided JSON array is empty.', policies: [] }
      }

      const validPolicies: Array<PolicyRaw> = []
      const validSeverities = new Set(['critical', 'high', 'medium', 'low'])

      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i]
        if (!item || typeof item !== 'object') {
          return { valid: false, error: `Item at index ${i} is not a valid object.`, policies: [] }
        }
        if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
          return { valid: false, error: `Item at index ${i} is missing a non-empty "title" string.`, policies: [] }
        }
        if (!item.description || typeof item.description !== 'string' || !item.description.trim()) {
          return { valid: false, error: `Item at index ${i} ("${item.title}") is missing a "description" string.`, policies: [] }
        }
        const sev = String(item.severity || 'high').toLowerCase()
        if (!validSeverities.has(sev)) {
          return { valid: false, error: `Item "${item.title}" has invalid severity "${item.severity}". Allowed: critical, high, medium, low.`, policies: [] }
        }
        validPolicies.push({
          title: item.title.trim(),
          description: item.description.trim(),
          severity: sev as any,
          is_active: typeof item.is_active === 'boolean' ? item.is_active : true,
        })
      }

      return { valid: true, error: null, policies: validPolicies }
    } catch (e: any) {
      return { valid: false, error: `Syntax Error: ${e.message}`, policies: [] }
    }
  }, [importJson])

  const handleDownload = () => {
    const blob = new Blob([exportJsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const dateStr = new Date().toISOString().split('T')[0]
    a.href = url
    a.download = `mergemaster-policies-${dateStr}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportJsonString).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setImportJson(content)
        setImportResult(null)
        setImportError(null)
      }
    }
    reader.readAsText(file)
  }

  const handleExecuteImport = async () => {
    if (!validationResult || !validationResult.valid || validationResult.policies.length === 0) return
    setImporting(true)
    setImportResult(null)
    setImportError(null)
    try {
      const res = await onImport(validationResult.policies, importMode)
      setImportResult(res)
      setImportJson('')
    } catch (err: any) {
      setImportError(err.message || String(err))
    } finally {
      setImporting(false)
    }
  }

  const loadSample = () => {
    setImportJson(JSON.stringify(SAMPLE_JSON, null, 2))
    setImportResult(null)
    setImportError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-zinc-950 border border-zinc-800 text-white rounded-none p-0 overflow-hidden flex flex-col font-sans">
        {/* HEADER */}
        <DialogHeader className="p-4 sm:p-6 bg-black border-b border-zinc-800 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode size={11} className="text-zinc-400" />
                  JSON Policy Manager
                </span>
                <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800 font-mono text-[10px]">
                  {policies.length} Active Rules
                </Badge>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-tight mt-1">
                Import / Export Custom Policies
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-zinc-400 mt-0.5">
                Backup, migrate, or batch-update organizational AI review policies via standard JSON format.
              </DialogDescription>
            </div>

            {/* TAB SWITCHER */}
            <div className="flex items-center border border-zinc-800 bg-black/60 p-1 shrink-0">
              <button
                onClick={() => setActiveTab('export')}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  activeTab === 'export'
                    ? 'bg-white text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Download size={13} />
                <span>Export</span>
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  activeTab === 'import'
                    ? 'bg-white text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Upload size={13} />
                <span>Import</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-zinc-950">
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/40 p-4 border border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-300 font-sans">
                    Export your current <strong className="text-white">{policies.length} custom policies</strong> into a structured JSON file.
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Includes title, instructions, severity levels, and active flags.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleCopyExport}
                    variant="outline"
                    size="sm"
                    className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white rounded-none font-mono text-xs uppercase h-8 px-3 flex-1 sm:flex-initial"
                  >
                    {copied ? (
                      <>
                        <Check size={12} className="text-emerald-400 mr-1.5" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} className="mr-1.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    disabled={policies.length === 0}
                    size="sm"
                    className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase tracking-wider font-bold h-8 px-3 flex-1 sm:flex-initial flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Download .JSON</span>
                  </Button>
                </div>
              </div>

              {/* JSON PREVIEW */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  Export JSON Output
                </span>
                <textarea
                  readOnly
                  value={exportJsonString}
                  rows={14}
                  className="w-full bg-black border border-zinc-800 p-4 font-mono text-xs text-zinc-300 focus:outline-none rounded-none resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* UPLOAD & PASTE CONTROLS */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/40 p-4 border border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-300 font-sans">
                    Import policies by uploading a <strong className="text-white">.json file</strong> or pasting JSON below.
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Schema requires: title, description, and severity (critical | high | medium | low).
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white rounded-none font-mono text-xs uppercase h-8 px-3 flex-1 sm:flex-initial flex items-center gap-1.5"
                  >
                    <FileUp size={13} />
                    <span>Upload File</span>
                  </Button>
                  <Button
                    onClick={loadSample}
                    variant="outline"
                    size="sm"
                    className="bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white rounded-none font-mono text-xs uppercase h-8 px-3 flex-1 sm:flex-initial flex items-center gap-1.5"
                  >
                    <Sparkles size={13} className="text-purple-400" />
                    <span>Load Sample</span>
                  </Button>
                </div>
              </div>

              {/* JSON TEXTAREA */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                    Paste Policy JSON Array
                  </span>
                  {validationResult && (
                    <span
                      className={`font-mono text-[10px] flex items-center gap-1 ${
                        validationResult.valid ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {validationResult.valid ? (
                        <>
                          <CheckCircle2 size={11} />
                          <span>{validationResult.policies.length} valid policies ready</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={11} />
                          <span>Validation error</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <textarea
                  placeholder='[\n  {\n    "title": "Disallow Hardcoded Secrets",\n    "description": "API keys and passwords must not be committed.",\n    "severity": "critical",\n    "is_active": true\n  }\n]'
                  value={importJson}
                  onChange={(e) => {
                    setImportJson(e.target.value)
                    setImportResult(null)
                    setImportError(null)
                  }}
                  rows={10}
                  className="w-full bg-black border border-zinc-800 p-4 font-mono text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 rounded-none resize-none leading-relaxed"
                />
              </div>

              {/* VALIDATION ERROR DISPLAY */}
              {validationResult && !validationResult.valid && (
                <div className="p-3 bg-red-950/20 border border-red-900 text-red-400 font-mono text-xs flex items-center gap-2">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>{validationResult.error}</span>
                </div>
              )}

              {/* IMPORT RESULT BANNER */}
              {importResult && (
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-900 text-emerald-400 font-mono text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>
                    Successfully imported <strong>{importResult.imported}</strong> policies ({importResult.skipped} duplicates skipped).
                  </span>
                </div>
              )}

              {/* IMPORT ERROR BANNER */}
              {importError && (
                <div className="p-3 bg-red-950/20 border border-red-900 text-red-400 font-mono text-xs">
                  {importError}
                </div>
              )}

              {/* IMPORT MODE & CONFIRM BUTTON */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-zinc-900">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="accent-white"
                    />
                    <span>Merge / Append (Safe)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-white"
                    />
                    <span>Replace Entire Policy Set</span>
                  </label>
                </div>

                <Button
                  onClick={handleExecuteImport}
                  disabled={!validationResult?.valid || importing}
                  className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase tracking-wider font-bold px-5 h-9"
                >
                  {importing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin" />
                      Importing...
                    </span>
                  ) : (
                    <span>Confirm Import ({validationResult?.policies.length || 0} Policies)</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
