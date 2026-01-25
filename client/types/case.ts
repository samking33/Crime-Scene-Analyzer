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
  videoRecordingStartTime?: number;
  videoRecordingEndTime?: number;
  investigationStartTime?: string;
  investigationEndTime?: string;
  backgroundVideoUri?: string;
  backgroundVideoDuration?: number;
}

export type EvidenceType = "photo" | "video" | "audio" | "note";

export interface Evidence {
  id: string;
  caseId: string;
  type: EvidenceType;
  uri?: string;
  content?: string;
  timestamp: string;
  relativeTimestamp?: number;
  absoluteTimestamp?: number;
  latitude?: number;
  longitude?: number;
  duration?: number;
  detectedObjects?: DetectedObject[];
  aiAnalysis?: string;
  aiSummary?: string;
  analysisStatus?: "pending" | "analyzing" | "completed" | "failed";
}

export interface TimelineEvent {
  id: string;
  type: "investigation_start" | "investigation_end" | "photo" | "video" | "audio" | "note";
  timestamp: string;
  relativeTimestamp?: number;
  label: string;
  details?: string;
  evidenceId?: string;
  category?: ObjectCategory;
}

export type ObjectCategory = "weapon" | "vehicle" | "person" | "document" | "drug" | "biometric" | "electronics" | "markers" | "tools" | "other";
export type ConfidenceLevel = "high" | "medium" | "low";
export type ObjectLocation = "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right";

export interface DetectedObject {
  id: string;
  label: string;
  confidence: ConfidenceLevel;
  category: ObjectCategory;
  location: ObjectLocation;
  description?: string;
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
