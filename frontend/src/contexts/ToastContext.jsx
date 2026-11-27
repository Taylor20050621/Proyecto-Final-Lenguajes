import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import '../styles/Toast.css'

const ToastContext = createContext(null)

function ToastItem({ toast, onDismiss }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setLeaving(true), 3200)
    const removalTimer = window.setTimeout(() => onDismiss(toast.id), 3500)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(removalTimer)
    }
  }, [onDismiss, toast.id])

  return (
    <div className={`toast-message${leaving ? ' toast-message-leaving' : ''}`} role="status">
      <span>{toast.message}</span>
      <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Cerrar notificación">×</button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const notify = useCallback((message) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current, { id, message }])
  }, [])
  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-container" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const notify = useContext(ToastContext)
  if (!notify) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return notify
}
