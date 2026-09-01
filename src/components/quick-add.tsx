"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Input,
  Label,
  Modal,
  ModalContent,
  ModalTrigger,
} from "@/components/ui/form";
import { createTransactionAction } from "@/server/actions";

export function QuickAdd({
  categories,
}: {
  categories?: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add money movement
        </Button>
      </ModalTrigger>
      <QuickAddForm
        categories={categories ?? []}
        onDone={() => {
          setOpen(false);
          toast.success("Saved.");
        }}
      />
    </Modal>
  );
}

function QuickAddForm({
  categories,
  onDone,
}: {
  categories: { id: string; name: string }[];
  onDone: () => void;
}) {
  return (
    <ModalContent title="Add a money movement">
      <form
        className="space-y-4"
        action={async (formData) => {
          const result = await createTransactionAction(formData);
          if (result?.error) toast.error(result.error);
          else onDone();
        }}
      >
        <div>
          <Label htmlFor="type">What happened?</Label>
          <select
            id="type"
            name="type"
            className="border-input bg-card h-12 w-full rounded-full border px-5"
          >
            <option value="EXPENSE">Money went out</option>
            <option value="INCOME">Money came in</option>
            <option value="TRANSFER">Moved between accounts</option>
          </select>
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="42.50"
            required
          />
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </div>
        <div>
          <Label htmlFor="merchant">Who or where?</Label>
          <Input id="merchant" name="merchant" placeholder="Harbor Grocer" />
        </div>
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            className="border-input bg-card h-12 w-full rounded-full border px-5"
          >
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="visibility">Visibility</Label>
          <select
            id="visibility"
            name="visibility"
            className="border-input bg-card h-12 w-full rounded-full border px-5"
          >
            <option value="SHARED">Shared with household</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>
        <Button type="submit" className="w-full">
          Save
        </Button>
      </form>
    </ModalContent>
  );
}
