"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@/components/shared/FormField";
import { useCreateUser } from "@/hooks/useUsers";
import type { UserRole } from "@/lib/types";
import type { CreateUserPayload } from "@/lib/api/users";
import { UserPlus, Eye, EyeOff, Loader2, Shield } from "lucide-react";

const ADMIN_ROLES: Exclude<UserRole, "TENANT">[] = ["OWNER", "ADMIN", "COBRADOR"];

const ROLE_DESCRIPTIONS: Record<string, string> = {
  OWNER:    "Full access to all modules and settings",
  ADMIN:    "Manage properties, tenants, and payments",
  COBRADOR: "View and record payments only",
};

const EMPTY: CreateUserPayload = {
  name: "",
  email: "",
  password: "",
  role: "ADMIN",
};

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreateUserDialog = ({ open, onClose }: CreateUserDialogProps) => {
  const [form, setForm] = useState<CreateUserPayload>(EMPTY);
  const [errors, setErrors] = useState<Partial<CreateUserPayload>>({});
  const [showPassword, setShowPassword] = useState(false);
  const createUser = useCreateUser();

  const handleClose = () => {
    setForm(EMPTY);
    setErrors({});
    setShowPassword(false);
    onClose();
  };

  const validate = (): boolean => {
    const e: Partial<CreateUserPayload> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.password || form.password.length < 8) e.password = "Minimum 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    await createUser.mutateAsync(form);
    handleClose();
  };

  const isPending = createUser.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* Header */}
        <DialogHeader className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base">Add Team Member</DialogTitle>
              <DialogDescription className="text-xs">
                Create a new user account with system access
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="space-y-6 px-6 py-6">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Identity
            </h3>

            <FormField label="Full Name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                disabled={isPending}
                autoFocus
              />
            </FormField>

            <FormField label="Email Address" required error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="john@newellhomes.com"
                disabled={isPending}
              />
            </FormField>

            <FormField label="Temporary Password" required error={errors.password}>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className="pr-10"
                  disabled={isPending}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </FormField>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Access Level
            </h3>

            <FormField label="Role" required>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, role: v as Exclude<UserRole, "TENANT"> }))
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Role description card */}
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ROLE_DESCRIPTIONS[form.role]}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border px-6 py-4 gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Creating…" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
