// ─────────────────────────────────────────────────────────────────────────────
// TOUR CONTENT — source of truth for marketing/detail pages AND DB seeding.
// Content adapted from scraped reference; each tour's text/images are isolated
// here so any item can be swapped for original copy / your own licensed photos.
// Prices are in NZD cents (integer). seatsPerUnit = seats consumed per quantity.
// departureTimes are local Pacific/Auckland "HH:mm"; weekdays 1=Mon..7=Sun.
// ─────────────────────────────────────────────────────────────────────────────

export type PriceOption = {
  key: string;
  label: string;
  priceCents: number;
  seatsPerUnit: number;
  note?: string;
};

export type Tour = {
  slug: string;
  code: string;
  title: string;
  destination: string;
  category: "iconic-day-trips" | "wildlife" | "adventure" | "wine-food";
  durationLabel: string;
  durationMins: number;
  ageRange: string;
  startEnd: string;
  pickup: string;
  summary: string;
  priceFromCents: number;
  heroImage: string;
  gallery: string[];
  highlights: string[];
  itinerary: string[];
  included: string[];
  optionalUpgrades?: string[];
  importantInfo?: string[];
  priceOptions: PriceOption[];
  // Departure schedule used to generate Session rows.
  departureTimes: string[];
  departureWeekdays: number[]; // 1=Mon ... 7=Sun
  capacityPerDeparture: number;
  // Months (1-12) the tour does NOT operate (e.g. seasonal dolphin swims).
  closedMonths?: number[];
  featured?: boolean;
};

const img = (slug: string, file: string) => `/images/tours/${slug}/${file}`;

export const tours: Tour[] = [
  {
    slug: "christchurch-city-sightseeing",
    code: "LT19",
    title: "Christchurch City Sightseeing",
    destination: "Christchurch",
    category: "iconic-day-trips",
    durationLabel: "Half Day",
    durationMins: 240,
    ageRange: "All Ages",
    startEnd: "Christchurch → Christchurch",
    pickup: "Morning or afternoon departure from your hotel",
    summary:
      "An easy half-day lap of the Garden City — heritage streets and bold rebuild architecture, the riverside gardens at Mona Vale, sea air at Sumner, and a hilltop lookout that runs from the plains to the Alps.",
    priceFromCents: 10500,
    heroImage: "/images/brand/Christchurch-Tram.jpg",
    gallery: [
      "/images/brand/Christchurch-Tram.jpg",
      ...[
        "7395a4_d7783ce525344652952b15791d55ce9f-mv2_1.jpg",
        "7395a4_a8d751ada63d4fce9e43d9f9a3a240ca-mv2_1.jpg",
        "7395a4_2cd55979bd624834882cf8caa4f09392-mv2_1.jpg",
        "7395a4_a8f740b4a88b4e619592b9ba71877df9-mv2_1.jpg",
      ].map((f) => img("christchurch-city-sightseeing", f)),
    ],
    highlights: [
      "A guided loop past Christchurch's heritage façades and inventive post-quake design",
      "Quiet garden paths and waterways at the Mona Vale estate",
      "Ocean air and a beach stop in the seaside suburb of Sumner",
      "The wide hilltop lookout at the Sign of the Takahe — plains to mountains",
    ],
    itinerary: [
      "Pick a morning or afternoon start and settle in for an unhurried lap of the Garden City — a gentle way to read a place that wears both its history and its rebuild with pride.",
      "Roll through the central city with commentary as restored heritage buildings meet the bold architecture that grew out of the 2010–11 earthquakes.",
      "Pause at Mona Vale, a riverside heritage estate, for a slow wander through its gardens and lawns, then trace the regenerating Ōtākaro / Avon River corridor.",
      "Carry on to the coast at Sumner for sea air and ocean views before the sweeping hilltop panorama at the Sign of the Takahe. We finish with a drop-off back at your door.",
    ],
    included: ["Driver / Guide", "Hotel pickup and drop-off", "Guided commentary"],
    priceOptions: [
      { key: "adult", label: "Adult", priceCents: 10500, seatsPerUnit: 1 },
      { key: "child", label: "Child (5–14)", priceCents: 6500, seatsPerUnit: 1 },
    ],
    departureTimes: ["09:00", "13:30"],
    departureWeekdays: [1, 2, 3, 4, 5, 6, 7],
    capacityPerDeparture: 16,
    featured: true,
  },
  {
    slug: "christchurch-antarctic-centre",
    code: "LT19IAH",
    title: "Christchurch Sightseeing Tour with Antarctic Centre",
    destination: "Christchurch",
    category: "iconic-day-trips",
    durationLabel: "1 Day",
    durationMins: 420,
    ageRange: "All Ages",
    startEnd: "Christchurch → Christchurch",
    pickup: "Pick up from your central city accommodation between 8:30–9:00am",
    summary:
      "Our city loop paired with an afternoon at the International Antarctic Centre — hands-on exhibits, a simulated polar storm, a ride aboard a Hägglund all-terrain vehicle and the resident husky pack.",
    priceFromCents: 18500,
    heroImage: img("christchurch-antarctic-centre", "7395a4_04000ab4dbb84261878ebb61fc3398f1-mv2_3.jpg"),
    gallery: [
      "7395a4_04000ab4dbb84261878ebb61fc3398f1-mv2_3.jpg",
      "7395a4_d1bbe8b60ff147f493039aeb0a7fefa2-mv2_2.jpg",
      "7395a4_dae6c4c3da0f4cc6966b7f8d84ad45dc-mv2_1.jpg",
      "7395a4_f6c94a10993342de90f8f9a6d74baa51-mv2_2.jpg",
      "7395a4_d5f661f1f87a4a88abaf6cf288a3af09-mv2_3.jpg",
    ].map((f) => img("christchurch-antarctic-centre", f)),
    highlights: [
      "The story of the city's earthquakes and its remarkable rebuild, told on the ground",
      "A garden wander at the Mona Vale estate",
      "A hilltop lookout from the Sign of the Takahe",
      "Hands-on Antarctic exhibits and a chilling simulated polar storm",
      "A Hägglund ride over the test track, plus the husky pack and little penguins",
    ],
    itinerary: [
      "We collect you from your central-city stay between 8:30 and 9:00am and ease into a guided drive where heritage frontages sit beside the architecture that followed the quakes.",
      "Step out at Mona Vale, a riverside heritage estate, for an unhurried look around its gardens and grounds.",
      "Follow the regenerating Ōtākaro / Avon River corridor — once a residential red zone, now open parkland — while your guide unpacks what happened here and what came next.",
      "Take in the coast at Sumner, then the long view across the Canterbury Plains to the Southern Alps from the Sign of the Takahe.",
      "We finish at the International Antarctic Centre, where you explore at your own pace — the exhibits, the storm room, the Hägglund ride and the husky zone.",
    ],
    included: ["Driver / Guide", "Hotel pickup", "Antarctic Centre entry and Hägglund ride"],
    priceOptions: [
      { key: "adult", label: "Adult", priceCents: 18500, seatsPerUnit: 1 },
      { key: "child", label: "Child (5–14)", priceCents: 12500, seatsPerUnit: 1 },
    ],
    departureTimes: ["08:45"],
    departureWeekdays: [1, 2, 3, 4, 5, 6, 7],
    capacityPerDeparture: 16,
    featured: true,
  },
  {
    slug: "hanmer-springs-day-tour",
    code: "LT04",
    title: "Hanmer Springs Day Tour",
    destination: "Hanmer Springs",
    category: "iconic-day-trips",
    durationLabel: "1 Day",
    durationMins: 540,
    ageRange: "6 – 60 years",
    startEnd: "Christchurch → Christchurch",
    pickup: "Pick up from your central city accommodation between 8:00–8:45am",
    summary:
      "A drive up through Canterbury's farmland to the mountain village of Hanmer Springs — long soaks in the thermal pools, a relaxed lunch, and the option to add a jet boat blast through the Waiau Gorge.",
    priceFromCents: 34500,
    heroImage: img("hanmer-springs-day-tour", "7395a4_f7807cd2cf7c467aad101ce9d2c9ff81-mv2_3.jpg"),
    gallery: [
      "7395a4_f7807cd2cf7c467aad101ce9d2c9ff81-mv2_3.jpg",
      "7395a4_c8e57abfd73d44bcb2e4a84a3872cf35-mv2_2.jpg",
      "7395a4_529cbc3a6ae14c5997e962e0245b3268-mv2_4.jpg",
      "7395a4_a3463af6d7af42108423a2ffa4ce9137-mv2_1.jpg",
      "7395a4_93dce907725e46c29ecbad5828256d06-mv2_1.jpg",
    ].map((f) => img("hanmer-springs-day-tour", f)),
    highlights: [
      "A scenic run up through Canterbury's farmland to the alpine village of Hanmer Springs",
      "Long soaks in the open-air thermal mineral pools, mountains all around",
      "An optional jet boat run through the Waiau Gorge for the adrenaline seekers",
      "An unhurried lunch in the village",
      "Time to browse Hanmer's boutiques and easy alpine pace",
    ],
    itinerary: [
      "We pick you up centrally between 8:00 and 8:45am and head north across rolling Canterbury country, passing landmarks like the historic Waiau Ferry Bridge on the way to the hills.",
      "In Hanmer Springs you've got time in the thermal pools — a spread of hot mineral and spa pools to drift between at your own pace, ringed by mountains.",
      "Break for a café lunch in the village, then wander the shops and soak up the alpine views.",
      "If you've added the jet boat, hold on tight for a fast run through the Waiau Gorge. We aim to have you back in Christchurch around 5:30pm, dropped at your accommodation.",
    ],
    included: ["Driver / Guide", "Hot pools entry", "Hotel pickup and drop-off"],
    priceOptions: [
      { key: "adult", label: "Adult", priceCents: 34500, seatsPerUnit: 1 },
      { key: "child", label: "Child (6–14)", priceCents: 24500, seatsPerUnit: 1 },
      { key: "adult-jet", label: "Adult + Jet Boat", priceCents: 44500, seatsPerUnit: 1, note: "Includes Waiau Gorge jet boat ride" },
      { key: "child-jet", label: "Child + Jet Boat", priceCents: 34500, seatsPerUnit: 1, note: "Includes Waiau Gorge jet boat ride" },
      { key: "adult-private-pool", label: "Adult + Private Pool (30 min)", priceCents: 38000, seatsPerUnit: 1, note: "Your own private thermal pool for up to 6 guests — book for the group, not per person" },
      { key: "child-private-pool", label: "Child + Private Pool (30 min)", priceCents: 28000, seatsPerUnit: 1, note: "Includes 30 min private thermal pool session" },
    ],
    departureTimes: ["08:30"],
    departureWeekdays: [1, 2, 3, 4, 5, 6, 7],
    capacityPerDeparture: 14,
    featured: true,
  },
  {
    slug: "waipara-wine-trail",
    code: "LT18A",
    title: "Waipara Wine Trail",
    destination: "Waipara Valley",
    category: "wine-food",
    durationLabel: "Half Day",
    durationMins: 330,
    ageRange: "18+ (photo ID required)",
    startEnd: "Christchurch → Christchurch",
    pickup: "Pick up from the Central City Tram Stop (#2 Cathedral Square) from 11:30am",
    summary:
      "An afternoon in one of New Zealand's standout cool-climate wine regions — three boutique cellar doors, a good pour of Pinot Noir and Riesling, and a vineyard platter lunch at Waipara Springs.",
    priceFromCents: 19900,
    heroImage: img("waipara-wine-trail", "7395a4_9f56abbd74914f3c9e2e488367f3576d-mv2_1.png"),
    gallery: [
      "7395a4_9f56abbd74914f3c9e2e488367f3576d-mv2_1.png",
      "7395a4_e62d70f255354f47b42c80ff4c81ed08-mv2_1.jpg",
      "7395a4_a8d0c4b3b31947f386f50368b5dfa7b5-mv2_1.jpg",
      "7395a4_fbc77c9f7a6247c6aa61f3b2bd65743f-mv2_2.jpg",
      "7395a4_9b93f51b84214fab9c50e26830ffd1d0-mv2_1.jpg",
    ].map((f) => img("waipara-wine-trail", f)),
    highlights: [
      "A relaxed drive through Canterbury's wine country",
      "Three boutique cellar doors with tastings poured by the people who make the wine",
      "The story behind the region's limestone soils and long, cool growing season",
      "A vineyard platter lunch in the calm of Waipara Springs",
      "An easy pace, with room to linger over a glass",
    ],
    itinerary: [
      "We meet you at the Central City Tram Stop (#2, Cathedral Square) from 11:30am and head north through farmland into the Waipara Valley, one of the country's most characterful cool-climate regions.",
      "You'll visit a handful of boutique wineries — names like Waipara Springs, Torlesse, Pegasus Bay or Georges Road — each with its own feel and a host happy to talk you through the pours.",
      "Lunch is a generous platter at Waipara Springs, with time to sit back in the quiet of the vines.",
      "Across the afternoon you'll taste your way through Pinot Noir, Riesling, Chardonnay, Pinot Gris and Sauvignon Blanc while picking up the why behind the region's wines. Back in Christchurch around 5:00pm.",
    ],
    included: ["Driver / Guide", "Wine tastings at three vineyards", "Platter lunch", "Hotel/central drop-off"],
    importantInfo: ["You must be 18 years of age with valid photo ID to consume alcohol."],
    priceOptions: [
      { key: "adult", label: "Adult", priceCents: 19900, seatsPerUnit: 1 },
      { key: "non-drinker", label: "Non-drinker", priceCents: 14900, seatsPerUnit: 1 },
    ],
    departureTimes: ["11:30"],
    departureWeekdays: [1, 2, 3, 4, 5, 6, 7],
    capacityPerDeparture: 12,
    featured: true,
  },
  {
    slug: "jet-boating-waimakariri",
    code: "LT03",
    title: "Jet Boating on the Waimakariri River",
    destination: "Waimakariri",
    category: "adventure",
    durationLabel: "Half Day",
    durationMins: 210,
    ageRange: "All Ages",
    startEnd: "Christchurch → Christchurch",
    pickup: "Convenient hotel pickup and drop-off. Departing daily: 10am, 12pm, 2pm",
    summary:
      "A fast, spray-flinging jet boat run through the braided channels and rock walls of the Waimakariri, with the Alps for a backdrop. Pick your pace: the quick Braided Blast, the Gorge Adventure, or the full Canyon Safari.",
    priceFromCents: 23500,
    heroImage: img("jet-boating-waimakariri", "7395a4_a337b386d3da4184b16d32033b87c27f-mv2_3.jpg"),
    gallery: [
      "7395a4_a337b386d3da4184b16d32033b87c27f-mv2_3.jpg",
      "7395a4_0b83041e18ff404da8fef6463d9d2e0e-mv2_2.jpg",
      "7395a4_190a72a3a4994cf293a93975bd1bedfc-mv2_1.jpg",
      "7395a4_011659f7922d416eab4fda78a801c05d-mv2_1.jpg",
      "7395a4_10122978c6894e108dd90ad775c45a0b-mv2_1.jpg",
    ].map((f) => img("jet-boating-waimakariri", f)),
    highlights: [
      "A short drive out into northern Canterbury",
      "The wide, braided beauty of the Waimakariri River",
      "Three ride lengths: Braided Blast (30 min), Gorge Adventure (30 min) or Canyon Safari (60 min)",
      "Alpine foothills on every side",
      "Easy hotel pickup and drop-off, with daily departures at 10am, 12pm and 2pm",
    ],
    itinerary: [
      "We pick you up centrally in Christchurch and drive out across the plains to the foothills of the Alps and the braided Waimakariri — 'the Waimak' to locals.",
      "Gear up at the base and launch into the ride, the boat threading shifting channels and canyon walls with an experienced driver at the wheel.",
      "Choose the run that suits you — the snappy 30-minute Braided Blast, the longer Gorge Adventure, or the hour-long Canyon Safari — each with plenty of spins, speed and scenery. We drop you back in the central city after.",
    ],
    included: ["Jet boat ride", "Safety gear", "Hotel pickup and drop-off"],
    priceOptions: [
      { key: "braided-blast", label: "Braided Blast (30 min)", priceCents: 23500, seatsPerUnit: 1 },
      { key: "gorge-adventure", label: "Gorge Adventure (30 min)", priceCents: 23500, seatsPerUnit: 1 },
      { key: "canyon-safari", label: "Canyon Safari (60 min)", priceCents: 31500, seatsPerUnit: 1 },
      { key: "child", label: "Child", priceCents: 16500, seatsPerUnit: 1 },
    ],
    departureTimes: ["10:00", "12:00", "14:00"],
    departureWeekdays: [1, 2, 3, 4, 5, 6, 7],
    capacityPerDeparture: 10,
  },
  {
    slug: "city-wine-glenafric-sheep-farm",
    code: "LT18GA",
    title: "City, Wine, and Glenafric Sheep Farm Tour",
    destination: "Christchurch & Waipara",
    category: "wine-food",
    durationLabel: "1 Day",
    durationMins: 540,
    ageRange: "All Ages",
    startEnd: "Christchurch → Christchurch",
    pickup: "Pick up from your accommodation starting at 8:45am",
    summary:
      "City, coast and cellar door in a single day — a guided look around Christchurch, behind-the-gate time on a working sheep farm with dog and shearing demos, and a boutique tasting in the Waipara Valley.",
    priceFromCents: 29900,
    heroImage: img("city-wine-glenafric-sheep-farm", "7395a4_fb68ffdb336e4aca8590e64e56b9127a-mv2_2.jpg"),
    gallery: [
      "7395a4_fb68ffdb336e4aca8590e64e56b9127a-mv2_2.jpg",
      "7395a4_63efb3ed883041b6a103f3654fdb4ab2-mv2_1.jpg",
      "7395a4_2ffbc0ef0bf9488c8a662da913f389f5-mv2_1.webp",
      "7395a4_fd6d945a83fa4d38a64a7d8b97f2b6af-mv2_1.jpg",
      "7395a4_142b082bf06a4a39807afbbe437062cf-mv2_1.jpg",
    ].map((f) => img("city-wine-glenafric-sheep-farm", f)),
    highlights: [
      "A guided turn around Christchurch's landmarks, gardens and reborn centre",
      "Open-road countryside with commentary from your guide",
      "Behind-the-gate access to a working sheep farm, with dog and shearing demos",
      "Time with heritage livestock and a surprising slice of local geology",
      "A boutique tasting at George's Road in the Waipara Valley",
    ],
    itinerary: [
      "We start at your accommodation from 8:45am with a guided look around Christchurch — how the city has reshaped itself since the 2011 earthquake, told through its landmarks, new builds and green spaces.",
      "From there it's out through farmland and coast to Glenafric, a working farm where the Hoban family host you behind the scenes — handle raw wool, meet the flock (including rare Campbell Island Merino) and even hold a 10–12 million-year-old fossil pulled from the farm's own beach.",
      "Lunch is a relaxed picnic in a rural setting with the South Pacific stretching out below.",
      "Then into the Waipara Valley for a hosted tasting at George's Road — think elegant Pinot Noir and Riesling — before an easy run back to Christchurch in the late afternoon and a drop at your door.",
    ],
    included: ["Driver / Guide", "Glenafric Farm experience", "Picnic lunch", "Wine tasting", "Hotel pickup and drop-off"],
    priceOptions: [
      { key: "adult", label: "Adult", priceCents: 29900, seatsPerUnit: 1 },
      { key: "child", label: "Child (5–14)", priceCents: 19900, seatsPerUnit: 1 },
    ],
    departureTimes: ["08:45"],
    departureWeekdays: [1, 3, 5, 6], // operates select days
    capacityPerDeparture: 12,
  },
  {
    slug: "kaikoura-swim-with-dolphins",
    code: "LT09",
    title: "Kaikōura Swim with Dolphins",
    destination: "Kaikōura",
    category: "wildlife",
    durationLabel: "1 Day",
    durationMins: 690,
    ageRange: "8 – 60 years",
    startEnd: "Christchurch → Christchurch",
    pickup: "Pick up from your central city accommodation between 7:00–7:45am",
    summary:
      "Head north to Kaikōura, where the mountains drop straight to the sea, and slip into the open ocean to swim with wild dusky dolphins — run with the marine specialists who know these waters best.",
    priceFromCents: 46000,
    heroImage: img("kaikoura-swim-with-dolphins", "7395a4_e81c6014fbdc4d80af6d5aac168385e6-mv2_3.jpg"),
    gallery: [
      "7395a4_e81c6014fbdc4d80af6d5aac168385e6-mv2_3.jpg",
      "7395a4_7ff49a1ca4064f1e8db50171ee3a807a-mv2_2.jpg",
      "7395a4_1507d4dae30c456892c98b3599c0ce49-mv2_1.jpg",
      "7395a4_b610078a02d446b3a84098a313169214-mv2_1.jpg",
      "7395a4_0708c1c5dcbc47acb68e1bcbfad85401-mv2.jpg",
    ].map((f) => img("kaikoura-swim-with-dolphins", f)),
    highlights: [
      "A coastal run north through North Canterbury's farmland and shoreline",
      "Free time in the easy-going seaside town of Kaikōura",
      "An open-ocean swim among wild dusky dolphins",
      "Guidance on meeting the dolphins respectfully from the marine crew",
      "Standout photography with mountains behind and ocean all around",
    ],
    itinerary: [
      "We collect you centrally between 7:00 and 7:45am and head north along pastoral country to the sharp, sea-meets-mountains coastline of Kaikōura.",
      "There's time to explore the town — known for its Māori heritage, its wildlife and its laid-back feel, with plenty of small cafés and eateries to dip into.",
      "Out on the water with Dolphin Encounter Kaikōura, you'll kit up in wetsuit, mask, snorkel and fins and slip in among pods of playful dusky dolphins as they wheel and leap around you.",
      "Afterwards it's a warm run back to Christchurch, arriving around 6:30pm for a drop at your accommodation. Run in partnership with Dolphin Encounter Kaikōura.",
    ],
    included: ["Return transport", "Dolphin swim with Dolphin Encounter Kaikōura", "Wetsuit & snorkel gear", "Hotel pickup and drop-off"],
    importantInfo: [
      "You'll need a basic level of fitness — this is deep, open water and you may swim short stretches (around 50m) without touching the bottom.",
      "Swimmers must be 8 or older; those aged 8–12 need an adult swimming with them.",
      "You'll need to follow the crew's safety briefing in English (or via the provided translated instructions).",
    ],
    priceOptions: [
      { key: "swimmer", label: "Adult Swimmer", priceCents: 46000, seatsPerUnit: 1 },
      { key: "child-swimmer", label: "Child Swimmer (8–14)", priceCents: 39000, seatsPerUnit: 1 },
      { key: "spectator", label: "Spectator (on boat)", priceCents: 29000, seatsPerUnit: 1 },
    ],
    departureTimes: ["07:30"],
    departureWeekdays: [1, 2, 3, 4, 5, 6, 7],
    capacityPerDeparture: 10,
  },
  {
    slug: "akaroa-day-tour",
    code: "LT01",
    title: "Akaroa Day Tour",
    destination: "Akaroa",
    category: "iconic-day-trips",
    durationLabel: "1 Day",
    durationMins: 540,
    ageRange: "All Ages",
    startEnd: "Christchurch → Christchurch",
    pickup: "Pick up from your central city accommodation between 8:00–8:45am",
    summary:
      "A drive over the old volcanic folds of Banks Peninsula to the little French settlement of Akaroa, with a harbour nature cruise looking for Hector's dolphins, penguins and seabirds.",
    priceFromCents: 28000,
    heroImage: img("akaroa-day-tour", "7395a4_a7cd5219f40548afbd50e3a161f4792a-mv2_1.png"),
    gallery: [
      "7395a4_a7cd5219f40548afbd50e3a161f4792a-mv2_1.png",
      "7395a4_1eeaa091aa3b4f77b03d91a41ae8743e-mv2_4.jpg",
      "7395a4_2ceffb2ab3854d6285329b14a7a84a43-mv2_1.png",
      "7395a4_c62be8d813304068aa408445435a71f2-mv2_4.jpg",
      "7395a4_96f24c267bf34326a5023ce3a19e7d26-mv2.jpg",
    ].map((f) => img("akaroa-day-tour", f)),
    highlights: [
      "A scenic drive across the volcanic landscape of Banks Peninsula",
      "The wide view over Akaroa Harbour, a sea-flooded crater",
      "Time in the French-settled village with its whaling-era past",
      "A harbour nature cruise on the lookout for Hector's dolphins, penguins and seabirds",
      "A stop for handcrafted cheese at the Barry's Bay factory",
    ],
    itinerary: [
      "We pick you up centrally between 8:00 and 8:45am and wind out over Banks Peninsula toward Akaroa, with photo stops along the way at the Sign of the Takahe, Lake Ellesmere and Little River.",
      "Pull in at the Hilltop for the big view down over Akaroa Harbour, cradled inside an ancient volcanic crater.",
      "There's time to explore the township — French street names, small shops and stories from its whaling days.",
      "Out on the water with Black Cat, the cruise goes looking for Hector's dolphins, little blue penguins and seabirds. On the way home we stop at Barry's Bay for a cheese tasting, reaching Christchurch around 5:30pm.",
    ],
    included: ["Driver / Guide", "2-hour dolphin nature cruise", "Hotel pickup and drop-off"],
    optionalUpgrades: ["Waterfront lunch at Bully Hayes Restaurant"],
    priceOptions: [
      { key: "cruise", label: "Akaroa Day Tour (Harbour Cruise)", priceCents: 28000, seatsPerUnit: 1 },
      { key: "cruise-lunch", label: "Harbour Cruise + Lunch Included", priceCents: 34500, seatsPerUnit: 1 },
      { key: "child", label: "Child (5–14)", priceCents: 19500, seatsPerUnit: 1 },
    ],
    departureTimes: ["08:30"],
    departureWeekdays: [1, 2, 3, 4, 5, 6, 7],
    capacityPerDeparture: 14,
  },
  {
    slug: "lake-tekapo-alpine-adventure",
    code: "LT05",
    title: "Lake Tekapo Alpine Adventure",
    destination: "Lake Tekapo",
    category: "iconic-day-trips",
    durationLabel: "1 Day",
    durationMins: 720,
    ageRange: "All Ages",
    startEnd: "Christchurch → Christchurch",
    pickup: "Pick up from your central city accommodation between 6:45–7:00am",
    summary:
      "A long, spectacular run south through Geraldine and the Mackenzie Country to the turquoise waters of Lake Tekapo — the lakefront Church of the Good Shepherd, an alpine walk, and sweeping views from the Mt John Lookout.",
    priceFromCents: 22900,
    heroImage: "/images/brand/Adventure.jpg",
    gallery: ["/images/brand/Adventure.jpg", "/images/brand/Queenstown-NZ.jpg"],
    highlights: [
      "A scenic drive south through Geraldine and into the high country of the Mackenzie Basin",
      "The famously turquoise, glacier-fed waters of Lake Tekapo",
      "The iconic lakefront Church of the Good Shepherd",
      "A walk along the Tekapo lakefront promenade, mountains on every side",
      "Sweeping views over the lake and basin from the Mt John Lookout",
    ],
    itinerary: [
      "We collect you centrally between 6:45 and 7:00am for the long alpine run south, with a stop in the rural town of Geraldine for coffee before the road climbs into the wide-open Mackenzie Country.",
      "Arrive at Lake Tekapo and step out at the lakefront Church of the Good Shepherd, framed by the lake's turquoise water and the Southern Alps behind.",
      "Free time to walk the lakefront promenade and wander Tekapo township, with cafés and lakeside shops to duck into for lunch.",
      "Head up to the Mt John Lookout for a sweeping panorama over the lake, the Mackenzie Basin and the high peaks beyond, before the drive back to Christchurch, arriving in the evening.",
    ],
    included: ["Driver / Guide", "Hotel pickup and drop-off"],
    priceOptions: [
      { key: "adult", label: "Adult", priceCents: 22900, seatsPerUnit: 1 },
      { key: "child", label: "Child (5–14)", priceCents: 16900, seatsPerUnit: 1 },
      { key: "adult-hotpools", label: "Adult + Hot Pools (Tekapo Springs)", priceCents: 27100, seatsPerUnit: 1, note: "Includes Tekapo Springs hot pools entry" },
      { key: "child-hotpools", label: "Child + Hot Pools (Tekapo Springs)", priceCents: 19400, seatsPerUnit: 1, note: "Includes Tekapo Springs hot pools entry" },
      { key: "adult-darksky", label: "Adult + Dark Sky Stargazing", priceCents: 35800, seatsPerUnit: 1, note: "Crater Experience at Cowan's Observatory — evening session, requires overnight stay in Tekapo" },
      { key: "child-darksky", label: "Child + Dark Sky Stargazing", priceCents: 26400, seatsPerUnit: 1, note: "Crater Experience — ages 5–17, evening session" },
      { key: "adult-observatory", label: "Adult + Mt John Observatory (Summit)", priceCents: 44800, seatsPerUnit: 1, note: "Summit Experience at Mt John — evening session, requires overnight stay in Tekapo" },
      { key: "child-observatory", label: "Child + Mt John Observatory (Summit)", priceCents: 33800, seatsPerUnit: 1, note: "Summit Experience — ages 5–17, evening session" },
      { key: "private-4", label: "Private Group (1–4 Guests)", priceCents: 89900, seatsPerUnit: 4 },
      { key: "private-6", label: "Private Group (1–6 Guests)", priceCents: 109900, seatsPerUnit: 6 },
      { key: "private-12", label: "Private Group (1–12 Guests)", priceCents: 169900, seatsPerUnit: 12 },
    ],
    departureTimes: ["07:00"],
    departureWeekdays: [1, 2, 3, 4, 5, 6, 7],
    capacityPerDeparture: 14,
    featured: true,
  },
  {
    slug: "kaikoura-coastal-experience",
    code: "LT10",
    title: "Kaikōura Coastal Experience",
    destination: "Kaikōura",
    category: "iconic-day-trips",
    durationLabel: "1 Day",
    durationMins: 720,
    ageRange: "All Ages",
    startEnd: "Christchurch → Christchurch",
    pickup: "Pick up from your central city accommodation between 6:45–7:15am",
    summary:
      "A full day along the spectacular Kaikōura coast — mountains dropping straight to the sea, a fur seal colony at Point Kean, the Kaikōura Peninsula Walkway, and free time in the seaside township. No swimming required.",
    priceFromCents: 19900,
    heroImage: "/images/brand/Hero-Ocean-Alps.jpg",
    gallery: ["/images/brand/Hero-Ocean-Alps.jpg", "/images/brand/Beach.jpg"],
    highlights: [
      "A scenic run north along the Coastal Pacific route, mountains meeting the sea",
      "Close-up viewing of the wild fur seal colony at Point Kean",
      "A walk along the Kaikōura Peninsula Walkway",
      "Free time to explore the seaside township of Kaikōura",
      "Ocean views the whole way, with the Seaward Kaikōura Range as a backdrop",
    ],
    itinerary: [
      "We collect you centrally between 6:45 and 7:15am and head north along the Coastal Pacific route, where the mountains drop almost straight into the sea.",
      "Stop in at Point Kean to watch the wild fur seal colony lounging on the rocks, right beside the walking track.",
      "Set off along the Kaikōura Peninsula Walkway for ocean views and a closer look at the rugged coastline.",
      "Free time in Kaikōura township for lunch and a wander, before the run back to Christchurch in the afternoon.",
    ],
    included: ["Driver / Guide", "Hotel pickup and drop-off"],
    priceOptions: [
      { key: "adult", label: "Adult", priceCents: 19900, seatsPerUnit: 1 },
      { key: "child", label: "Child (5–14)", priceCents: 14900, seatsPerUnit: 1 },
      { key: "adult-whalewatch", label: "Adult + Whale Watch Kaikōura", priceCents: 37400, seatsPerUnit: 1, note: "Includes Whale Watch Kaikōura ocean tour (Ocean Cabin)" },
      { key: "child-whalewatch", label: "Child + Whale Watch Kaikōura (3–15)", priceCents: 20900, seatsPerUnit: 1, note: "Includes Whale Watch Kaikōura ocean tour" },
      { key: "adult-dolphin-swim", label: "Adult + Dolphin Encounter Swim", priceCents: 44400, seatsPerUnit: 1, note: "Swim with wild dusky dolphins — must be 15+" },
      { key: "child-dolphin-swim", label: "Child + Dolphin Encounter Swim (8–14)", priceCents: 37900, seatsPerUnit: 1, note: "Confident swimmers only, open water" },
      { key: "adult-dolphin-watch", label: "Adult + Dolphin Encounter Watch", priceCents: 33400, seatsPerUnit: 1, note: "Watch dolphins from the boat — no swimming required" },
      { key: "child-dolphin-watch", label: "Child + Dolphin Encounter Watch (5–14)", priceCents: 23400, seatsPerUnit: 1, note: "Watch dolphins from the boat" },
      { key: "adult-albatross", label: "Adult + Albatross Encounter", priceCents: 38400, seatsPerUnit: 1, note: "Includes Albatross Encounter seabird tour" },
      { key: "child-albatross", label: "Child + Albatross Encounter (3+)", priceCents: 23400, seatsPerUnit: 1, note: "Includes Albatross Encounter seabird tour" },
      { key: "private-4", label: "Private Group (1–4 Guests)", priceCents: 79900, seatsPerUnit: 4 },
      { key: "private-6", label: "Private Group (1–6 Guests)", priceCents: 99900, seatsPerUnit: 6 },
      { key: "private-12", label: "Private Group (1–12 Guests)", priceCents: 159900, seatsPerUnit: 12 },
    ],
    departureTimes: ["07:00"],
    departureWeekdays: [1, 2, 3, 4, 5, 6, 7],
    capacityPerDeparture: 14,
    featured: true,
  },
  {
    slug: "akaroa-swim-with-dolphins",
    code: "LT09A",
    title: "Akaroa Swim with Dolphins",
    destination: "Akaroa",
    category: "wildlife",
    durationLabel: "1 Day",
    durationMins: 540,
    ageRange: "6+ years",
    startEnd: "Christchurch → Christchurch",
    pickup: "Pick up from your central city accommodation between 8:15–8:45am",
    summary:
      "Get in the water with Hector's dolphins — the world's smallest and rarest — in the sheltered crater harbour at Akaroa, one of only a handful of places on the planet where this encounter is possible.",
    priceFromCents: 38500,
    heroImage: img("akaroa-swim-with-dolphins", "7395a4_4a8fe75394104798b8b10a3092051971-mv2_3.jpg"),
    gallery: [
      "7395a4_4a8fe75394104798b8b10a3092051971-mv2_3.jpg",
      "7395a4_1a02f42d6b2644dc9b4e68d5375a357f-mv2_3.jpg",
      "7395a4_3002dd017d564b1491a3b6cc68e0812d-mv2_4.jpg",
      "7395a4_24caaf5e1ba44ecdb15853804cb8b24a-mv2_2.jpg",
      "7395a4_6e77194c00ab46d895b271909149c982-mv2_1.jpg",
    ].map((f) => img("akaroa-swim-with-dolphins", f)),
    highlights: [
      "In-water time with rare, endangered Hector's dolphins",
      "A good chance of penguins, seals and seabirds alongside",
      "Time to wander the French-settled village of Akaroa",
      "A handcrafted cheese stop at Barry's Bay",
      "A scenic crossing of volcanic Banks Peninsula",
    ],
    itinerary: [
      "We collect you centrally between 8:15 and 8:45am and head south over Banks Peninsula via Governor's Bay and Gebbie's Pass, climbing to the Hilltop for that first big look down over Akaroa Harbour.",
      "Down in Akaroa — a former whaling port with plenty of maritime history — there's time to wander the village before you head out on the water.",
      "On board you'll suit up in good wetsuits and snorkelling gear, then move into the calm of the crater harbour, home year-round to Hector's dolphins, the smallest and rarest dolphins in the world.",
      "With the marine crew guiding the encounter, you'll share the water with these curious little dolphins. We stop at the Barry's Bay cheese factory on the way home, reaching Christchurch around 5:45pm. Run in partnership with Black Cat Akaroa.",
    ],
    included: ["Return transport", "Hector's dolphin swim with Black Cat Akaroa", "Wetsuit & snorkel gear", "Hotel pickup and drop-off"],
    importantInfo: ["The dolphin swim doesn't run from May through August.", "You'll need a basic level of fitness for the open-water swim."],
    closedMonths: [5, 6, 7, 8],
    priceOptions: [
      { key: "swimmer", label: "Adult Swimmer", priceCents: 38500, seatsPerUnit: 1 },
      { key: "child-swimmer", label: "Child Swimmer (6–14)", priceCents: 32500, seatsPerUnit: 1 },
      { key: "spectator", label: "Spectator (on boat)", priceCents: 24500, seatsPerUnit: 1 },
    ],
    departureTimes: ["08:30"],
    departureWeekdays: [1, 2, 3, 4, 5, 6, 7],
    capacityPerDeparture: 10,
  },
];

export const toursBySlug: Record<string, Tour> = Object.fromEntries(
  tours.map((t) => [t.slug, t]),
);

export function getTour(slug: string): Tour | undefined {
  return toursBySlug[slug];
}

export const destinations = [
  { slug: "christchurch", name: "Christchurch", status: "active", blurb: "The Garden City & South Island gateway." },
  { slug: "akaroa", name: "Akaroa & Banks Peninsula", status: "active", blurb: "French village charm and Hector's dolphins." },
  { slug: "kaikoura", name: "Kaikōura", status: "active", blurb: "Where the mountains meet the sea." },
  { slug: "waipara", name: "Waipara Valley", status: "active", blurb: "Canterbury's boutique cool-climate wine country." },
  { slug: "hanmer-springs", name: "Hanmer Springs", status: "active", blurb: "Alpine thermal village in the mountains." },
  { slug: "tekapo", name: "Lake Tekapo", status: "active", blurb: "New Zealand's most photographed lake, in the Mackenzie Country." },
  { slug: "auckland", name: "Auckland", status: "coming-soon", blurb: "Coming soon." },
  { slug: "wellington", name: "Wellington", status: "coming-soon", blurb: "Coming soon." },
  { slug: "queenstown", name: "Queenstown", status: "coming-soon", blurb: "Coming soon." },
  { slug: "rotorua", name: "Rotorua", status: "coming-soon", blurb: "Coming soon." },
  { slug: "dunedin", name: "Dunedin", status: "coming-soon", blurb: "Coming soon." },
] as const;

export const categories = [
  { key: "iconic-day-trips", label: "Iconic Day Trips" },
  { key: "wildlife", label: "Wildlife Encounters" },
  { key: "adventure", label: "Adventure" },
  { key: "wine-food", label: "Wine & Food" },
] as const;
