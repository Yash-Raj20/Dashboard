"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

type SubAdmin = {
  id: number;
  name: string;
};

interface AssignProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  subAdmins: SubAdmin[];
  onAssign: (subAdminId: number) => void;
}

export default function AssignProblemModal({
  isOpen,
  onClose,
  onAssign,
}: AssignProblemModalProps) {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [subAdminsLoading, setSubAdminsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSubAdmins = async () => {
      setSubAdminsLoading(true);
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch("/api/sub-admins", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) alert("Unauthorized. Please login.");
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setSubAdmins(Array.isArray(data) ? data : data.subAdmins || []);
      } catch (err) {
        console.error("Error fetching sub-admins:", err);
        setSubAdmins([]);
      } finally {
        setSubAdminsLoading(false);
      }
    };

    fetchSubAdmins();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-full space-y-4">
        <DialogHeader>
          <DialogTitle>Assign Problem</DialogTitle>
          <DialogDescription>
            Select a sub-admin to assign this problem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {subAdminsLoading ? (
            <div className="text-center p-4">Loading sub-admins...</div>
          ) : !Array.isArray(subAdmins) || subAdmins.length === 0 ? (
            <div className="text-center text-muted-foreground p-4 border rounded-md">
              No sub-admins available.
            </div>
          ) : (
            subAdmins.map((subAdmin) => (
              <div
                key={subAdmin.id}
                className="flex justify-between items-center p-2 border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span>{subAdmin.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAssign(subAdmin.id)}
                >
                  Assign
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
