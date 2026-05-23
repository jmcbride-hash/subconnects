/**
 * Canonical roofing-systems taxonomy.
 *
 * IDs are stable (used as the primary key in the roofing_systems table) — never renumber.
 * If a system is retired, mark `retired: true` rather than removing the row.
 *
 * Categories follow the data-model enum: COMMERCIAL_FLAT, COMMERCIAL_STEEP, RESIDENTIAL, SPECIALTY.
 */

export type SystemCategory = "COMMERCIAL_FLAT" | "COMMERCIAL_STEEP" | "RESIDENTIAL" | "SPECIALTY";

export type RoofingSystem = {
  id: number;
  slug: string;
  name: string;
  category: SystemCategory;
  blurb?: string; // short description for tooltips
  retired?: boolean;
};

export const ROOFING_SYSTEMS: RoofingSystem[] = [
  // Commercial flat
  { id: 1, slug: "tpo",       name: "TPO",                  category: "COMMERCIAL_FLAT", blurb: "Thermoplastic Polyolefin single-ply" },
  { id: 2, slug: "epdm",      name: "EPDM",                 category: "COMMERCIAL_FLAT", blurb: "Ethylene Propylene Diene Monomer single-ply" },
  { id: 3, slug: "pvc",       name: "PVC",                  category: "COMMERCIAL_FLAT", blurb: "Polyvinyl Chloride single-ply" },
  { id: 4, slug: "mod-bit",   name: "Modified Bitumen",     category: "COMMERCIAL_FLAT", blurb: "Multi-ply asphalt with rubber/plastic modifiers" },
  { id: 5, slug: "bur",       name: "BUR (Built-Up Roof)",  category: "COMMERCIAL_FLAT", blurb: "Multi-layer felt + asphalt + gravel" },

  // Commercial steep
  { id: 10, slug: "metal-standing-seam", name: "Standing Seam Metal", category: "COMMERCIAL_STEEP", blurb: "Concealed-fastener metal panels" },
  { id: 11, slug: "metal-exposed-fastener", name: "Exposed Fastener Metal", category: "COMMERCIAL_STEEP", blurb: "Through-fastened metal panels (R-panel etc.)" },

  // Residential
  { id: 20, slug: "shingle",  name: "Asphalt Shingle",      category: "RESIDENTIAL",     blurb: "Architectural/3-tab asphalt shingles" },

  // Specialty
  { id: 30, slug: "slate",    name: "Slate",                category: "SPECIALTY",       blurb: "Natural slate tile" },
  { id: 31, slug: "tile",     name: "Tile",                 category: "SPECIALTY",       blurb: "Clay or concrete tile" },
  { id: 32, slug: "coatings", name: "Coatings",             category: "SPECIALTY",       blurb: "Acrylic / silicone / urethane fluid-applied" },
  { id: 33, slug: "foam",     name: "Spray Polyurethane Foam", category: "SPECIALTY",   blurb: "SPF — sprayed-in-place insulation + waterproofing" },
];

export const ROOFING_SYSTEMS_BY_CATEGORY: Record<SystemCategory, RoofingSystem[]> = {
  COMMERCIAL_FLAT: ROOFING_SYSTEMS.filter((s) => s.category === "COMMERCIAL_FLAT" && !s.retired),
  COMMERCIAL_STEEP: ROOFING_SYSTEMS.filter((s) => s.category === "COMMERCIAL_STEEP" && !s.retired),
  RESIDENTIAL: ROOFING_SYSTEMS.filter((s) => s.category === "RESIDENTIAL" && !s.retired),
  SPECIALTY: ROOFING_SYSTEMS.filter((s) => s.category === "SPECIALTY" && !s.retired),
};

export const CATEGORY_LABELS: Record<SystemCategory, string> = {
  COMMERCIAL_FLAT: "Commercial Flat",
  COMMERCIAL_STEEP: "Commercial Steep",
  RESIDENTIAL: "Residential",
  SPECIALTY: "Specialty",
};

export function getSystemById(id: number): RoofingSystem | undefined {
  return ROOFING_SYSTEMS.find((s) => s.id === id);
}
