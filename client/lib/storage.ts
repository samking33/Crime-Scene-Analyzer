import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import type { Case, Evidence, ActivityLog, Report, OfficerProfile } from "@/types/case";

const CASES_KEY = "@cases";
const EVIDENCE_KEY = "@evidence";
const ACTIVITY_LOG_KEY = "@activity_log";
const REPORTS_KEY = "@reports";
const PROFILE_KEY = "@profile";
const ACTIVE_CASE_KEY = "@active_case";

function generateCaseId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `CSI-${year}-${random}`;
}

export async function getCases(): Promise<Case[]> {
  try {
    const data = await AsyncStorage.getItem(CASES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function getCase(id: string): Promise<Case | null> {
  const cases = await getCases();
  return cases.find((c) => c.id === id) || null;
}

export async function createCase(data: { title: string; location: string; leadOfficer: string }): Promise<Case> {
  const cases = await getCases();
  const now = new Date().toISOString();
  const newCase: Case = {
    id: uuidv4(),
    caseId: generateCaseId(),
    title: data.title,
    location: data.location,
    leadOfficer: data.leadOfficer,
    createdAt: now,
    updatedAt: now,
    status: "pending",
    evidenceCount: 0,
  };
  cases.unshift(newCase);
  await AsyncStorage.setItem(CASES_KEY, JSON.stringify(cases));
  await logActivity(newCase.id, "Case created", data.leadOfficer, `Case ${newCase.caseId} created`);
  return newCase;
}

export async function updateCase(id: string, updates: Partial<Case>): Promise<Case | null> {
  const cases = await getCases();
  const index = cases.findIndex((c) => c.id === id);
  if (index === -1) return null;
  cases[index] = { ...cases[index], ...updates, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(CASES_KEY, JSON.stringify(cases));
  return cases[index];
}

export async function deleteCase(id: string): Promise<boolean> {
  const cases = await getCases();
  const filtered = cases.filter((c) => c.id !== id);
  if (filtered.length === cases.length) return false;
  await AsyncStorage.setItem(CASES_KEY, JSON.stringify(filtered));
  const evidence = await getEvidence(id);
  if (evidence.length > 0) {
    const allEvidence = await getAllEvidence();
    await AsyncStorage.setItem(EVIDENCE_KEY, JSON.stringify(allEvidence.filter((e) => e.caseId !== id)));
  }
  return true;
}

export async function getActiveCase(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_CASE_KEY);
  } catch {
    return null;
  }
}

export async function setActiveCase(caseId: string | null): Promise<void> {
  if (caseId) {
    await AsyncStorage.setItem(ACTIVE_CASE_KEY, caseId);
  } else {
    await AsyncStorage.removeItem(ACTIVE_CASE_KEY);
  }
}

async function getAllEvidence(): Promise<Evidence[]> {
  try {
    const data = await AsyncStorage.getItem(EVIDENCE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function getEvidence(caseId: string): Promise<Evidence[]> {
  const allEvidence = await getAllEvidence();
  return allEvidence.filter((e) => e.caseId === caseId).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function addEvidence(evidence: Omit<Evidence, "id">): Promise<Evidence> {
  const allEvidence = await getAllEvidence();
  const newEvidence: Evidence = {
    ...evidence,
    id: uuidv4(),
  };
  allEvidence.push(newEvidence);
  await AsyncStorage.setItem(EVIDENCE_KEY, JSON.stringify(allEvidence));
  
  const caseData = await getCase(evidence.caseId);
  if (caseData) {
    await updateCase(evidence.caseId, { evidenceCount: caseData.evidenceCount + 1 });
  }
  
  return newEvidence;
}

export async function getActivityLog(caseId: string): Promise<ActivityLog[]> {
  try {
    const data = await AsyncStorage.getItem(ACTIVITY_LOG_KEY);
    const logs: ActivityLog[] = data ? JSON.parse(data) : [];
    return logs.filter((l) => l.caseId === caseId).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch {
    return [];
  }
}

export async function logActivity(caseId: string, action: string, officerName: string, details?: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(ACTIVITY_LOG_KEY);
    const logs: ActivityLog[] = data ? JSON.parse(data) : [];
    logs.push({
      id: uuidv4(),
      caseId,
      action,
      timestamp: new Date().toISOString(),
      officerName,
      details,
    });
    await AsyncStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logs));
  } catch {
    console.error("Failed to log activity");
  }
}

export async function getReports(): Promise<Report[]> {
  try {
    const data = await AsyncStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function createReport(caseData: Case): Promise<Report> {
  const reports = await getReports();
  const evidence = await getEvidence(caseData.id);
  const newReport: Report = {
    id: uuidv4(),
    caseId: caseData.id,
    caseTitle: caseData.title,
    generatedAt: new Date().toISOString(),
    evidenceCount: evidence.length,
    status: "generated",
  };
  reports.unshift(newReport);
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  return newReport;
}

export async function getProfile(): Promise<OfficerProfile> {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : {
      name: "Officer",
      badgeNumber: "000000",
      department: "Police Department",
    };
  } catch {
    return {
      name: "Officer",
      badgeNumber: "000000",
      department: "Police Department",
    };
  }
}

export async function saveProfile(profile: OfficerProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
