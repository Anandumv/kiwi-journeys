import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteSettings } from "@/lib/content";

// Render public pages dynamically so admin/CMS edits appear immediately.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:bg-white focus:px-5 focus:py-3 focus:text-foreground">Skip to content</a>
      <Header name={s.name} logoImage={s.logoImage} nav={s.nav} phone={s.phone} phoneHref={s.phoneHref} />
      <main id="main-content" tabIndex={-1} className="flex-1 pt-16">{children}</main>
      <Footer
        name={s.name}
        logoImage={s.logoImage}
        footerTagline={s.footerTagline}
        tagline={s.tagline}
        phone={s.phone}
        phoneHref={s.phoneHref}
        email={s.email}
        address={s.address}
        social={s.social as Record<string, string>}
      />
    </div>
  );
}
