import Image from "next/image";

/** Arch-topped image frame — a signature organic motif. */
export function ArchImage({
  src,
  alt,
  className = "",
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[999px_999px_2rem_2rem] bg-brand-100 ${className}`}>
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes ?? "(max-width:768px) 100vw, 50vw"} className="object-cover" />
    </div>
  );
}
