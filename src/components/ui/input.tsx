import * as React from "react"
import { cn } from "cn"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg bg-[#f7f1ff] px-3 py-2 text-sm text-[#1c192c] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#7c7483] focus-visible:outline-none focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#7240b8]/30 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
