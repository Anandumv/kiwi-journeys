import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ToursExplorer } from "@/components/ToursExplorer";
import { getTours } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tours",
  description: "Browse our full range of New Zealand day tours and book online.",
};

export default async function ToursPage() {
  const tours = await getTours();
  return (
    <>
      <PageHero
        eyebrow="Exciting Experiences"
        title="Our Tours"
        subtitle="Small-group days out across the South Island — pick a date and book online in minutes."
        image="/images/general/queenstown-aerial.jpg"
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Suspense fallback={<p className="text-foreground/60">Loading tours…</p>}>
          <ToursExplorer tours={tours} />
        </Suspense>
      </div>
    </>
  );
}
