import * as React from "react"
import { cn } from "@/lib/utils"

interface AlertDialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null)

function useAlertDialog() {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error('AlertDialog components must be used within AlertDialog')
  }
  return context
}

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function AlertDialog({ open: controlledOpen, onOpenChange, children }: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = onOpenChange || setUncontrolledOpen

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

function AlertDialogTrigger({ children }: { children: React.ReactNode }) {
  const { onOpenChange } = useAlertDialog()

  return (
    <div onClick={() => onOpenChange(true)}>
      {children}
    </div>
  )
}

function AlertDialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, onOpenChange } = useAlertDialog()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* AlertDialog */}
      <div
        className={cn(
          "relative z-50 w-full max-w-md rounded-sm border-4 border-black bg-white p-6 shadow-brutal-xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function AlertDialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left mb-4", className)}>
      {children}
    </div>
  )
}

function AlertDialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-xl font-bold", className)}>
      {children}
    </h2>
  )
}

function AlertDialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}

function AlertDialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}>
      {children}
    </div>
  )
}

function AlertDialogAction({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const { onOpenChange } = useAlertDialog()

  return (
    <div
      onClick={() => {
        onClick?.()
        onOpenChange(false)
      }}
    >
      {children}
    </div>
  )
}

function AlertDialogCancel({ children }: { children: React.ReactNode }) {
  const { onOpenChange } = useAlertDialog()

  return (
    <div onClick={() => onOpenChange(false)}>
      {children}
    </div>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}
