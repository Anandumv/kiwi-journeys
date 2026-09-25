import Link from "next/link";
import { TaskShell } from "@/components/TaskShell";

export default function NotFound() {
  return (
    <TaskShell eyebrow="404 · Page not found" title="Off the map" intro="That page doesn&apos;t exist or has moved. These will get you back on the road.">
      <ul className="border-t border-[#202b2626]">
        {[["/tours", "All day tours"], ["/destinations", "Destinations"], ["/private-tours", "Private tours"], ["/contact", "Contact us"]].map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="group flex items-center justify-between border-b border-[#202b2626] py-4 text-xl font-medium tracking-[-.02em] text-foreground">
              {label}<span aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
            </Link>
          </li>
        ))}
      </ul>
    </TaskShell>
  );
}
