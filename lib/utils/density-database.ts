/**
 * Umfassende Dichte-Datenbank für ML zu Gramm Umrechnung
 * Basiert auf wissenschaftlichen Daten und Küchenpraxis
 */

export interface DensityData {
  name: string
  nameDE: string
  density: number // g/ml
  temperature?: number // °C
  category: 'cooking' | 'chemistry' | 'medicine' | 'common'
  description?: string
  aliases?: string[]
}

export const DENSITY_DATABASE: DensityData[] = [
  // === KOCHZUTATEN ===
  {
    name: 'water',
    nameDE: 'Wasser',
    density: 1,
    temperature: 20,
    category: 'cooking',
    description: 'Reines Wasser bei Raumtemperatur',
    aliases: ['h2o', 'aqua'],
  },
  {
    name: 'milk',
    nameDE: 'Milch',
    density: 1.03,
    category: 'cooking',
    description: 'Vollmilch 3,5% Fett',
    aliases: ['vollmilch', 'milk'],
  },
  {
    name: 'cooking_oil',
    nameDE: 'Speiseöl',
    density: 0.92,
    category: 'cooking',
    description: 'Durchschnittliches Speiseöl',
    aliases: ['öl', 'oil', 'sonnenblumenöl', 'rapsöl'],
  },
  {
    name: 'honey',
    nameDE: 'Honig',
    density: 1.4,
    category: 'cooking',
    description: 'Flüssiger Honig',
    aliases: ['bienenhonig'],
  },
  {
    name: 'olive_oil',
    nameDE: 'Olivenöl',
    density: 0.915,
    category: 'cooking',
    description: 'Extra natives Olivenöl',
    aliases: ['olivenöl extra virgin'],
  },
  {
    name: 'cream',
    nameDE: 'Sahne',
    density: 1.01,
    category: 'cooking',
    description: 'Schlagsahne 30% Fett',
    aliases: ['schlagsahne', 'sahne'],
  },
  {
    name: 'butter_melted',
    nameDE: 'Butter (geschmolzen)',
    density: 0.91,
    category: 'cooking',
    description: 'Geschmolzene Butter',
    aliases: ['flüssige butter'],
  },
  {
    name: 'vinegar',
    nameDE: 'Essig',
    density: 1.05,
    category: 'cooking',
    description: 'Haushaltsessig 5%',
    aliases: ['weinessig', 'apfelessig'],
  },
  {
    name: 'maple_syrup',
    nameDE: 'Ahornsirup',
    density: 1.33,
    category: 'cooking',
    description: 'Echter Ahornsirup',
    aliases: ['ahornsirup'],
  },
  {
    name: 'corn_syrup',
    nameDE: 'Maissirup',
    density: 1.43,
    category: 'cooking',
    description: 'Glucosesirup aus Mais',
    aliases: ['glukosesirup', 'maissirup'],
  },

  // === CHEMIKALIEN (aus der bereitgestellten Tabelle) ===
  {
    name: 'acetic_acid',
    nameDE: 'Essigsäure',
    density: 1.049,
    temperature: 25,
    category: 'chemistry',
    description: 'Reine Essigsäure',
  },
  {
    name: 'acetone',
    nameDE: 'Aceton',
    density: 0.7846,
    temperature: 25,
    category: 'chemistry',
    description: 'Reines Aceton',
  },
  {
    name: 'ethanol',
    nameDE: 'Ethanol',
    density: 0.7851,
    temperature: 25,
    category: 'chemistry',
    description: 'Reiner Ethylalkohol',
    aliases: ['ethylalkohol', 'trinkalkohol'],
  },
  {
    name: 'methanol',
    nameDE: 'Methanol',
    density: 0.7865,
    temperature: 25,
    category: 'chemistry',
    description: 'Reiner Methylalkohol',
    aliases: ['methylalkohol'],
  },
  {
    name: 'propanol',
    nameDE: 'Propanol',
    density: 0.804,
    temperature: 25,
    category: 'chemistry',
    description: 'Propylalkohol',
  },
  {
    name: 'ammonia_water',
    nameDE: 'Ammoniakwasser',
    density: 0.8235,
    temperature: 25,
    category: 'chemistry',
    description: 'Wässrige Ammoniaklösung',
  },
  {
    name: 'aniline',
    nameDE: 'Anilin',
    density: 1.019,
    temperature: 25,
    category: 'chemistry',
    description: 'Anilin (Aminobenzol)',
  },
  {
    name: 'benzene',
    nameDE: 'Benzol',
    density: 0.8738,
    temperature: 25,
    category: 'chemistry',
    description: 'Reines Benzol',
  },
  {
    name: 'butane',
    nameDE: 'Butan',
    density: 0.599,
    temperature: 25,
    category: 'chemistry',
    description: 'Flüssiges Butan',
  },
  {
    name: 'carbon_disulfide',
    nameDE: 'Schwefelkohlenstoff',
    density: 1.261,
    temperature: 25,
    category: 'chemistry',
    description: 'Schwefelkohlenstoff CS₂',
  },
  {
    name: 'carbon_tetrachloride',
    nameDE: 'Tetrachlorkohlenstoff',
    density: 1.584,
    temperature: 25,
    category: 'chemistry',
    description: 'Tetrachlorkohlenstoff CCl₄',
  },
  {
    name: 'chloroform',
    nameDE: 'Chloroform',
    density: 1.465,
    temperature: 25,
    category: 'chemistry',
    description: 'Chloroform CHCl₃',
  },
  {
    name: 'cyclohexane',
    nameDE: 'Cyclohexan',
    density: 0.779,
    temperature: 20,
    category: 'chemistry',
    description: 'Cyclohexan C₆H₁₂',
  },
  {
    name: 'dichloromethane',
    nameDE: 'Dichlormethan',
    density: 1.326,
    temperature: 20,
    category: 'chemistry',
    description: 'Dichlormethan CH₂Cl₂',
  },
  {
    name: 'diethylene_glycol',
    nameDE: 'Diethylenglycol',
    density: 1.12,
    temperature: 15,
    category: 'chemistry',
    description: 'Diethylenglycol',
  },
  {
    name: 'ether',
    nameDE: 'Ether',
    density: 0.7135,
    temperature: 25,
    category: 'chemistry',
    description: 'Diethylether',
  },
  {
    name: 'ethyl_acetate',
    nameDE: 'Ethylacetat',
    density: 0.901,
    temperature: 20,
    category: 'chemistry',
    description: 'Ethylacetat (Essigester)',
  },
  {
    name: 'formaldehyde',
    nameDE: 'Formaldehyd',
    density: 0.812,
    temperature: 45,
    category: 'chemistry',
    description: 'Formaldehyd (wässrige Lösung)',
  },
  {
    name: 'glycerin',
    nameDE: 'Glycerin',
    density: 1.259,
    temperature: 25,
    category: 'chemistry',
    description: 'Reines Glycerin',
    aliases: ['glycerol'],
  },
  {
    name: 'glycerol',
    nameDE: 'Glycerol',
    density: 1.126,
    temperature: 25,
    category: 'chemistry',
    description: 'Glycerol (Variante)',
  },
  {
    name: 'heptane',
    nameDE: 'Heptan',
    density: 0.6795,
    temperature: 25,
    category: 'chemistry',
    description: 'n-Heptan C₇H₁₆',
  },
  {
    name: 'hexane',
    nameDE: 'Hexan',
    density: 0.6548,
    temperature: 25,
    category: 'chemistry',
    description: 'n-Hexan C₆H₁₄',
  },
  {
    name: 'hydrazine',
    nameDE: 'Hydrazin',
    density: 0.795,
    temperature: 25,
    category: 'chemistry',
    description: 'Hydrazin N₂H₄',
  },
  {
    name: 'isobutyl_alcohol',
    nameDE: 'Isobutylalkohol',
    density: 0.802,
    temperature: 20,
    category: 'chemistry',
    description: 'Isobutanol',
  },
  {
    name: 'isopropyl_alcohol',
    nameDE: 'Isopropylalkohol',
    density: 0.785,
    temperature: 20,
    category: 'chemistry',
    description: 'Isopropanol (2-Propanol)',
    aliases: ['isopropanol', 'ipa'],
  },
  {
    name: 'naphthalene',
    nameDE: 'Naphthalin',
    density: 0.82,
    temperature: 25,
    category: 'chemistry',
    description: 'Naphthalin (flüssig)',
  },
  {
    name: 'nitric_acid',
    nameDE: 'Salpetersäure',
    density: 1.56,
    temperature: 0,
    category: 'chemistry',
    description: 'Konzentrierte Salpetersäure',
  },
  {
    name: 'palmitic_acid',
    nameDE: 'Palmitinsäure',
    density: 0.851,
    temperature: 25,
    category: 'chemistry',
    description: 'Palmitinsäure (flüssig)',
  },
  {
    name: 'phenol',
    nameDE: 'Phenol',
    density: 1.072,
    temperature: 25,
    category: 'chemistry',
    description: 'Phenol (Karbolsäure)',
    aliases: ['karbolsäure'],
  },
  {
    name: 'silicone_oil',
    nameDE: 'Silikonöl',
    density: 0.9725, // Mittelwert von 965-980
    temperature: 25,
    category: 'chemistry',
    description: 'Silikonöl (Durchschnitt)',
  },
  {
    name: 'sodium_hydroxide',
    nameDE: 'Natriumhydroxid',
    density: 1.25,
    temperature: 15,
    category: 'chemistry',
    description: 'Natronlauge (wässrig)',
    aliases: ['natronlauge', 'ätznatron'],
  },
  {
    name: 'toluene',
    nameDE: 'Toluol',
    density: 0.867,
    temperature: 20,
    category: 'chemistry',
    description: 'Toluol (Methylbenzol)',
  },
  {
    name: 'turpentine',
    nameDE: 'Terpentin',
    density: 0.8682,
    temperature: 25,
    category: 'chemistry',
    description: 'Terpentinöl',
  },

  // === MEDIZINISCHE SUBSTANZEN ===
  {
    name: 'hydrogen_peroxide_3',
    nameDE: 'Wasserstoffperoxid 3%',
    density: 1.01,
    category: 'medicine',
    description: '3%ige Wasserstoffperoxid-Lösung',
    aliases: ['h2o2 3%'],
  },
  {
    name: 'saline_solution',
    nameDE: 'Kochsalzlösung',
    density: 1.025,
    category: 'medicine',
    description: '0,9% Natriumchlorid-Lösung',
    aliases: ['nacl lösung'],
  },

  // === HÄUFIGE SUBSTANZEN ===
  {
    name: 'gasoline',
    nameDE: 'Benzin',
    density: 0.74,
    category: 'common',
    description: 'Normalbenzin',
    aliases: ['kraftstoff'],
  },
  {
    name: 'diesel',
    nameDE: 'Diesel',
    density: 0.85,
    category: 'common',
    description: 'Dieselkraftstoff',
  },
  {
    name: 'heating_oil',
    nameDE: 'Heizöl',
    density: 0.89,
    temperature: 15.5,
    category: 'common',
    description: 'Heizöl EL',
  },
]

/**
 * Sucht eine Substanz in der Datenbank basierend auf Name oder Alias
 */
export function findDensityData(searchTerm: string): DensityData | undefined {
  const searchLower = searchTerm.toLowerCase().trim()

  return DENSITY_DATABASE.find(
    item =>
      item.name.toLowerCase() === searchLower
      || item.nameDE.toLowerCase() === searchLower
      || item.aliases?.some(alias => alias.toLowerCase() === searchLower),
  )
}

/**
 * Filtert die Datenbank nach Kategorie
 */
export function getDensityDataByCategory(
  category: DensityData['category'],
): DensityData[] {
  return DENSITY_DATABASE.filter(item => item.category === category)
}

/**
 * Sucht Substanzen basierend auf einem Suchstring (fuzzy search)
 */
export function searchDensityData(searchTerm: string): DensityData[] {
  const searchLower = searchTerm.toLowerCase().trim()

  if (searchLower.length < 2)
    return []

  return DENSITY_DATABASE.filter(
    item =>
      item.nameDE.toLowerCase().includes(searchLower)
      || item.name.toLowerCase().includes(searchLower)
      || item.aliases?.some(alias =>
        alias.toLowerCase().includes(searchLower),
      )
      || item.description?.toLowerCase().includes(searchLower),
  ).slice(0, 10) // Begrenzt auf 10 Ergebnisse
}

/**
 * Gibt alle verfügbaren Kategorien zurück
 */
export function getAvailableCategories(): DensityData['category'][] {
  return ['cooking', 'chemistry', 'medicine', 'common']
}

/**
 * Gibt die deutsche Bezeichnung für eine Kategorie zurück
 */
export function getCategoryDisplayName(
  category: DensityData['category'],
): string {
  const categoryNames = {
    cooking: 'Kochen & Backen',
    chemistry: 'Chemikalien',
    medicine: 'Medizin',
    common: 'Alltägliche Substanzen',
  }

  return categoryNames[category]
}
