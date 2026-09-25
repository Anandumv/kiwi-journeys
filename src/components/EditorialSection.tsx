import styles from "./EditorialSection.module.css";

export { styles as editorial };

export function EditorialSection({ number, label, title, id, children }: {
  number: number;
  label: string;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${styles.section} sd-rise`} aria-labelledby={id}>
      <p className={styles.label}><b>{String(number).padStart(2, "0")}</b>{label}</p>
      <div>
        <h2 id={id} className={styles.heading}>{title}</h2>
        {children}
      </div>
    </section>
  );
}
