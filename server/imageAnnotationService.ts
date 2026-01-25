import { createCanvas, loadImage } from "canvas";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedObjectWithBox {
  name: string;
  confidence: string;
  category: string;
  boundingBox: BoundingBox;
}

const CATEGORY_COLORS: Record<string, string> = {
  weapons: "#D32F2F",
  weapon: "#D32F2F",
  vehicles: "#F57C00",
  vehicle: "#F57C00",
  persons: "#1976D2",
  person: "#1976D2",
  biometrics: "#7B1FA2",
  biometric: "#7B1FA2",
  drugs: "#C62828",
  drug: "#C62828",
  documents: "#388E3C",
  document: "#388E3C",
  electronics: "#00796B",
  evidenceMarkers: "#FBC02D",
  markers: "#FBC02D",
  tools: "#5D4037",
  other: "#616161",
};

export async function drawBoundingBoxes(
  base64Image: string,
  detectedObjects: DetectedObjectWithBox[]
): Promise<string> {
  try {
    const imageBuffer = Buffer.from(base64Image, "base64");
    const img = await loadImage(imageBuffer);

    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(img, 0, 0);

    detectedObjects.forEach((obj, index) => {
      const { boundingBox, category, name, confidence } = obj;

      if (!boundingBox) return;

      const x = boundingBox.x * img.width;
      const y = boundingBox.y * img.height;
      const width = boundingBox.width * img.width;
      const height = boundingBox.height * img.height;

      const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      const labelText = `${name} - ${confidence}`;
      ctx.font = "bold 14px Arial";
      const textMetrics = ctx.measureText(labelText);
      const labelHeight = 24;
      const labelWidth = textMetrics.width + 16;

      ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(labelText, x + 8, y - 8);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x - 12, y - 12, 16, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText((index + 1).toString(), x - 12, y - 7);
      ctx.textAlign = "left";
    });

    const annotatedBuffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
    return annotatedBuffer.toString("base64");
  } catch (error) {
    console.error("Error drawing bounding boxes:", error);
    throw error;
  }
}
