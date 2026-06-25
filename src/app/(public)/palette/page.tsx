/* Temporary palette preview — remove before launch. Shows the existing
   sage/clay/cream scheme plus the new gold / eucalyptus / pine / stone accents. */

// Keep this internal preview out of search results.
export const metadata = { robots: { index: false, follow: false } };

type Sw = { name: string; cls: string; hex: string; ink?: boolean };

const groups: { title: string; note: string; swatches: Sw[] }[] = [
  {
    title: "Sage — primary (brand)",
    note: "Existing. Backgrounds, headings, primary surfaces.",
    swatches: [
      { name: "brand-50", cls: "bg-brand-50", hex: "#eef1e9", ink: true },
      { name: "brand-100", cls: "bg-brand-100", hex: "#dde3d3", ink: true },
      { name: "brand-300", cls: "bg-brand-300", hex: "#a3b18d", ink: true },
      { name: "brand-500", cls: "bg-brand-500", hex: "#6f7f60" },
      { name: "brand-700", cls: "bg-brand-700", hex: "#47543d" },
      { name: "brand-900", cls: "bg-brand-900", hex: "#2c3826" },
    ],
  },
  {
    title: "Clay / terracotta (sand)",
    note: "Existing accent + new deep rust for hovers.",
    swatches: [
      { name: "sand-400", cls: "bg-sand-400", hex: "#dba37a", ink: true },
      { name: "sand-500", cls: "bg-sand-500", hex: "#c2774a" },
      { name: "sand-600", cls: "bg-sand-600", hex: "#a65f37" },
      { name: "sand-700 ✦new", cls: "bg-sand-700", hex: "#9c4a2f" },
    ],
  },
  {
    title: "Honey gold ✦ new",
    note: "Ratings, badges, premium highlights.",
    swatches: [
      { name: "gold-300", cls: "bg-gold-300", hex: "#e0c373", ink: true },
      { name: "gold-400", cls: "bg-gold-400", hex: "#cfa94f", ink: true },
      { name: "gold-500", cls: "bg-gold-500", hex: "#c9a14a", ink: true },
      { name: "gold-600", cls: "bg-gold-600", hex: "#a9842f" },
    ],
  },
  {
    title: "Eucalyptus ✦ new",
    note: "Cool accent for links / info states.",
    swatches: [
      { name: "teal-400", cls: "bg-teal-400", hex: "#7fa093", ink: true },
      { name: "teal-500", cls: "bg-teal-500", hex: "#5f8076" },
      { name: "teal-600", cls: "bg-teal-600", hex: "#4c685f" },
    ],
  },
  {
    title: "Pine + stone ✦ new",
    note: "Deep footer green + warm neutral surfaces/borders.",
    swatches: [
      { name: "pine-700", cls: "bg-pine-700", hex: "#26352a" },
      { name: "pine-900", cls: "bg-pine-900", hex: "#18221a" },
      { name: "stone-300", cls: "bg-stone-300", hex: "#cabfa8", ink: true },
      { name: "stone-400", cls: "bg-stone-400", hex: "#b9ac95", ink: true },
      { name: "stone-500", cls: "bg-stone-500", hex: "#9c8f78" },
    ],
  },
];

export default function PalettePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="eyebrow text-sand-600">Brand colour study</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-brand-900 sm:text-5xl">
        Palette &amp; matching accents
      </h1>
      <p className="mt-3 max-w-2xl text-foreground/70">
        Your sage + clay + cream base with proposed gold, eucalyptus, pine and stone accents.
        Scroll down for sample components using them.
      </p>

      {/* Swatches */}
      <div className="mt-10 space-y-10">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="font-serif text-xl font-semibold text-brand-900">{g.title}</h2>
            <p className="text-sm text-foreground/55">{g.note}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {g.swatches.map((s) => (
                <div key={s.name} className="overflow-hidden rounded-2xl border border-ivory-200 bg-white shadow-sm">
                  <div className={`flex h-24 items-end p-3 ${s.cls} ${s.ink ? "text-brand-900" : "text-white"}`}>
                    <span className="text-xs font-semibold">{s.name}</span>
                  </div>
                  <div className="px-3 py-2 text-xs text-foreground/60">{s.hex}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Sample components */}
      <section className="mt-16">
        <h2 className="font-serif text-2xl font-semibold text-brand-900">In context</h2>

        {/* Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="rounded-full bg-sand-500 px-6 py-3 font-semibold text-white transition hover:bg-sand-700">
            Book now (clay → rust hover)
          </button>
          <button className="rounded-full bg-brand-700 px-6 py-3 font-semibold text-white transition hover:bg-brand-900">
            Secondary (sage)
          </button>
          <button className="rounded-full bg-gold-500 px-6 py-3 font-semibold text-brand-900 transition hover:bg-gold-600 hover:text-white">
            Premium (gold)
          </button>
          <a className="font-semibold text-teal-600 underline-offset-4 hover:underline" href="#">
            A eucalyptus link →
          </a>
        </div>

        {/* Badges + rating */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gold-300 px-3 py-1 text-xs font-semibold text-brand-900">Best seller</span>
          <span className="rounded-full bg-teal-400 px-3 py-1 text-xs font-semibold text-white">Small group</span>
          <span className="rounded-full border border-stone-400 bg-stone-300/40 px-3 py-1 text-xs font-semibold text-brand-800">
            Year-round
          </span>
          <span className="text-gold-500">★★★★★</span>
        </div>

        {/* Mini card */}
        <div className="mt-8 max-w-sm overflow-hidden rounded-3xl border border-stone-300 bg-white shadow-sm">
          <div className="flex h-40 items-end bg-brand-300 p-4">
            <span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-brand-900">Featured</span>
          </div>
          <div className="p-5">
            <h3 className="font-serif text-lg font-semibold text-brand-900">Akaroa Scenic Day Tour</h3>
            <p className="mt-1 text-sm text-foreground/60">Small-group · 6 hours · year-round</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="text-gold-500">★★★★★</span>
                <span className="ml-1 text-xs text-foreground/50">4.9</span>
              </div>
              <div className="font-serif text-lg font-semibold text-brand-700">from NZ$189</div>
            </div>
            <button className="mt-4 w-full rounded-full bg-sand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-sand-700">
              Check availability
            </button>
          </div>
        </div>

        {/* Pine footer band */}
        <div className="mt-10 rounded-3xl bg-pine-700 px-8 py-12 text-center text-white">
          <h3 className="font-serif text-2xl font-semibold">Deep pine band</h3>
          <p className="mx-auto mt-2 max-w-md text-white/70">
            A darker green than the sage footer — pairs with gold and cream for contrast sections.
          </p>
          <button className="mt-5 rounded-full bg-gold-500 px-6 py-3 font-semibold text-brand-900 hover:bg-gold-600 hover:text-white">
            Explore tours
          </button>
        </div>
      </section>
    </div>
  );
}
