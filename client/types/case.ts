export type CaseStatus = "active" | "closed" | "pending";

export interface Case {
  id: string;
  caseId: string;
  title: string;
  location: string;
  leadOfficer: string;
  createdAt: string;
  updatedAt: string;
  status: CaseStatus;
  evidenceCount: number;
  thumbnail?: string;
}

export interface Evidence {
  id: string;
  caseId: string;
  type: "photo" | "audio" | "note";
  uri?: string;
  content?: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  detectedObjects?: DetectedObject[];
}

export interface DetectedObject {
  label: string;
  confidence: number;
  category: "weapon" | "vehicle" | "person" | "document" | "drug" | "other";
}

export interface ActivityLog {
  id: string;
  caseId: string;
  action: string;
  timestamp: string;
  officerName: string;
  details?: string;
}

export interface Report {
  id: string;
  caseId: string;
  caseTitle: string;
  generatedAt: string;
  evidenceCount: number;
  status: "generated" | "exported";
}

export interface OfficerProfile {
  name: string;
  badgeNumber: string;
  department: string;
}
