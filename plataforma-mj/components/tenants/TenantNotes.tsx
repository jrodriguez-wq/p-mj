"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantNotes, useAddTenantNote } from "@/hooks/useTenants";
import { format } from "date-fns";

interface TenantNotesProps {
  tenantId: string;
}

export const TenantNotes = ({ tenantId }: TenantNotesProps) => {
  const [content, setContent] = useState("");
  const { data: notes, isLoading } = useTenantNotes(tenantId);
  const addNote = useAddTenantNote(tenantId);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    await addNote.mutateAsync(trimmed);
    setContent("");
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Internal Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note */}
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add internal note… (not visible to tenant)"
            rows={2}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
            disabled={addNote.isPending}
          />
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || addNote.isPending}
            size="icon"
            className="h-auto self-end"
            aria-label="Add note"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Notes list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : notes?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes?.map((note) => (
              <li
                key={note.id}
                className="rounded-md border border-border bg-muted/30 p-3 text-sm"
              >
                <p className="text-foreground leading-relaxed">{note.content}</p>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium">{note.authorName}</span>
                  <span>·</span>
                  <span>{format(new Date(note.createdAt), "MMM d, yyyy HH:mm")}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
