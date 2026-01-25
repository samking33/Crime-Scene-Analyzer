import { getApiUrl } from "@/lib/query-client";
import type { DetectedObject } from "@/types/case";

export interface AnalysisResult {
  detectedObjects: DetectedObject[];
  aiSummary: string;
  analysis: string;
  objectCount: number;
  annotatedImage?: string;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export async function analyzeImage(base64Image: string): Promise<AnalysisResult | null> {
  try {
    const url = new URL("/api/analyze-image", getApiUrl());
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Image }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("Image analysis failed:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    return {
      detectedObjects: data.detectedObjects || [],
      aiSummary: data.aiSummary || "",
      analysis: data.analysis || "",
      objectCount: data.objectCount || 0,
      annotatedImage: data.annotatedImage || undefined,
      confidenceDistribution: data.confidenceDistribution || { high: 0, medium: 0, low: 0 },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Image analysis timed out after 120 seconds");
    } else {
      console.error("Failed to analyze image:", error);
    }
    return null;
  }
}
