import { useState, useRef } from 'react'
import { FileText, Upload, Search, Trash2 } from 'lucide-react'
import { useUserData } from '../contexts/UserDataContext'
import { extractTextFromFile } from '../utils/documentReader'
import Spinner from '../components/Spinner'

export default function DocumentsPage() {
  const { documents: files, loading, addDocument, removeDocument } = useUserData()
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef(null)

  async function handleFileChange(e) {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    setUploading(true)
    try {
      for (const f of selected) {
        const textContent = await extractTextFromFile(f)
        await addDocument({
          name: f.name,
          size: f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(0)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
          type: f.name.split('.').pop()?.toUpperCase() || 'File',
          uploadedAt: new Date(),
          textContent,
        })
      }
    } catch (err) {
      console.error('Error uploading documents:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDeleteDocument(docId) {
    try {
      await removeDocument(docId)
    } catch (err) {
      console.error('Error deleting document:', err)
    }
  }

  const filteredFiles = files.filter((f) =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <Spinner className="py-20" size="lg" label="Loading documents…" />

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-lavender-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Documents</h1>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">All your important financial documents, safely organized. 🗂️</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt,.csv"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Spinner size="sm" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10 py-2.5 text-sm"
        />
      </div>

      {filteredFiles.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Uploaded Documents ({filteredFiles.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-lavender-100 dark:border-lavender-900/30">
                  <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Name</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Type</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Size</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Uploaded</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((doc) => (
                  <tr key={doc.id} className="border-b border-lavender-50 dark:border-lavender-900/20 last:border-0 hover:bg-lavender-50/30 dark:hover:bg-lavender-900/10 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-lavender-400 dark:text-lavender-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-gray-500 dark:text-gray-400">{doc.type}</td>
                    <td className="py-3 text-xs text-gray-500 dark:text-gray-400">{doc.size}</td>
                    <td className="py-3 text-xs text-gray-500 dark:text-gray-400">
                      {doc.uploadedAt?.toDate?.()?.toLocaleDateString?.() || 'Recently'}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 rounded-lg hover:bg-blush-50 dark:hover:bg-blush-900/20 text-gray-400 hover:text-blush-500 transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-lavender-50 dark:bg-lavender-900/20 flex items-center justify-center text-3xl mb-4">📁</div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">No documents uploaded yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-md mx-auto">
            Upload your financial documents — tax forms, investment proofs, insurance policies, receipts, and more — to keep everything organized in one place.
          </p>
        </div>
      )}

      {/* No search results */}
      {files.length > 0 && filteredFiles.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">No documents match your search. Try a different query.</p>
        </div>
      )}
    </div>
  )
}
