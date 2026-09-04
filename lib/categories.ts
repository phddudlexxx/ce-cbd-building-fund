/** High-level buckets used by church building campaigns worldwide.
 *  Keep these few so reporting stays useful. Put the detail in the description. */
export const EXPENSE_CATEGORIES = [
  {
    id: "land-legal",
    name: "Land, legal & permits",
    hint: "Purchase, transfer, rezoning, municipal and building-plan fees",
  },
  {
    id: "professional",
    name: "Professional fees",
    hint: "Architect, engineers, quantity surveyor, project manager",
  },
  {
    id: "site",
    name: "Site works",
    hint: "Clearing, earthworks, fencing, parking, drainage, utilities to site",
  },
  {
    id: "structure",
    name: "Structure & building works",
    hint: "Bricks, cement, steel, timber, masonry and carpentry labour",
  },
  {
    id: "roofing",
    name: "Roofing & waterproofing",
    hint: "Trusses, sheeting, gutters, insulation",
  },
  {
    id: "services",
    name: "Electrical, plumbing & HVAC",
    hint: "Wiring, sanitary, water, air-conditioning",
  },
  {
    id: "finishes",
    name: "Interior finishes",
    hint: "Plaster, paint, flooring, ceilings, doors, windows",
  },
  {
    id: "ffe",
    name: "Furniture & equipment",
    hint: "Seating, pulpit, kitchen, offices, baptistry",
  },
  {
    id: "av",
    name: "Audio, visual & IT",
    hint: "Sound, screens, cameras, lighting, networking",
  },
  {
    id: "campaign",
    name: "Campaign & admin",
    hint: "Bank charges, fundraising costs, printing, insurance during build",
  },
  {
    id: "contingency",
    name: "Contingency / unplanned",
    hint: "Surprises and items that do not fit elsewhere",
  },
] as const;

export const INKIND_TYPES = [
  { id: "materials", name: "Building materials", hint: "Bricks, cement, sand, steel, paint, timber" },
  { id: "labour", name: "Labour", hint: "Days of work donated by members or contractors" },
  { id: "professional", name: "Professional services", hint: "Design, legal, quantity surveying given free" },
  { id: "equipment", name: "Equipment & tools", hint: "Hired or given plant, tools, generators" },
  { id: "furniture", name: "Furniture & fittings", hint: "Chairs, pulpit, kitchen items" },
  { id: "other", name: "Other in-kind", hint: "Anything else with a fair value" },
] as const;

export const PAYMENT_METHODS = [
  { id: "cash", name: "Cash" },
  { id: "eft", name: "EFT / bank transfer" },
  { id: "card", name: "Card" },
  { id: "cheque", name: "Cheque" },
  { id: "mobile", name: "Mobile money" },
  { id: "other", name: "Other" },
] as const;

export const PLEDGE_FREQUENCIES = [
  { id: "once", name: "Once-off" },
  { id: "weekly", name: "Weekly" },
  { id: "monthly", name: "Monthly" },
  { id: "quarterly", name: "Quarterly" },
] as const;

export const GIFT_TYPES = [
  { id: "donation", name: "One-off gift" },
  { id: "pledge-payment", name: "Pledge payment" },
  { id: "fundraising", name: "Fundraising event" },
  { id: "grant", name: "Grant" },
  { id: "loan", name: "Loan / facility draw" },
  { id: "other", name: "Other cash in" },
] as const;

export const PERSON_ROLES = [
  { id: "member", name: "Member" },
  { id: "visitor", name: "Visitor / friend" },
  { id: "company", name: "Company / supplier" },
  { id: "anonymous", name: "Anonymous" },
] as const;

export const PERSON_TITLES = [
  { id: "br", label: "Br" },
  { id: "sr", label: "Sr" },
  { id: "ps", label: "Ps" },
  { id: "dcn", label: "Dcn" },
  { id: "dr", label: "Dr." },
  { id: "prof", label: "Prof" },
] as const;

export const PERSON_KINDS = [
  { id: "individual", name: "One person" },
  { id: "couple", name: "Couple" },
  { id: "family", name: "Family" },
  { id: "company", name: "Company" },
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]["id"];
export type InKindTypeId = (typeof INKIND_TYPES)[number]["id"];
export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];
export type PledgeFrequencyId = (typeof PLEDGE_FREQUENCIES)[number]["id"];
export type GiftTypeId = (typeof GIFT_TYPES)[number]["id"];
export type PersonRoleId = (typeof PERSON_ROLES)[number]["id"];
export type PersonTitleId = (typeof PERSON_TITLES)[number]["id"];
export type PersonKindId = (typeof PERSON_KINDS)[number]["id"] | "anonymous";

export function categoryName(id: string) {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

export function inKindTypeName(id: string) {
  return INKIND_TYPES.find((c) => c.id === id)?.name ?? id;
}
