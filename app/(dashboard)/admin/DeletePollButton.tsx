"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";
import { useRouter } from "next/navigation";

interface DeletePollButtonProps {
  pollId: string;
}

export function DeletePollButton({ pollId }: DeletePollButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePoll(pollId);
      
      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        // Refresh the page to show updated data
        router.refresh();
      }
    } catch (error) {
      alert('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
}