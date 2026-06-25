import { Suspense } from "react";
import { ProcessingClient } from "@/components/ProcessingClient";

export const metadata = { title: "Processing your booking" };

export default function ProcessingPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <Suspense fallback={null}>
        <ProcessingClient />
      </Suspense>
    </div>
  );
}
