"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { useUsers, useDeactivateUser } from "@/hooks/useUsers";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import type { UserProfile } from "@/lib/types";

const ROLE_BADGE: Record<string, string> = {
  OWNER:    "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ADMIN:    "bg-blue-500/10 text-blue-500 border-blue-500/20",
  COBRADOR: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const deactivate = useDeactivateUser();
  const currentUser = useAuthStore((s) => s.user);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (currentUser?.role !== "OWNER" && currentUser?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center p-20 text-muted-foreground text-sm">
        Access restricted to Owner and Admin roles.
      </div>
    );
  }

  const activeCount = users?.filter((u) => u.isActive).length ?? 0;

  const columns: Column<UserProfile>[] = [
    {
      key: "user",
      header: "User",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
              {getInitials(u.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{u.name}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (u) => (
        <Badge variant="outline" className={`text-xs font-medium ${ROLE_BADGE[u.role] ?? ""}`}>
          {u.role}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => (
        <Badge
          variant="outline"
          className={
            u.isActive
              ? "text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "text-xs bg-muted/50 text-muted-foreground border-border"
          }
        >
          {u.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      cell: (u) => (
        <span className="text-xs text-muted-foreground">
          {u.lastLoginAt ? format(new Date(u.lastLoginAt), "MMM d, yyyy") : "Never"}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (u) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(u.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      cell: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="User actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {u.isActive && u.id !== currentUser?.profileId && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  if (confirm(`Deactivate "${u.name}"? They will lose access to the system.`)) {
                    deactivate.mutate(u.id);
                  }
                }}
              >
                <UserX className="mr-2 h-3.5 w-3.5" />
                Deactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-5 p-6 md:p-8">
      <PageHeader
        title="Team"
        description={`${activeCount} active member${activeCount !== 1 ? "s" : ""}`}
        actions={
          currentUser?.role === "OWNER" && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Member
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={(users ?? []).filter((u) => u.role !== "TENANT")}
        loading={isLoading}
        keyExtractor={(u) => u.id}
        emptyMessage="No team members found."
      />

      <CreateUserDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
