export interface MaterialColor {
  label: string;
  primary: string;
  background: string;
  text: string;
}

export const MATERIAL_COLORS: Record<string, MaterialColor> = {
  KUPFER: {
    label: "Kupfer",
    primary: "#B87333",
    background: "#F2D6C2",
    text: "#3A1E0B"
  },
  ALUMINIUM: {
    label: "Aluminium",
    primary: "#9EA7B3",
    background: "#E6E9ED",
    text: "#2F343A"
  },
  STAHL: {
    label: "Stahl",
    primary: "#5A5F66",
    background: "#DADDE1",
    text: "#1F2328"
  },
  EDELSTAHL: {
    label: "Edelstahl",
    primary: "#7F8C8D",
    background: "#E3E7E8",
    text: "#2C3E50"
  },
  MISCHSCHROTT: {
    label: "Mischschrott",
    primary: "#6D6E71",
    background: "#E0E0E0",
    text: "#1C1C1C"
  },
  KABELSCHROTT: {
    label: "Kabelschrott",
    primary: "#8D5524",
    background: "#E8D3C1",
    text: "#3B1F0F"
  },
  PAPIER: {
    label: "Papier / Karton",
    primary: "#D4A373",
    background: "#F6E7D8",
    text: "#4A2E16"
  },
  KUNSTSTOFF: {
    label: "Kunststoff",
    primary: "#4DA3FF",
    background: "#E6F1FF",
    text: "#0F2A44"
  },
  FOLIE: {
    label: "Folie",
    primary: "#6EC1E4",
    background: "#E9F7FD",
    text: "#0B3A4A"
  },
  HOLZ: {
    label: "Holz",
    primary: "#8B5A2B",
    background: "#EADBC8",
    text: "#3E2310"
  },
  GLAS: {
    label: "Glas",
    primary: "#4CAF50",
    background: "#E6F4EA",
    text: "#0F3D1E"
  },
  ELEKTRONIK: {
    label: "Elektronikschrott",
    primary: "#673AB7",
    background: "#EEE6FA",
    text: "#2A145A"
  },
  GEFAHRSTOFF: {
    label: "Gefahrstoff",
    primary: "#D32F2F",
    background: "#FDECEA",
    text: "#5F0F0F"
  },
  OEL_FETT: {
    label: "Öl / Fett",
    primary: "#3E2723",
    background: "#EDE7E5",
    text: "#1B0E0B"
  },
  SONSTIGES: {
    label: "Sonstiges",
    primary: "#9E9E9E",
    background: "#F0F0F0",
    text: "#2E2E2E"
  },
  DEFAULT: {
    label: "Unbekannt",
    primary: "#607D8B",
    background: "#ECEFF1",
    text: "#263238"
  }
};

export function getMaterialColors(materialCode: string | null | undefined): MaterialColor {
  if (!materialCode) {
    return MATERIAL_COLORS.DEFAULT;
  }
  const upperCode = materialCode.toUpperCase();
  return MATERIAL_COLORS[upperCode] || MATERIAL_COLORS.DEFAULT;
}

export function getMaterialLabel(materialCode: string | null | undefined): string {
  return getMaterialColors(materialCode).label;
}
