// Places on the interactive sea map. Coordinates are WGS84 (approximate, on the coast).
// No imports: this file is also read by scripts/map-data.mjs (Node type stripping).

export type PlaceKind = "port" | "grotto" | "rock" | "bay" | "cape" | "beach" | "village";

export interface Place {
  id: string;
  kind: PlaceKind;
  lat: number;
  lng: number;
  name: { it: string; en: string };
  desc: { it: string; en: string };
  /** Where the label sits relative to the point */
  label?: "left" | "right" | "top" | "bottom";
}

export const PLACES: Place[] = [
  // ─── Ports ───
  {
    id: "sorrento", kind: "port", lat: 40.6297, lng: 14.3768, label: "top",
    name: { it: "Sorrento · Marina Piccola", en: "Sorrento · Marina Piccola" },
    desc: { it: "La nostra base. Si parte dal molo sotto le scogliere di tufo, a due passi da Piazza Tasso.", en: "Our home port. We leave from the pier beneath the tuff cliffs, steps from Piazza Tasso." },
  },
  {
    id: "capri", kind: "port", lat: 40.5568, lng: 14.2383, label: "top",
    name: { it: "Capri · Marina Grande", en: "Capri · Marina Grande" },
    desc: { it: "Il porto dell'isola: da qui la funicolare sale alla Piazzetta. Sosta per pranzo o tempo libero.", en: "The island's harbour: the funicular climbs to the Piazzetta from here. Stop for lunch or free time." },
  },
  {
    id: "positano", kind: "port", lat: 40.6273, lng: 14.4855, label: "top",
    name: { it: "Positano", en: "Positano" },
    desc: { it: "Il paese verticale: arrivare dal mare è il modo più bello per vederlo. Sbarco sulla Spiaggia Grande.", en: "The vertical village: arriving by sea is the best way to see it. We land on Spiaggia Grande." },
  },
  {
    id: "praiano", kind: "port", lat: 40.6090, lng: 14.5272, label: "bottom",
    name: { it: "Praiano · Marina di Praia", en: "Praiano · Marina di Praia" },
    desc: { it: "Una piccola marina tra le rocce, con acqua cristallina e pochi turisti.", en: "A tiny cove-marina between the rocks, crystal water and few crowds." },
  },
  {
    id: "amalfi", kind: "port", lat: 40.6334, lng: 14.6021, label: "top",
    name: { it: "Amalfi", en: "Amalfi" },
    desc: { it: "L'antica Repubblica Marinara: il Duomo, la piazza e i limoni. Tempo libero a terra.", en: "The old Maritime Republic: the cathedral, the piazza and the lemons. Free time ashore." },
  },
  {
    id: "massa", kind: "port", lat: 40.6117, lng: 14.3389, label: "left",
    name: { it: "Massa Lubrense · Marina della Lobra", en: "Massa Lubrense · Marina della Lobra" },
    desc: { it: "Un porticciolo di pescatori con l'acqua turchese, porta d'ingresso della costa selvaggia.", en: "A fishermen's harbour with turquoise water, gateway to the wild coast." },
  },

  // ─── Points of interest ───
  {
    id: "regina-giovanna", kind: "beach", lat: 40.6330, lng: 14.3527, label: "top",
    name: { it: "Bagni della Regina Giovanna", en: "Queen Giovanna's Baths" },
    desc: { it: "Una piscina naturale tra i ruderi di una villa romana, collegata al mare da un arco di roccia.", en: "A natural rock pool among the ruins of a Roman villa, joined to the sea by a stone arch." },
  },
  {
    id: "puolo", kind: "bay", lat: 40.6233, lng: 14.3452, label: "right",
    name: { it: "Calette di Puolo", en: "Puolo coves" },
    desc: { it: "Piccole calette sotto la costa di tufo: la prima sosta bagno, acqua limpida e silenzio.", en: "Small coves under the tuff coast: the first swim stop, clear water and silence." },
  },
  {
    id: "ieranto", kind: "bay", lat: 40.5778, lng: 14.3420, label: "right",
    name: { it: "Baia di Ieranto", en: "Ieranto Bay" },
    desc: { it: "Area marina protetta (FAI): una delle baie più belle d'Italia, raggiungibile davvero solo dal mare.", en: "A protected marine area (FAI): one of Italy's most beautiful bays, truly reachable only by sea." },
  },
  {
    id: "nerano", kind: "bay", lat: 40.5838, lng: 14.3520, label: "bottom",
    name: { it: "Nerano · Marina del Cantone", en: "Nerano · Marina del Cantone" },
    desc: { it: "La baia degli spaghetti alle zucchine: ristoranti sul mare e tramonti tranquilli.", en: "Home of spaghetti alla Nerano: seafront restaurants and quiet sunsets." },
  },
  {
    id: "punta-campanella", kind: "cape", lat: 40.5694, lng: 14.3245, label: "left",
    name: { it: "Punta Campanella", en: "Punta Campanella" },
    desc: { it: "La punta estrema della penisola, di fronte a Capri. Qui, dice il mito, cantavano le Sirene.", en: "The very tip of the peninsula, facing Capri. Here, myth says, the Sirens sang." },
  },
  {
    id: "faraglioni", kind: "rock", lat: 40.5432, lng: 14.2618, label: "bottom",
    name: { it: "Faraglioni", en: "Faraglioni" },
    desc: { it: "I tre scogli simbolo di Capri: si passa sotto l'arco del Faraglione di Mezzo (si dice porti fortuna baciarsi).", en: "Capri's three iconic rocks: we cruise through the arch of the middle stack (kissing there is said to bring luck)." },
  },
  {
    id: "arco-naturale", kind: "rock", lat: 40.5508, lng: 14.2632, label: "right",
    name: { it: "Arco Naturale", en: "Natural Arch" },
    desc: { it: "Un arco di roccia sospeso sopra il mare, sul versante est dell'isola.", en: "A rock arch hanging above the sea on the island's east side." },
  },
  {
    id: "grotta-bianca", kind: "grotto", lat: 40.5527, lng: 14.2675, label: "right",
    name: { it: "Grotta Bianca", en: "White Grotto" },
    desc: { it: "Pareti calcaree bianchissime e stalattiti: dal gommone o a nuoto, a seconda del mare.", en: "Brilliant white limestone walls and stalactites, by tender or swimming depending on the sea." },
  },
  {
    id: "marina-piccola-capri", kind: "village", lat: 40.5432, lng: 14.2385, label: "bottom",
    name: { it: "Marina Piccola (Capri)", en: "Marina Piccola (Capri)" },
    desc: { it: "Il borgo dei pescatori sul versante sud, con lo Scoglio delle Sirene.", en: "The fishermen's hamlet on the south side, with the Sirens' Rock." },
  },
  {
    id: "grotta-verde", kind: "grotto", lat: 40.5425, lng: 14.2285, label: "bottom",
    name: { it: "Grotta Verde", en: "Green Grotto" },
    desc: { it: "Riflessi color smeraldo sotto le rocce di Anacapri: una delle soste bagno più belle.", en: "Emerald reflections under Anacapri's cliffs: one of the loveliest swim stops." },
  },
  {
    id: "punta-carena", kind: "cape", lat: 40.5358, lng: 14.1975, label: "left",
    name: { it: "Faro di Punta Carena", en: "Punta Carena Lighthouse" },
    desc: { it: "Il secondo faro più importante d'Italia, sulla punta sud-ovest. Tramonti spettacolari.", en: "Italy's second most important lighthouse, on the south-west tip. Spectacular sunsets." },
  },
  {
    id: "grotta-azzurra", kind: "grotto", lat: 40.5612, lng: 14.2058, label: "top",
    name: { it: "Grotta Azzurra", en: "Blue Grotto" },
    desc: { it: "La luce entra da sotto il mare e accende l'acqua di blu. Ingresso con le barchette a remi (biglietto a parte, se il mare lo permette).", en: "Light enters from beneath the sea and turns the water electric blue. Entry by rowing boat (separate ticket, sea permitting)." },
  },
  {
    id: "li-galli", kind: "rock", lat: 40.5810, lng: 14.4325, label: "bottom",
    name: { it: "Li Galli", en: "Li Galli islands" },
    desc: { it: "L'arcipelago delle Sirene, di fronte a Positano: tre isolotti privati, un tempo di Nureyev.", en: "The Sirens' archipelago off Positano: three private islets, once owned by Nureyev." },
  },
  {
    id: "furore", kind: "bay", lat: 40.6197, lng: 14.5501, label: "top",
    name: { it: "Fiordo di Furore", en: "Furore Fjord" },
    desc: { it: "Una gola stretta tra due pareti, con il ponte sopra e la spiaggetta in fondo. Unico in Costiera.", en: "A narrow gorge between two cliffs, the bridge above and a tiny beach below. Unique on the coast." },
  },
  {
    id: "grotta-smeraldo", kind: "grotto", lat: 40.6183, lng: 14.5638, label: "bottom",
    name: { it: "Grotta dello Smeraldo", en: "Emerald Grotto" },
    desc: { it: "A Conca dei Marini: l'acqua diventa verde smeraldo e sul fondo c'è un presepe sommerso.", en: "At Conca dei Marini: the water glows emerald and there's a nativity scene on the seabed." },
  },
];

/** Ordered stops for each tour (start and end are added by the route builder when missing). */
export const TOUR_STOPS: Record<string, string[]> = {
  "capri-island-private-tour": ["sorrento", "grotta-bianca", "arco-naturale", "faraglioni", "marina-piccola-capri", "grotta-verde", "punta-carena", "grotta-azzurra", "capri", "sorrento"],
  "capri-positano-tour": ["sorrento", "faraglioni", "grotta-verde", "punta-carena", "grotta-azzurra", "capri", "li-galli", "positano", "sorrento"],
  "positano-amalfi-tour": ["sorrento", "li-galli", "praiano", "furore", "grotta-smeraldo", "amalfi", "positano", "sorrento"],
  "romantic-couple-tour": ["sorrento", "faraglioni", "grotta-bianca", "marina-piccola-capri", "nerano", "sorrento"],
  "sorrento-coast-tour": ["sorrento", "puolo", "massa", "ieranto", "punta-campanella", "regina-giovanna", "sorrento"],
  "sunset-experience": ["sorrento", "regina-giovanna", "nerano", "sorrento"],
};

/** Map extent: Capri (west) → Amalfi (east) */
export const MAP_BBOX = { west: 14.17, east: 14.625, south: 40.525, north: 40.69 };

/** Villages drawn as little houses on the 3D relief. r = radius (km), n = houses, steep = allow cliffside houses */
export interface Town { name: string; lat: number; lng: number; r: number; n: number; steep?: boolean }
export const TOWNS: Town[] = [
  { name: "Sorrento", lat: 40.6262, lng: 14.3757, r: 0.85, n: 260 },
  { name: "Sant'Agnello", lat: 40.6325, lng: 14.3965, r: 0.55, n: 110 },
  { name: "Piano di Sorrento", lat: 40.6335, lng: 14.4115, r: 0.6, n: 110 },
  { name: "Meta", lat: 40.6415, lng: 14.4175, r: 0.4, n: 60 },
  { name: "Vico Equense", lat: 40.6615, lng: 14.4275, r: 0.5, n: 90 },
  { name: "Massa Lubrense", lat: 40.6108, lng: 14.3447, r: 0.45, n: 70 },
  { name: "Sant'Agata", lat: 40.6045, lng: 14.3735, r: 0.35, n: 45 },
  { name: "Nerano", lat: 40.587, lng: 14.354, r: 0.3, n: 30 },
  { name: "Termini", lat: 40.585, lng: 14.333, r: 0.25, n: 25 },
  { name: "Positano", lat: 40.6285, lng: 14.4855, r: 0.55, n: 220, steep: true },
  { name: "Praiano", lat: 40.6115, lng: 14.531, r: 0.45, n: 80, steep: true },
  { name: "Conca dei Marini", lat: 40.619, lng: 14.572, r: 0.3, n: 40, steep: true },
  { name: "Amalfi", lat: 40.634, lng: 14.6025, r: 0.45, n: 160, steep: true },
  { name: "Atrani", lat: 40.6365, lng: 14.6085, r: 0.2, n: 35, steep: true },
  { name: "Capri", lat: 40.5508, lng: 14.2425, r: 0.5, n: 170 },
  { name: "Marina Grande", lat: 40.5565, lng: 14.241, r: 0.25, n: 60, steep: true },
  { name: "Anacapri", lat: 40.554, lng: 14.216, r: 0.6, n: 170 },
];

/** Majolica domes (the Costiera's signature) */
export const DOMES = [
  { name: "Santa Maria Assunta, Positano", lat: 40.6283, lng: 14.4862 },
  { name: "Duomo di Amalfi", lat: 40.634, lng: 14.6032 },
  { name: "San Gennaro, Praiano", lat: 40.6118, lng: 14.5305 },
];
