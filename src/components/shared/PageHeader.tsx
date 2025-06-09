// src/components/shared/PageHeader.tsx

interface PageHeaderProps {
  title: string
  description: string
  backUrl?: string
  backLabel?: string
}

export function PageHeader({ title, description, backUrl, backLabel = 'Back' }: PageHeaderProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-slate-400">{description}</p>
        </div>
        
        {backUrl && (
          <button
            onClick={() => window.location.href = backUrl}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200"
          >
            ← {backLabel}
          </button>
        )}
      </div>
    </div>
  )
}