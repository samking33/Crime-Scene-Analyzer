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

export type EvidenceType = "photo" | "video" | "audio" | "note";

export interface Evidence {
  id: string;
  caseId: string;
  type: EvidenceType;
  uri?: string;
  content?: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  duration?: number;
  detectedObjects?: DetectedObject[];
  aiAnalysis?: string;
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
  pdfUri?: string;
}

export interface OfficerProfile {
  name: string;
  badgeNumber: string;
  department: string;
}
