import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[#147DD8] shadow-xs shadow-blue-500/10 font-semibold",
        outline:
          "border-border bg-background hover:bg-muted hover:border-zinc-300 text-foreground font-medium shadow-xs",
        secondary:
          "bg-secondary border border-border text-secondary-foreground hover:bg-muted font-medium",
        accent:
          "bg-accent border border-primary/20 text-accent-foreground hover:bg-accent/80 font-semibold",
        ghost:
          "hover:bg-muted hover:text-foreground font-medium",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs font-semibold",
        link: "text-primary underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-9 gap-2 px-4 text-sm",
        xs: "h-7 gap-1 px-2.5 text-xs rounded-md",
        sm: "h-8 gap-1.5 px-3 text-xs font-medium rounded-md",
        lg: "h-11 gap-2.5 px-6 text-sm font-semibold rounded-lg",
        icon: "size-9",
        "icon-xs": "size-7 rounded-md",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
