import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteSettings } from "@/lib/content";

// Render public pages dynamically so admin/CMS edits appear immediately.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <Header name={s.name} logoImage={s.logoImage} nav={s.nav} phone={s.phone} phoneHref={s.phoneHref} />
      <main className="flex-1 pt-16">{children}</main>
      <Footer
        name={s.name}
        logoImage={s.logoImage}
        footerTagline={s.footerTagline}
        tagline={s.tagline}
        phone={s.phone}
        phoneHref={s.phoneHref}
        email={s.email}
        address={s.address}
      />
    </div>
  );
}
