import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
    "text-sm font-black leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-hover:text-primary transition-colors uppercase text-muted"
)

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement> & VariantProps<typeof labelVariants>>(
    ({ className, ...props }, ref) => (
        <label
            ref={ref}
            className={cn(labelVariants(), className)}
            {...props}
        />
    )
)
Label.displayName = "Label"

export { Label }
