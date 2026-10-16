import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    style={
      {
        "--normal-bg": "var(--primary)",
        "--normal-text": "var(--primary-foreground)",
        "--normal-border": "var(--primary)",
      } as React.CSSProperties
    }
    {...props}
  />
)

export { Toaster }
