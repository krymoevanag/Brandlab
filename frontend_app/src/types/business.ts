export type BusinessUnit = "all" | "graphics" | "cnc";

export interface BusinessUnitConfig {
  id: BusinessUnit;
  name: string;
  shortName: string;
  tagline: string;
  primaryColor: string;
  badgeBg: string;
  badgeText: string;
  logoKey: "graphics" | "cnc" | "combined";
}

export const BUSINESS_UNITS: Record<BusinessUnit, BusinessUnitConfig> = {
  all: {
    id: "all",
    name: "A to Z Business Management",
    shortName: "All Businesses",
    tagline: "Consolidated Operations & Finance",
    primaryColor: "#07357B",
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-800",
    logoKey: "combined",
  },
  graphics: {
    id: "graphics",
    name: "A to Z Graphics Branding & Gifts Shop",
    shortName: "Graphics & Branding",
    tagline: "Design, Printing, Signage & Corporate Gifts",
    primaryColor: "#00AEEF",
    badgeBg: "bg-sky-50 border-sky-200",
    badgeText: "text-sky-800",
    logoKey: "graphics",
  },
  cnc: {
    id: "cnc",
    name: "A to Z CNC Services",
    shortName: "CNC Services",
    tagline: "Machining, Precision Cutting & Fabrication",
    primaryColor: "#F97316",
    badgeBg: "bg-orange-50 border-orange-200",
    badgeText: "text-orange-800",
    logoKey: "cnc",
  },
};
