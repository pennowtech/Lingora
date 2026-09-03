import { createContext, useContext, useState, useCallback, type ReactNode, type JSX } from 'react'
import { Toast } from '../components/ui'
import type { IconName } from '../components/Icon'

export interface ToastOptions {
  icon?: IconName
  durationMs?: number
}

export interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void
  hideToast: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toast, setToast] = useState<{ message: string; icon?: IconName; durationMs?: number } | null>(null)

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    setToast({
      message,
      ...(options?.icon ? { icon: options.icon } : {}),
      ...(options?.durationMs !== undefined ? { durationMs: options.durationMs } : {}),
    })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        message={toast?.message ?? null}
        {...(toast?.icon ? { icon: toast.icon } : {})}
        {...(toast?.durationMs !== undefined ? { durationMs: toast.durationMs } : {})}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      showToast: () => {},
      hideToast: () => {},
    }
  }
  return ctx
}
