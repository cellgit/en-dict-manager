import * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = {
  default: "border-border/60 bg-background text-foreground",
  destructive: "border-destructive/40 bg-destructive/5 text-destructive dark:border-destructive/50",
  success: "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-600 dark:border-emerald-500/50 dark:bg-emerald-500/[0.05] dark:text-emerald-400",
  warning: "border-amber-500/50 bg-amber-500/[0.08] text-amber-600 dark:border-amber-500/60 dark:bg-amber-500/[0.05] dark:text-amber-400",
  info: "border-sky-500/40 bg-sky-500/[0.08] text-sky-600 dark:border-sky-500/60 dark:bg-sky-500/[0.05] dark:text-sky-400"
};

type AlertVariant = keyof typeof alertVariants;

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
  "relative flex w-full items-start gap-3 rounded-lg border p-4 text-sm shadow-sm [&>svg]:mt-0.5 [&>svg]:shrink-0 [&>svg]:text-current [&>svg~*]:flex-1",
        alertVariants[variant],
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
