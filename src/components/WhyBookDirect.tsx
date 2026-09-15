const reasons = [
  {
    title: "Book with your tour operator",
    body: "See tour prices, choose your departure, and arrange your trip directly with the team running it.",
  },
  {
    title: "Local guides, local knowledge",
    body: "Every guide lives in the region they show you. No scripts — just genuine insider stories, shortcuts and hidden spots.",
  },
  {
    title: "Guaranteed small groups",
    body: "We cap every departure at 16 guests. You'll never be one face in a 50-seat coach.",
  },
  {
    title: "Direct support",
    body: "Questions before, during or after? You reach us directly — not a call centre. We respond within one business day.",
  },
  {
    title: "Travel with care",
    body: "We travel with care for the land, sea and communities we visit. Your booking supports local family businesses.",
  },
  {
    title: "Free cancellation",
    body: "Plans change. Cancel up to 48 hours before departure for a full refund — no questions asked.",
  },
];

export function WhyBookDirect() {
  return (
    <section className="bg-brand-900 py-16 sm:py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <p className="eyebrow text-sand-400">Why book direct?</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold">
            Your trip, with a local team
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100/80">
            Choose your day out and talk directly with our team about dates, pickup, and the details that matter to you.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="rounded-2xl border border-brand-700/50 bg-brand-800/60 p-6">
              <h3 className="font-serif text-lg font-semibold text-white">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-100/75">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
