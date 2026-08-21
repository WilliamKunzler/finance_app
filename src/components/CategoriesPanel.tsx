"use client";

import { useState } from "react";
import { CategoryForm } from "@/components/CategoryForm";
import { CategoryList } from "@/components/CategoryList";
import type { TransactionType } from "@/generated/prisma/enums";

type Category = { id: string; name: string; type: TransactionType; color: string };

export function CategoriesPanel({ categories }: { categories: Category[] }) {
  const [type, setType] = useState<TransactionType>("EXPENSE");

  return (
    <>
      <CategoryForm type={type} onTypeChange={setType} />
      <CategoryList categories={categories} filter={type} />
    </>
  );
}
