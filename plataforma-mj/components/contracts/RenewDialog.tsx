"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/FormField";
import { useRenewContract } from "@/hooks/useContracts";
import type { Contract } from "@/lib/types";
import { format } from "date-fns";

interface RenewDialogProps {
  open: boolean;
  onClose: () => void;
  contract: Contract;
}

export const RenewDialog = ({ open, onClose, contract }: RenewDialogProps) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(today);
  const [durationYears, setDurationYears] = useState(1);
  const [notes, setNotes] = useState("");

  const renew = useRenewContract();

  const handleSubmit = async () => {
    await renew.mutateAsync({
      id: contract.id,
      body: { startDate, durationYears, notes: notes || undefined },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renew Contract</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md bg-muted/40 px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Renewing contract #{contract.renewalNumber} expiring on{" "}
              <span className="font-medium text-foreground">
                {format(new Date(contract.endDate), "MMM d, yyyy")}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="New Start Date" required>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={renew.isPending}
              />
            </FormField>
            <FormField label="Duration (years)" required>
              <Input
                type="number"
                min="1"
                max="10"
                value={durationYears}
                onChange={(e) => setDurationYears(parseInt(e.target.value) || 1)}
                disabled={renew.isPending}
              />
            </FormField>
          </div>

          <FormField label="Notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional renewal notes"
              disabled={renew.isPending}
            />
          </FormField>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={renew.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={renew.isPending}>
            {renew.isPending ? "Renewing…" : "Renew Contract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
