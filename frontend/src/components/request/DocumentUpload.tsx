import type { DocumentFile } from '@/schemas/requestSchema'
import { FileText, Trash2, Upload } from 'lucide-react'
import { useRef } from 'react'

const DOC_TYPES = [
  { value: 'passport' as const, label: 'Passport' },
  { value: 'national_id' as const, label: 'National ID' },
  { value: 'other_identification' as const, label: 'Other ID' },
]

interface DocumentUploadProps {
  documents: DocumentFile[]
  onChange: (docs: DocumentFile[]) => void
}

export function DocumentUpload({ documents, onChange }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newDocs: DocumentFile[] = []
    for (let i = 0; i < files.length && documents.length + newDocs.length < 5; i++) {
      const file = files[i]
      if (!['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) continue
      if (file.size > 10 * 1024 * 1024) continue
      newDocs.push({ file, type: 'other_identification' })
    }
    onChange([...documents, ...newDocs])
  }

  const remove = (index: number) => {
    onChange(documents.filter((_, i) => i !== index))
  }

  const updateType = (index: number, type: DocumentFile['type']) => {
    onChange(documents.map((d, i) => (i === index ? { ...d, type } : d)))
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-ips-blue hover:bg-ips-blue/5 transition-colors"
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Click to upload documents
        </p>
        <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG — max 10 MB each, up to 5 files</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {documents.length > 0 && (
        <div className="space-y-3">
          {documents.map((doc, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <FileText className="w-5 h-5 text-ips-blue flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.file.name}</p>
                <p className="text-xs text-slate-500">{(doc.file.size / 1024).toFixed(0)} KB</p>
              </div>
              <select
                value={doc.type}
                onChange={(e) => updateType(i, e.target.value as DocumentFile['type'])}
                className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <button type="button" onClick={() => remove(i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Documents are optional but may speed up verification. You can also upload additional documents later via the client portal.
      </p>
    </div>
  )
}
