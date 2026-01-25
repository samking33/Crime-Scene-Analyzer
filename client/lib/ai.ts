import { getApiUrl } from "@/lib/query-client";
import type { DetectedObject } from "@/types/case";

export interface AnalysisResult {
  detectedObjects: DetectedObject[];
  aiSummary: string;
  analysis: string;
  objectCount: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export async function analyzeImage(base64Image: string): Promise<AnalysisResult | null> {
  try {
    const url = new URL("/api/analyze-image", getApiUrl());
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      console.error("Image analysis failed:", response.status);
      return null;
    }

    const data = await response.json();
    return {
      detectedObjects: data.detectedObjects || [],
      aiSummary: data.aiSummary || "",
      analysis: data.analysis || "",
      objectCount: data.objectCount || 0,
      confidenceDistribution: data.confidenceDistribution || { high: 0, medium: 0, low: 0 },
    };
  } catch (error) {
    console.error("Failed to analyze image:", error);
    return null;
  }
}
