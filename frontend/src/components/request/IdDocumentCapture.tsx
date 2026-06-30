import { Button } from '@/components/ui/Button'
import { Camera, Upload, X } from 'lucide-react'
import { useRef } from 'react'

interface IdDocumentCaptureProps {
  file: File | null
  onChange: (file: File | null) => void
  idType: 'passport' | 'national_id'
  onTypeChange: (type: 'passport' | 'national_id') => void
  hasExisting?: boolean
}

export function IdDocumentCapture({ file, onChange, idType, onTypeChange, hasExisting }: IdDocumentCaptureProps) {
  const uploadRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ips-blue">ID / Passport *</p>
      <select
        className="w-full px-3 py-2 rounded-lg border border-ips-blue/30 bg-white text-sm text-ips-blue font-medium"
        value={idType}
        onChange={(e) => onTypeChange(e.target.value as 'passport' | 'national_id')}
      >
        <option value="national_id">National ID</option>
        <option value="passport">Passport</option>
      </select>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" className="gap-1 border-ips-blue text-ips-blue" onClick={() => cameraRef.current?.click()}>
          <Camera size={14} /> Take Photo
        </Button>
        <Button type="button" size="sm" variant="outline" className="gap-1 border-ips-blue text-ips-blue" onClick={() => uploadRef.current?.click()}>
          <Upload size={14} /> Upload File
        </Button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      <input ref={uploadRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      {file && (
        <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-ips-blue/5 border border-ips-blue/20 text-ips-blue">
          <span className="truncate">{file.name}</span>
          <button type="button" onClick={() => onChange(null)} className="p-1 hover:text-red-600"><X size={14} /></button>
        </div>
      )}
      {hasExisting && !file && (
        <p className="text-xs text-green-700">ID document already on file. You may upload a new one to replace it.</p>
      )}
      {!file && !hasExisting && (
        <p className="text-xs text-slate-500">A clear photo of your ID or passport is required before approval.</p>
      )}
    </div>
  )
}
