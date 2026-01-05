import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-4 group-[.toaster]:border-black group-[.toaster]:shadow-brutal group-[.toaster]:rounded-sm",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:font-semibold",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:font-bold",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:font-bold",
          error: "group-[.toaster]:bg-destructive/10 group-[.toaster]:border-destructive",
          success: "group-[.toaster]:bg-primary/10 group-[.toaster]:border-primary",
          warning: "group-[.toaster]:bg-yellow-100 group-[.toaster]:border-yellow-500",
          info: "group-[.toaster]:bg-blue-100 group-[.toaster]:border-blue-500",
          title: "group-[.toast]:font-bold",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
