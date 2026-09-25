import Image from "next/image";
import styles from "./PageHero.module.css";

export function PageHero({
  title,
  subtitle,
  eyebrow,
  image = "/images/general/arthurs-pass-landscape.jpg",
  caption = "South Island, New Zealand",
  compact = false,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  image?: string;
  caption?: string;
  /** Listing pages: keep the first results within the first phone screen. */
  compact?: boolean;
}) {
  return (
    <section className={compact ? `${styles.hero} ${styles.compact}` : styles.hero} aria-labelledby="page-heading">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.top}>{eyebrow || "South Island / New Zealand"}</p>
          <div className={styles.body}>
            <h1 id="page-heading" className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <p className={styles.foot}>Kiwi Globe Tours · Christchurch</p>
        </div>
        <div className={styles.media}>
          <Image src={image} alt="" fill priority sizes="(max-width: 800px) 100vw, 58vw" className={styles.image} />
          <span className={styles.caption}>{caption}</span>
        </div>
      </div>
    </section>
  );
}
