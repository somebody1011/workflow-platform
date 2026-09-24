import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue>({
  value: "",
  onValueChange: () => { },
  open: false,
  setOpen: () => { },
})

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const Select = ({ value, onValueChange, children, className }: SelectProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value: value || "", onValueChange: onValueChange || (() => { }), open, setOpen }}>
      <div className={cn("relative", className)}>{children}</div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { value, setOpen } = React.useContext(SelectContext)

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
          className
        )}
        {...props}
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {children || value || "Select..."}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = ({ children }: { children: React.ReactNode }) => {
  const { open, setOpen, onValueChange, value } = React.useContext(SelectContext)

  if (!open) return null

  const handleSelect = (itemValue: string) => {
    onValueChange(itemValue)
    setOpen(false)
  }

  return (
    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          const item = child as React.ReactElement<SelectItemProps>
          const itemValue = item.props.value
          return (
            <div
              role="option"
              aria-selected={value === itemValue}
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                value === itemValue && "bg-accent"
              )}
              onClick={() => handleSelect(itemValue)}
            >
              {item.props.children}
            </div>
          )
        }
        return child
      })}
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const SelectItem = ({ value, children, className }: SelectItemProps) => {
  return (
    <div
      data-slot="select-item"
      className={cn("", className)}
    >
      {children}
    </div>
  )
}

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }