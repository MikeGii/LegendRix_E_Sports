// src/components/shared/MessageDisplay.tsx

interface MessageDisplayProps {
  message: {
    type: 'success' | 'error' | 'warning' | 'info'
    text: string
  } | null
}

export function MessageDisplay({ message }: MessageDisplayProps) {
  if (!message) return null

  const getMessageStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/50 border-green-700 text-green-300'
      case 'error':
        return 'bg-red-900/50 border-red-700 text-red-300'
      case 'warning':
        return 'bg-yellow-900/50 border-yellow-700 text-yellow-300'
      case 'info':
        return 'bg-blue-900/50 border-blue-700 text-blue-300'
      default:
        return 'bg-slate-900/50 border-slate-700 text-slate-300'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '📢'
    }
  }

  return (
    <div className={`p-4 rounded-xl border ${getMessageStyles(message.type)}`}>
      <div className="flex items-center space-x-3">
        <span className="text-lg">{getIcon(message.type)}</span>
        <p className="font-medium flex-1">{message.text}</p>
      </div>
    </div>
  )
}