import Image from "next/image";

export function PageHero({
  title,
  subtitle,
  eyebrow,
  image = "/images/general/arthurs-pass-landscape.jpg",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  image?: string;
}) {
  return (
    <section className="relative isolate -mt-16 flex min-h-[52vh] items-end overflow-hidden">
      <Image src={image} alt="" fill priority className="-z-10 object-cover" />
      <div className="-z-10 absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/45 to-brand-950/30" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-28 sm:px-6">
        {eyebrow && <p className="eyebrow text-sand-400">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold text-white text-balance sm:text-6xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-brand-100/90">{subtitle}</p>}
      </div>
    </section>
  );
}
