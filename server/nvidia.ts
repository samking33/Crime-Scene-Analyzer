import sharp from "sharp";

const NIM_GROUNDING_DINO_URL = "https://ai.api.nvidia.com/v1/cv/nvidia/nv-grounding-dino";
const NIM_PALIGEMMA_URL = "https://ai.api.nvidia.com/v1/vlm/google/paligemma";
const NVCF_ASSETS_URL = "https://api.nvcf.nvidia.com/v2/nvcf/assets";
const NVCF_POLLING_URL = "https://api.nvcf.nvidia.com/v2/nvcf/pexec/status/";

const MAX_INLINE_IMAGE_BYTES = 180_000;
const MAX_POLL_RETRIES = 6;
const POLL_DELAY_MS = 1000;

export interface GroundingDinoDetection {
  label: string;
  score: number;
  box:
    | [number, number, number, number]
    | { x: number; y: number; width: number; height: number }
    | { xmin: number; ymin: number; xmax: number; ymax: number }
    | { x1: number; y1: number; x2: number; y2: number };
  imageWidth?: number;
  imageHeight?: number;
}

export function detectImageMimeType(base64Image: string): string {
  try {
    const buffer = Buffer.from(base64Image.slice(0, 64), "base64");
    if (buffer.length >= 4) {
      if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
        return "image/png";
      if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "image/gif";
      if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46)
        return "image/webp";
    }
  } catch {
    // ignore decode errors
  }
  return "image/jpeg";
}

export function buildGroundingPrompt(categoryKeywords: Record<number, string[]>): string {
  const categories = [
    "weapons",
    "vehicles",
    "persons",
    "biometrics",
    "drugs",
    "documents",
    "electronics",
    "evidence markers",
    "tools",
    "other relevant objects",
  ];

  const maxLength = 600;
  const maxPerCategory = 2;
  const tokens: string[] = [...categories];

  for (const keywords of Object.values(categoryKeywords)) {
    let added = 0;
    for (const keyword of keywords) {
      if (added >= maxPerCategory) break;
      if (tokens.join(", ").length + keyword.length + 2 > maxLength) {
        break;
      }
      tokens.push(keyword);
      added += 1;
    }
  }

  return `Detect and localize the following objects if present: ${tokens.join(", ")}.`;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadAsset({
  buffer,
  contentType,
  description,
  apiKey,
}: {
  buffer: Buffer;
  contentType: string;
  description: string;
  apiKey: string;
}): Promise<string> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    accept: "application/json",
  };

  const payload = {
    contentType,
    description,
  };

  const response = await fetch(NVCF_ASSETS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create NVCF asset: ${response.status}`);
  }

  const data = (await response.json()) as { uploadUrl?: string; assetId?: string };
  if (!data.uploadUrl || !data.assetId) {
    throw new Error("NVCF asset response missing uploadUrl or assetId");
  }

  const s3Headers: Record<string, string> = {
    "content-type": contentType,
    "x-amz-meta-nvcf-asset-description": description,
  };

  const uploadResponse = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: s3Headers,
    body: buffer as unknown as BodyInit,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload NVCF asset: ${uploadResponse.status}`);
  }

  return data.assetId.toString();
}

async function downscaleBase64Image(
  imageBase64: string,
  maxBytes: number,
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const buffer = Buffer.from(imageBase64, "base64");
    const sizeTargets = [1024, 768, 640, 512, 384];
    const qualityTargets = [80, 70, 60];

    for (const maxDim of sizeTargets) {
      for (const quality of qualityTargets) {
        const outBuffer = await sharp(buffer)
          .resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();

        if (outBuffer.length <= maxBytes) {
          return {
            base64: outBuffer.toString("base64"),
            mimeType: "image/jpeg",
          };
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function buildMediaUrl({
  imageBase64,
  mimeType,
  apiKey,
  description,
}: {
  imageBase64: string;
  mimeType: string;
  apiKey: string;
  description: string;
}): Promise<{ mediaUrl: string; assetId?: string }> {
  const byteLength = Buffer.byteLength(imageBase64, "base64");
  if (byteLength > MAX_INLINE_IMAGE_BYTES) {
    const downscaled = await downscaleBase64Image(imageBase64, MAX_INLINE_IMAGE_BYTES);
    if (downscaled) {
      return {
        mediaUrl: `data:${downscaled.mimeType};base64,${downscaled.base64}`,
      };
    }

    const buffer = Buffer.from(imageBase64, "base64");
    const assetId = await uploadAsset({
      buffer,
      contentType: mimeType,
      description,
      apiKey,
    });

    return {
      mediaUrl: `data:${mimeType};asset_id,${assetId}`,
      assetId,
    };
  }

  return {
    mediaUrl: `data:${mimeType};base64,${imageBase64}`,
  };
}

async function parseNvcfResponse(response: Response, apiKey: string): Promise<unknown> {
  if (response.status === 202) {
    const reqId = response.headers.get("NVCF-REQID");
    if (!reqId) {
      throw new Error("NVCF response pending but missing NVCF-REQID header");
    }

    let retries = MAX_POLL_RETRIES;
    while (retries > 0) {
      await sleep(POLL_DELAY_MS);
      const pollResponse = await fetch(`${NVCF_POLLING_URL}${reqId}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (pollResponse.status === 202) {
        retries -= 1;
        continue;
      }

      if (!pollResponse.ok) {
        throw new Error(`NVCF polling failed: ${pollResponse.status}`);
      }

      return parseResponseBody(pollResponse);
    }

    throw new Error("NVCF polling exceeded max retries");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVCF request failed: ${response.status} ${errorText}`);
  }

  return parseResponseBody(response);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const text = buffer.toString("utf-8");
  try {
    return JSON.parse(text);
  } catch {
    return { binary: buffer, contentType };
  }
}

function normalizeBoxValue(box: GroundingDinoDetection["box"]): [number, number, number, number] | null {
  if (Array.isArray(box) && box.length >= 4) {
    return [box[0], box[1], box[2], box[3]];
  }

  if ("xmin" in box && "ymin" in box && "xmax" in box && "ymax" in box) {
    return [box.xmin, box.ymin, box.xmax, box.ymax];
  }

  if ("x1" in box && "y1" in box && "x2" in box && "y2" in box) {
    return [box.x1, box.y1, box.x2, box.y2];
  }

  if ("x" in box && "y" in box && "width" in box && "height" in box) {
    return [box.x, box.y, box.x + box.width, box.y + box.height];
  }

  return null;
}

function extractDetections(data: unknown): GroundingDinoDetection[] {
  if (!data || typeof data !== "object") return [];

  const dataObject = data as Record<string, unknown>;
  const choices = dataObject.choices as Array<Record<string, unknown>> | undefined;
  if (choices && choices.length > 0) {
    const message = choices[0].message as Record<string, unknown> | undefined;
    const content = message?.content as Record<string, unknown> | undefined;
    const boundingBoxes = content?.boundingBoxes as Array<Record<string, unknown>> | undefined;
    const frameWidth = (content?.frameWidth as number | undefined) ?? (content?.width as number | undefined);
    const frameHeight =
      (content?.frameHeight as number | undefined) ?? (content?.height as number | undefined);

    if (Array.isArray(boundingBoxes) && boundingBoxes.length > 0) {
      const detections: GroundingDinoDetection[] = [];
      boundingBoxes.forEach((entry) => {
        const phrase = entry.phrase as string | undefined;
        const bboxes = entry.bboxes as Array<Array<number>> | undefined;
        const confidences = entry.confidence as Array<number> | undefined;
        if (!phrase || !Array.isArray(bboxes)) return;

        bboxes.forEach((bbox, index) => {
          if (!Array.isArray(bbox) || bbox.length < 4) return;
          const score = confidences?.[index] ?? 0;
          detections.push({
            label: phrase,
            score,
            box: { x: bbox[0], y: bbox[1], width: bbox[2], height: bbox[3] },
            imageWidth: frameWidth,
            imageHeight: frameHeight,
          });
        });
      });

      if (detections.length > 0) {
        return detections;
      }
    }
  }
  const candidates: unknown[] = [];

  const pushArray = (value: unknown) => {
    if (Array.isArray(value)) {
      candidates.push(...value);
    }
  };

  pushArray(dataObject.detections);
  pushArray(dataObject.objects);
  pushArray(dataObject.predictions);
  pushArray(dataObject.results);
  pushArray(dataObject.boxes);

  if ("data" in dataObject) {
    const inner = dataObject.data;
    if (Array.isArray(inner)) {
      candidates.push(...inner);
    } else if (inner && typeof inner === "object") {
      const innerObj = inner as Record<string, unknown>;
      pushArray(innerObj.detections);
      pushArray(innerObj.objects);
      pushArray(innerObj.predictions);
      pushArray(innerObj.results);
    }
  }

  const imageWidth = (dataObject.image_width ||
    dataObject.imageWidth ||
    dataObject.width) as number | undefined;
  const imageHeight = (dataObject.image_height ||
    dataObject.imageHeight ||
    dataObject.height) as number | undefined;

  if (candidates.length === 0 && "labels" in dataObject && "boxes" in dataObject) {
    const labels = dataObject.labels as unknown[];
    const boxes = dataObject.boxes as unknown[];
    const scores = (dataObject.scores || dataObject.confidences) as unknown[] | undefined;
    const results: GroundingDinoDetection[] = [];

    if (Array.isArray(labels) && Array.isArray(boxes)) {
      boxes.forEach((box, index) => {
        const label = labels[index] as string | undefined;
        const score = scores?.[index] as number | undefined;
        if (!label || typeof score !== "number") return;
        results.push({
          label,
          score,
          box: box as GroundingDinoDetection["box"],
          imageWidth,
          imageHeight,
        });
      });
    }

    return results;
  }

  return candidates
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const label =
        (obj.label ||
          obj.phrase ||
          obj.text ||
          obj.name ||
          obj.category ||
          obj.class) as string | undefined;
      const score =
        (obj.score ||
          obj.confidence ||
          obj.probability ||
          obj.logit ||
          obj.similarity) as number | undefined;
      const box =
        (obj.box ||
          obj.bbox ||
          obj.bounding_box ||
          obj.boundingBox ||
          obj.rect ||
          obj.region) as GroundingDinoDetection["box"] | undefined;

      if (!label || typeof score !== "number" || !box) return null;

      const normalized = normalizeBoxValue(box);
      return {
        label,
        score,
        box: normalized || box,
        imageWidth,
        imageHeight,
      } as GroundingDinoDetection;
    })
    .filter(Boolean) as GroundingDinoDetection[];
}

export async function groundingDinoDetectObjects({
  imageBase64,
  mimeType,
  prompt,
  threshold,
  apiKey,
}: {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  threshold: number;
  apiKey: string;
}): Promise<GroundingDinoDetection[]> {
  const { mediaUrl, assetId } = await buildMediaUrl({
    imageBase64,
    mimeType,
    apiKey,
    description: "Grounding DINO input image",
  });

  const payload = {
    model: "Grounding-Dino",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "media_url",
            media_url: {
              url: mediaUrl,
            },
          },
        ],
      },
    ],
    threshold,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  if (assetId) {
    headers["NVCF-INPUT-ASSET-REFERENCES"] = assetId;
    headers["NVCF-FUNCTION-ASSET-IDS"] = assetId;
  }

  const response = await fetch(NIM_GROUNDING_DINO_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const result = await parseNvcfResponse(response, apiKey);
  const detections = extractDetections(result);

  return detections;
}

function extractSummaryText(result: unknown): string | null {
  if (!result) return null;

  if (typeof result === "string") return result.trim();

  const data = result as Record<string, unknown>;
  const choices = data.choices as Array<Record<string, unknown>> | undefined;
  if (choices && choices.length > 0) {
    const message = choices[0].message as Record<string, unknown> | undefined;
    if (message && typeof message.content === "string") {
      return message.content.trim();
    }
    if (typeof choices[0].text === "string") {
      return choices[0].text.trim();
    }
  }

  if (typeof data.output === "string") return data.output.trim();
  if (typeof data.text === "string") return data.text.trim();

  return null;
}

export async function paligemmaSummarizeImage({
  imageBase64,
  mimeType,
  apiKey,
  prompt,
}: {
  imageBase64: string;
  mimeType: string;
  apiKey: string;
  prompt?: string;
}): Promise<string> {
  const { mediaUrl, assetId } = await buildMediaUrl({
    imageBase64,
    mimeType,
    apiKey,
    description: "PaliGemma input image",
  });

  const defaultPrompt = `Describe the image in 2-3 sentences. <img src="${mediaUrl}" />`;
  const fallbackPrompt = `Describe the image in one concise sentence. <img src="${mediaUrl}" />`;
  const promptCandidates = prompt ? [prompt] : [defaultPrompt, fallbackPrompt];

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (assetId) {
    headers["NVCF-INPUT-ASSET-REFERENCES"] = assetId;
    headers["NVCF-FUNCTION-ASSET-IDS"] = assetId;
  }

  let lastError: Error | null = null;

  for (const candidate of promptCandidates) {
    const payload = {
      messages: [
        {
          role: "user",
          content: candidate,
        },
      ],
      max_tokens: candidate === fallbackPrompt ? 128 : 256,
      temperature: candidate === fallbackPrompt ? 0.2 : 0.4,
      top_p: 0.7,
      stream: false,
    };

    const response = await fetch(NIM_PALIGEMMA_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      lastError = new Error(`PaliGemma request failed: ${response.status} ${errorText}`);
      continue;
    }

    const result = (await parseResponseBody(response)) as unknown;
    const summary = extractSummaryText(result);

    if (!summary) {
      lastError = new Error("PaliGemma returned an empty response");
      continue;
    }

    return summary;
  }

  throw lastError || new Error("PaliGemma failed to generate a summary");
}
