import { Seo } from '@/components/shared/Seo'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { CheckCircle, Copy, Download, ExternalLink, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'

interface SuccessState {
  reference_number: string
  tracking_url: string
  tracking_token: string
  pdf_url: string | null
}

export function RequestSuccessPage() {
  const location = useLocation()
  const state = location.state as SuccessState | null
  const [copied, setCopied] = useState(false)

  if (!state?.reference_number) {
    return <Navigate to="/request" replace />
  }

  const copyRef = () => {
    navigator.clipboard.writeText(state.reference_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pdfUrl = state.pdf_url || api.getPdfDownloadUrl(state.tracking_token)

  return (
    <>
      <Seo title="Request Submitted" path="/request/success" />
      <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full glass rounded-2xl p-8 sm:p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle className="w-20 h-20 text-ips-gold mx-auto mb-6" />
          </motion.div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ips-blue dark:text-white mb-2">
            Request Submitted!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Your request has been received and is under review. You will receive a WhatsApp confirmation shortly.
          </p>

          <div className="bg-ips-blue/5 dark:bg-ips-gold/5 rounded-xl p-6 mb-8">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Reference Number</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-2xl font-bold text-ips-blue dark:text-ips-gold font-mono">
                {state.reference_number}
              </p>
              <button onClick={copyRef} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Copy reference">
                <Copy size={18} className={copied ? 'text-green-500' : 'text-slate-400'} />
              </button>
            </div>
            {copied && <p className="text-xs text-green-500 mt-1">Copied!</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link to={`/track/${state.tracking_token}`}>
              <Button className="w-full gap-2">
                <ExternalLink size={16} /> Track Request
              </Button>
            </Link>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full gap-2">
                <Download size={16} /> Download PDF
              </Button>
            </a>
          </div>

          <a
            href="https://wa.me/250780759253"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline mb-8"
          >
            <MessageCircle size={16} /> Questions? Chat on WhatsApp
          </a>

          <Link to="/" className="text-sm text-slate-500 hover:text-ips-blue">
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </>
  )
}
