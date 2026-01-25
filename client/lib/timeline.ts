import type { Evidence, TimelineEvent, Case } from "@/types/case";

export function formatTimecode(seconds: number, includeHours = false): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  if (includeHours || hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatRelativeTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0m 0s";
  
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
}

export function formatAbsoluteTime(timestamp: string | number): string {
  const date = typeof timestamp === "number" 
    ? new Date(timestamp) 
    : new Date(timestamp);
  
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatFullTimestamp(timestamp: string | number, relativeSeconds?: number): string {
  const absoluteTime = formatAbsoluteTime(timestamp);
  
  if (relativeSeconds !== undefined && relativeSeconds >= 0) {
    const relativeFormatted = formatRelativeTimestamp(relativeSeconds);
    return `${absoluteTime} (${relativeFormatted} into investigation)`;
  }
  
  return absoluteTime;
}

export function calculateMarkerPosition(
  relativeTimestamp: number,
  totalDuration: number
): number {
  if (totalDuration <= 0 || relativeTimestamp < 0) return 0;
  return Math.min(1, Math.max(0, relativeTimestamp / totalDuration));
}

export function getTimelineEvents(
  caseData: Case,
  evidenceList: Evidence[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  if (caseData.investigationStartTime) {
    events.push({
      id: `start-${caseData.id}`,
      type: "investigation_start",
      timestamp: caseData.investigationStartTime,
      relativeTimestamp: 0,
      label: "Investigation Started",
      details: `Case ${caseData.caseId} investigation began`,
    });
  }
  
  evidenceList.forEach((evidence) => {
    const primaryCategory = evidence.detectedObjects?.[0]?.category;
    
    let label = "";
    switch (evidence.type) {
      case "photo":
        label = `Photo captured${evidence.detectedObjects?.length ? ` - ${evidence.detectedObjects.length} objects detected` : ""}`;
        break;
      case "video":
        label = `Video recorded${evidence.duration ? ` (${formatTimecode(evidence.duration)})` : ""}`;
        break;
      case "audio":
        label = `Audio recorded${evidence.duration ? ` (${formatTimecode(evidence.duration)})` : ""}`;
        break;
      case "note":
        label = `Note added`;
        break;
    }
    
    events.push({
      id: evidence.id,
      type: evidence.type,
      timestamp: evidence.timestamp,
      relativeTimestamp: evidence.relativeTimestamp,
      label,
      details: evidence.aiSummary || evidence.content?.substring(0, 100),
      evidenceId: evidence.id,
      category: primaryCategory,
    });
  });
  
  if (caseData.investigationEndTime) {
    let endRelativeTimestamp: number | undefined;
    if (caseData.videoRecordingStartTime && caseData.videoRecordingEndTime) {
      endRelativeTimestamp = (caseData.videoRecordingEndTime - caseData.videoRecordingStartTime) / 1000;
    }
    
    events.push({
      id: `end-${caseData.id}`,
      type: "investigation_end",
      timestamp: caseData.investigationEndTime,
      relativeTimestamp: endRelativeTimestamp,
      label: "Investigation Ended",
      details: endRelativeTimestamp ? `Duration: ${formatRelativeTimestamp(endRelativeTimestamp)}` : undefined,
    });
  }
  
  events.sort((a, b) => {
    if (a.relativeTimestamp !== undefined && b.relativeTimestamp !== undefined) {
      return a.relativeTimestamp - b.relativeTimestamp;
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
  
  return events;
}

export function getEvidenceAtTime(
  evidenceList: Evidence[],
  targetSeconds: number,
  tolerance: number = 2
): Evidence | null {
  const sorted = [...evidenceList]
    .filter((e) => e.relativeTimestamp !== undefined)
    .sort((a, b) => (a.relativeTimestamp || 0) - (b.relativeTimestamp || 0));
  
  for (const evidence of sorted) {
    const diff = Math.abs((evidence.relativeTimestamp || 0) - targetSeconds);
    if (diff <= tolerance) {
      return evidence;
    }
  }
  
  return null;
}

export function getNextEvidence(
  evidenceList: Evidence[],
  currentSeconds: number
): Evidence | null {
  const photos = evidenceList
    .filter((e) => e.type === "photo" && e.relativeTimestamp !== undefined)
    .sort((a, b) => (a.relativeTimestamp || 0) - (b.relativeTimestamp || 0));
  
  for (const evidence of photos) {
    if ((evidence.relativeTimestamp || 0) > currentSeconds) {
      return evidence;
    }
  }
  
  return null;
}

export function getPreviousEvidence(
  evidenceList: Evidence[],
  currentSeconds: number
): Evidence | null {
  const photos = evidenceList
    .filter((e) => e.type === "photo" && e.relativeTimestamp !== undefined)
    .sort((a, b) => (b.relativeTimestamp || 0) - (a.relativeTimestamp || 0));
  
  for (const evidence of photos) {
    if ((evidence.relativeTimestamp || 0) < currentSeconds) {
      return evidence;
    }
  }
  
  return null;
}

export function generateTimeTickMarks(
  totalDuration: number,
  intervalSeconds: number = 300
): { position: number; label: string }[] {
  const ticks: { position: number; label: string }[] = [];
  
  if (totalDuration <= 0) return ticks;
  
  for (let seconds = 0; seconds <= totalDuration; seconds += intervalSeconds) {
    ticks.push({
      position: seconds / totalDuration,
      label: formatTimecode(seconds),
    });
  }
  
  if (ticks.length > 0 && ticks[ticks.length - 1].position < 1) {
    ticks.push({
      position: 1,
      label: formatTimecode(totalDuration),
    });
  }
  
  return ticks;
}

export function getCategoryColor(category?: string): string {
  switch (category) {
    case "weapon":
      return "#FF4444";
    case "vehicle":
      return "#FFCC00";
    case "person":
      return "#4488FF";
    case "document":
      return "#44CC44";
    case "drug":
      return "#FF8800";
    case "biometric":
      return "#AA44FF";
    default:
      return "#888888";
  }
}
