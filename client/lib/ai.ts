import { getApiUrl } from "@/lib/query-client";

export async function analyzeImage(base64Image: string): Promise<string | null> {
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
    return data.analysis || null;
  } catch (error) {
    console.error("Failed to analyze image:", error);
    return null;
  }
}
