import Link from "next/link";
import Image from "next/image";

/** Custom koru-frond-in-an-arch mark + Fraunces wordmark. Honors logoImage override. */
export function Logo({
  name,
  logoImage,
  className = "",
  light = false,
}: {
  name: string;
  logoImage?: string | null;
  className?: string;
  light?: boolean;
}) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label={name}>
      {logoImage ? (
        <Image src={logoImage} alt={name} width={160} height={42} className="h-9 w-auto object-contain" />
      ) : (
        <>
          <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden className="shrink-0">
            {/* arch */}
            <path
              d="M6 35V20a14 14 0 0 1 28 0v15"
              className={light ? "stroke-white" : "stroke-brand-700"}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* koru frond spiral */}
            <path
              d="M20 34c0-7 1.5-12 6.5-13.5C31 19.2 31 25 27 25.4c-2.6.3-3.2-2.6-1.2-3.4"
              className={light ? "stroke-white" : "stroke-sand-500"}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="13.5" cy="22" r="1.7" className={light ? "fill-white/80" : "fill-brand-500"} />
          </svg>
          <span className={`font-serif text-xl font-semibold tracking-tight ${light ? "text-white" : "text-brand-900"}`}>
            {name}
          </span>
        </>
      )}
    </Link>
  );
}
