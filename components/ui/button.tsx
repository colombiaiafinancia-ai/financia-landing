import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /**
         * DEFAULT
         */
        default:
          "bg-[#0D1D35] text-white shadow hover:bg-[#0D1D35]/90 " +
          "dark:bg-gradient-to-r dark:from-[#5ce1e6] dark:to-[#4dd0e1] " +
          "dark:text-[#0D1D35] dark:hover:opacity-90 dark:shadow-[#5ce1e6]/20",

        /**
         * DESTRUCTIVE
         */
        destructive:
          "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90",

        /**
         * OUTLINE
         */
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground " +
          "dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10",

        /**
         * SECONDARY
         */
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",

        /**
         * GHOST
         */
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-white/10",

        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
