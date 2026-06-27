export type FaqItem = { q: string; a: string };
export type FaqCategory = { title: string; items: FaqItem[] };

export const faqCategories: FaqCategory[] = [
  {
    title: "Booking & Payment",
    items: [
      { q: "How do I book a tour?", a: "Browse our tours, pick your date and guest count, and complete payment online. You'll receive an instant confirmation email with your booking reference." },
      { q: "What payment methods do you accept?", a: "We accept all major credit and debit cards via Stripe. Payment is processed securely at the time of booking." },
      { q: "Can I pay with a gift voucher?", a: "Yes! Enter your gift voucher code at checkout to apply the balance towards your booking." },
      { q: "Is my booking confirmed immediately?", a: "Yes. Once payment is processed you'll receive an instant confirmation email with your booking reference (KJ-XXXXXX)." },
      { q: "Do you charge booking fees?", a: "No. The price you see is the price you pay — no hidden booking fees." },
    ],
  },
  {
    title: "Cancellations & Changes",
    items: [
      { q: "What is your cancellation policy?", a: "Full refund if cancelled more than 72 hours before departure. 50% refund with 24–72 hours' notice. No refund within 24 hours of departure." },
      { q: "Can I reschedule my booking?", a: "Yes — you can change your tour date up to 48 hours before departure from your account page, subject to availability on the new date." },
      { q: "What if the tour is cancelled due to weather?", a: "Safety is our priority. In the rare event we cancel due to severe weather, you'll receive a full refund or the option to reschedule at no charge." },
      { q: "How do I cancel my booking?", a: "Log in to your account, open your booking, and click 'Request cancellation'. Our team will confirm your refund by email within one business day." },
    ],
  },
  {
    title: "The Tour Experience",
    items: [
      { q: "How many people are on each tour?", a: "Our tours have a maximum of 12–16 guests, keeping the experience intimate and personal." },
      { q: "What should I wear and bring?", a: "Comfortable, layered clothing for the weather, closed-toe shoes, sunscreen, hat, water and snacks, camera, and any personal medications." },
      { q: "Are meals included?", a: "Meals are not included unless stated in the tour description. We stop at excellent local cafés and eateries along the way." },
      { q: "Where does the tour depart from?", a: "Exact pickup locations and meeting points are in your booking confirmation email and your 7-day reminder. Most tours depart from central Christchurch." },
      { q: "Do you offer hotel pickups?", a: "Many tours include hotel pickup in central Christchurch. Add your accommodation in the 'Notes' field at checkout and we'll confirm by email." },
    ],
  },
  {
    title: "Accessibility & Special Requirements",
    items: [
      { q: "Are the tours suitable for children?", a: "Most tours welcome all ages. Check the 'Age Range' field on each tour page for requirements. Children under 5 are generally free of charge — contact us to arrange." },
      { q: "Are the tours wheelchair accessible?", a: "Some tours involve walking on uneven terrain. Please contact us before booking and we'll advise the most suitable option for your needs." },
      { q: "I have dietary requirements — is that ok?", a: "Absolutely. Note your requirements in the 'Special notes' field at checkout and we'll do our best to accommodate you." },
    ],
  },
  {
    title: "Private & Group Tours",
    items: [
      { q: "Can I book a private tour for my group?", a: "Yes! We specialise in bespoke private tours for families, couples, and corporate groups. Use our Private Tour inquiry form to get a tailored quote." },
      { q: "Do you offer group discounts?", a: "Group rates are available for private bookings. Get in touch with your group size and preferred dates for a custom quote." },
      { q: "Can I organise a cruise shore excursion?", a: "Yes — we offer port-timed tours designed to get you ashore, exploring, and back to the ship without stress. See our Cruise Excursions page for details." },
    ],
  },
];
