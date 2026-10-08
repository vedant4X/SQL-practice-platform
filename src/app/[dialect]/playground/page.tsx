"use client";

import React, { use } from "react";
import ArcadePlayground from "@/components/playground/ArcadePlayground";
import { Dialect } from "@/lib/engine/types";

export default function DialectPlaygroundPage({
  params,
}: {
  params: Promise<{ dialect: string }>;
}) {
  const resolvedParams = use(params);
  const dialect: Dialect = resolvedParams.dialect === "mysql" ? "mysql" : "postgresql";

  return <ArcadePlayground initialDialect={dialect} />;
}
