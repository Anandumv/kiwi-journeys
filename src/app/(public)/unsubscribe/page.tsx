import type { Metadata } from "next";
import UnsubscribeClient from "./client";

export const metadata: Metadata = { title: "Unsubscribe" };

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  return <UnsubscribeClient e={e ?? ""} />;
}
