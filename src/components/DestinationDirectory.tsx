"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./HomeEditorial.module.css";

type Place = { slug: string; name: string; blurb: string; image: string; caption: string };

// The photo beside the list follows the destination under the pointer or focus.
// Server HTML shows the first photo, so the section is complete without JavaScript.
export function DestinationDirectory({ places }: { places: Place[] }) {
  const [active, setActive] = useState(0);
  const current = places[active] ?? places[0];
  return (
    <>
      <div className={styles.destinationIntro}>
        <p className={styles.label}>02 / The places</p>
        <h2 id="destination-heading">Our corner<br />of the world.</h2>
        {current && <figure className={styles.destinationFigure}>
          <div className={styles.destinationPhoto}>
            {places.map((p, i) => (
              <Image key={p.slug} src={p.image} alt={i === active ? p.caption : ""} fill sizes="(max-width: 760px) 100vw, 33vw"
                className={`${styles.cover} ${styles.destinationSwap} ${i === active ? styles.destinationSwapOn : ""}`} />
            ))}
          </div>
          <figcaption aria-live="polite">{current.caption} / South Island, New Zealand</figcaption>
        </figure>}
      </div>
      <div className={styles.destinationList}>
        <p>Pick a place. We’ll take you there.</p>
        {places.map((d, i) => <Link key={d.slug} href={`/destinations/${d.slug}`}
          onPointerEnter={() => setActive(i)} onFocus={() => setActive(i)}
          data-active={i === active || undefined}>
          <span className={styles.destinationNumber}>{String(i + 1).padStart(2, "0")}</span>
          <div><h3>{d.name}</h3><p>{d.blurb}</p></div><span aria-hidden="true">↗</span>
        </Link>)}
        <Link href="/destinations" className={styles.allDestinations}>Explore all destinations ↗</Link>
      </div>
    </>
  );
}
