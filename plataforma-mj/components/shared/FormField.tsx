import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField = ({ label, required, error, children, className }: FormFieldProps) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {label}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);
