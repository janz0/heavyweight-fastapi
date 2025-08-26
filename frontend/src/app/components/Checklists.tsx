// app/locations/components/AddChecklistButton.tsx
"use client";

import { Button } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { createChecklist } from "@/services/checklists";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddChecklistButton({
  locationId,
  templateId,
}: { locationId: string; templateId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    try {
      setLoading(true);
      await createChecklist({ location_id: locationId, template_id: templateId });
      toaster.create({
        description: "Checklist created successfully",
        type: "success",
      });
      router.refresh(); // refresh to show the new checklist
    } catch (err) {
      toaster.create({
        description: `Failed to create checklist: ${(err as Error).message}`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      colorScheme="blue"
      onClick={handleClick}
      loading={loading}
    >
      Add Checklist
    </Button>
  );
}
