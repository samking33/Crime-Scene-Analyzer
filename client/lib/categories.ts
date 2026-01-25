import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Category {
  id: number;
  categoryName: string;
  displayName: string;
  iconName: string;
  colorCode: string;
  priority: number;
  description: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 1,
    categoryName: "weapons",
    displayName: "Weapons",
    iconName: "shield-alert",
    colorCode: "#D32F2F",
    priority: 1,
    description: "Firearms, knives, and other weapons",
  },
  {
    id: 2,
    categoryName: "vehicles",
    displayName: "Vehicles",
    iconName: "car",
    colorCode: "#F57C00",
    priority: 2,
    description: "Cars, trucks, motorcycles, and license plates",
  },
  {
    id: 3,
    categoryName: "persons",
    displayName: "Persons",
    iconName: "account",
    colorCode: "#1976D2",
    priority: 3,
    description: "Individuals, suspects, victims, witnesses",
  },
  {
    id: 4,
    categoryName: "biometrics",
    displayName: "Biometrics",
    iconName: "fingerprint",
    colorCode: "#7B1FA2",
    priority: 4,
    description: "Blood, fingerprints, DNA evidence",
  },
  {
    id: 5,
    categoryName: "drugs",
    displayName: "Drugs/Substances",
    iconName: "alert",
    colorCode: "#C62828",
    priority: 5,
    description: "Narcotics, pills, paraphernalia",
  },
  {
    id: 6,
    categoryName: "documents",
    displayName: "Documents",
    iconName: "file-document",
    colorCode: "#388E3C",
    priority: 6,
    description: "Papers, IDs, contracts, receipts",
  },
  {
    id: 7,
    categoryName: "electronics",
    displayName: "Electronics",
    iconName: "devices",
    colorCode: "#00796B",
    priority: 7,
    description: "Phones, computers, cameras, storage devices",
  },
  {
    id: 8,
    categoryName: "markers",
    displayName: "Evidence Markers",
    iconName: "flag",
    colorCode: "#FBC02D",
    priority: 8,
    description: "Evidence markers, cones, crime scene tape",
  },
  {
    id: 9,
    categoryName: "tools",
    displayName: "Tools",
    iconName: "tools",
    colorCode: "#5D4037",
    priority: 9,
    description: "Hammers, screwdrivers, lockpicks",
  },
  {
    id: 10,
    categoryName: "other",
    displayName: "Other",
    iconName: "dots-horizontal",
    colorCode: "#616161",
    priority: 10,
    description: "Miscellaneous items",
  },
];

const CATEGORIES_STORAGE_KEY = "csi_categories";

export async function initializeCategories(): Promise<void> {
  const existing = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (!existing) {
    await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(CATEGORIES));
  }
}

export async function getCategories(): Promise<Category[]> {
  const data = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  await initializeCategories();
  return CATEGORIES;
}

export function getCategoryById(id: number): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getCategoryByName(name: string): Category | undefined {
  return CATEGORIES.find((c) => c.categoryName === name.toLowerCase());
}

export function getCategoryColor(categoryId: number): string {
  const category = getCategoryById(categoryId);
  return category?.colorCode || "#616161";
}

export function getCategoryIcon(categoryId: number): string {
  const category = getCategoryById(categoryId);
  return category?.iconName || "dots-horizontal";
}

export interface CategorizedObject {
  id: string;
  evidenceId: string;
  evidenceUri?: string;
  objectName: string;
  confidence: "high" | "medium" | "low";
  location: string;
  categoryId: number;
  categoryName: string;
  detectedAt: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CategorizedObjectsData {
  caseId: string;
  objects: CategorizedObject[];
}

export async function getCategorizedObjects(caseId: string): Promise<CategorizedObjectsData | null> {
  const data = await AsyncStorage.getItem(`detectedObjects_${caseId}`);
  if (data) {
    return JSON.parse(data);
  }
  return null;
}

export async function saveCategorizedObjects(
  caseId: string,
  objects: CategorizedObject[]
): Promise<void> {
  const existing = await getCategorizedObjects(caseId);
  const data: CategorizedObjectsData = {
    caseId,
    objects: existing ? [...existing.objects, ...objects] : objects,
  };
  await AsyncStorage.setItem(`detectedObjects_${caseId}`, JSON.stringify(data));
}

export async function getObjectsByCategory(
  caseId: string,
  categoryId: number
): Promise<CategorizedObject[]> {
  const data = await getCategorizedObjects(caseId);
  if (!data) return [];
  return data.objects.filter((obj) => obj.categoryId === categoryId);
}

export async function getObjectsByEvidence(
  caseId: string,
  evidenceId: string
): Promise<CategorizedObject[]> {
  const data = await getCategorizedObjects(caseId);
  if (!data) return [];
  return data.objects.filter((obj) => obj.evidenceId === evidenceId);
}

export interface CategoryStats {
  category: Category;
  count: number;
  avgConfidence: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
}

export async function getCategoryStats(caseId: string): Promise<CategoryStats[]> {
  const data = await getCategorizedObjects(caseId);
  const objects = data?.objects || [];

  const stats: CategoryStats[] = CATEGORIES.map((category) => {
    const categoryObjects = objects.filter((obj) => obj.categoryId === category.id);
    
    const highCount = categoryObjects.filter((o) => o.confidence === "high").length;
    const mediumCount = categoryObjects.filter((o) => o.confidence === "medium").length;
    const lowCount = categoryObjects.filter((o) => o.confidence === "low").length;
    
    const confidenceValues = categoryObjects.map((o) => {
      switch (o.confidence) {
        case "high": return 1;
        case "medium": return 0.66;
        case "low": return 0.33;
        default: return 0.5;
      }
    });
    
    const avgConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0;

    return {
      category,
      count: categoryObjects.length,
      avgConfidence,
      highConfidenceCount: highCount,
      mediumConfidenceCount: mediumCount,
      lowConfidenceCount: lowCount,
    };
  });

  return stats.sort((a, b) => a.category.priority - b.category.priority);
}

export function groupObjectsByCategory(
  objects: CategorizedObject[]
): Record<string, CategorizedObject[]> {
  return objects.reduce((acc, obj) => {
    const categoryName = obj.categoryName;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(obj);
    return acc;
  }, {} as Record<string, CategorizedObject[]>);
}
