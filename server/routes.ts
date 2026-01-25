import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import { drawBoundingBoxes } from "./imageAnnotationService";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedObject {
  id: string;
  label: string;
  confidence: "high" | "medium" | "low";
  category: "weapon" | "vehicle" | "person" | "document" | "drug" | "biometric" | "electronics" | "markers" | "tools" | "other";
  categoryId: number;
  location: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right";
  boundingBox?: BoundingBox;
  description?: string;
}

const categoryKeywords: Record<number, string[]> = {
  1: ['gun', 'pistol', 'rifle', 'knife', 'blade', 'weapon', 'firearm', 'ammunition', 'bullet', 'shell casing', 'revolver', 'shotgun', 'machete', 'brass knuckles'],
  2: ['car', 'truck', 'van', 'motorcycle', 'bicycle', 'vehicle', 'suv', 'sedan', 'license plate', 'tire', 'windshield', 'headlight', 'bumper'],
  3: ['person', 'individual', 'suspect', 'victim', 'witness', 'face', 'body', 'human', 'male', 'female', 'man', 'woman', 'child'],
  4: ['blood', 'fingerprint', 'dna', 'bodily fluid', 'footprint', 'shoe print', 'hair', 'saliva', 'tissue', 'stain'],
  5: ['drugs', 'narcotics', 'pills', 'powder', 'syringe', 'paraphernalia', 'marijuana', 'cocaine', 'heroin', 'meth', 'substance', 'needle'],
  6: ['document', 'paper', 'id card', 'passport', 'receipt', 'letter', 'note', 'contract', 'certificate', 'license', 'envelope', 'folder'],
  7: ['phone', 'computer', 'laptop', 'tablet', 'camera', 'usb', 'hard drive', 'sim card', 'charger', 'battery', 'device', 'electronic', 'smartphone', 'memory card'],
  8: ['evidence marker', 'cone', 'flag', 'numbered marker', 'tape', 'barrier', 'crime scene tape', 'yellow tape', 'marker'],
  9: ['hammer', 'screwdriver', 'crowbar', 'lockpick', 'tool', 'pliers', 'wrench', 'drill', 'saw', 'wire cutter'],
  10: []
};

const categoryIdToName: Record<number, DetectedObject["category"]> = {
  1: "weapon",
  2: "vehicle",
  3: "person",
  4: "biometric",
  5: "drug",
  6: "document",
  7: "electronics",
  8: "markers",
  9: "tools",
  10: "other"
};

function categorizeObjectByKeyword(objectName: string): { categoryId: number; category: DetectedObject["category"] } {
  const nameLower = objectName.toLowerCase();
  
  for (const [categoryId, keywords] of Object.entries(categoryKeywords)) {
    const id = parseInt(categoryId);
    if (keywords.some(keyword => nameLower.includes(keyword))) {
      return { categoryId: id, category: categoryIdToName[id] };
    }
  }
  
  return { categoryId: 10, category: "other" };
}

function generateObjectId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function parseDetectedObjects(content: string): DetectedObject[] {
  const objects: DetectedObject[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const match = line.match(/^[-•*]?\s*(.+?):\s*(.+)$/);
    if (match) {
      const label = match[1].trim();
      const details = match[2].trim().toLowerCase();
      
      let confidence: "high" | "medium" | "low" = "medium";
      if (details.includes("high")) confidence = "high";
      else if (details.includes("low")) confidence = "low";
      
      const { categoryId, category } = categorizeObjectByKeyword(label);
      
      let location: DetectedObject["location"] = "center";
      if (details.includes("top-left")) location = "top-left";
      else if (details.includes("top-right")) location = "top-right";
      else if (details.includes("top-center") || details.includes("top center")) location = "top-center";
      else if (details.includes("bottom-left")) location = "bottom-left";
      else if (details.includes("bottom-right")) location = "bottom-right";
      else if (details.includes("bottom-center") || details.includes("bottom center")) location = "bottom-center";
      else if (details.includes("center-left") || details.includes("left")) location = "center-left";
      else if (details.includes("center-right") || details.includes("right")) location = "center-right";
      
      objects.push({
        id: generateObjectId(),
        label,
        confidence,
        category,
        categoryId,
        location,
        description: match[2].trim(),
      });
    }
  }
  
  return objects;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "Image data is required" });
      }

      console.log("Starting image analysis, image size:", Math.round(image.length / 1024), "KB");

      const detectionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this crime scene evidence photo. Detect and list ALL visible objects relevant to law enforcement investigation including: weapons, vehicles, persons, license plates, drugs/substances, blood stains, fingerprints, documents, electronic devices, evidence markers, and any other notable items.

For each detected object, provide in JSON format:
{
  "objects": [
    {
      "name": "object name",
      "confidence": "high/medium/low",
      "category": "weapon/vehicle/person/biometric/drug/document/electronics/markers/tools/other",
      "boundingBox": {
        "x": 0.0-1.0,
        "y": 0.0-1.0, 
        "width": 0.0-1.0,
        "height": 0.0-1.0
      }
    }
  ],
  "summary": "2-3 sentence professional summary"
}

IMPORTANT: Bounding box coordinates must be normalized (0.0 to 1.0) relative to image dimensions.
- x: left edge position (0.0 = left, 1.0 = right)
- y: top edge position (0.0 = top, 1.0 = bottom)
- width: box width as fraction of image width
- height: box height as fraction of image height

Be thorough and objective. Detect every relevant visible item.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const responseContent = detectionResponse.choices[0]?.message?.content || "{}";
      let parsedResponse: { objects?: any[]; summary?: string } = {};
      
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        parsedResponse = { objects: [], summary: "" };
      }

      const rawObjects = parsedResponse.objects || [];
      const aiSummary = parsedResponse.summary || "";

      const detectedObjects: DetectedObject[] = rawObjects.map((obj: any) => {
        const { categoryId, category } = categorizeObjectByKeyword(obj.name);
        
        let location: DetectedObject["location"] = "center";
        if (obj.boundingBox) {
          const centerX = obj.boundingBox.x + obj.boundingBox.width / 2;
          const centerY = obj.boundingBox.y + obj.boundingBox.height / 2;
          
          if (centerY < 0.33) {
            if (centerX < 0.33) location = "top-left";
            else if (centerX > 0.66) location = "top-right";
            else location = "top-center";
          } else if (centerY > 0.66) {
            if (centerX < 0.33) location = "bottom-left";
            else if (centerX > 0.66) location = "bottom-right";
            else location = "bottom-center";
          } else {
            if (centerX < 0.33) location = "center-left";
            else if (centerX > 0.66) location = "center-right";
            else location = "center";
          }
        }

        return {
          id: generateObjectId(),
          label: obj.name,
          confidence: obj.confidence || "medium",
          category,
          categoryId,
          location,
          boundingBox: obj.boundingBox,
          description: `${obj.confidence} confidence detection`,
        };
      });

      let annotatedImage: string | null = null;
      const objectsWithBoxes = detectedObjects.filter(obj => obj.boundingBox);
      
      if (objectsWithBoxes.length > 0) {
        try {
          annotatedImage = await drawBoundingBoxes(
            image,
            objectsWithBoxes.map(obj => ({
              name: obj.label,
              confidence: obj.confidence,
              category: obj.category,
              boundingBox: obj.boundingBox!,
            }))
          );
        } catch (error) {
          console.error("Failed to draw bounding boxes:", error);
        }
      }

      res.json({ 
        detectedObjects,
        aiSummary,
        annotatedImage,
        analysis: aiSummary,
        objectCount: detectedObjects.length,
        confidenceDistribution: {
          high: detectedObjects.filter(o => o.confidence === "high").length,
          medium: detectedObjects.filter(o => o.confidence === "medium").length,
          low: detectedObjects.filter(o => o.confidence === "low").length,
        }
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // PDF report generation endpoint
  app.post("/api/generate-report", async (req, res) => {
    try {
      const { caseData, evidence, activityLog, profile } = req.body;
      
      if (!caseData) {
        return res.status(400).json({ error: "Case data is required" });
      }

      // Generate HTML for the PDF
      const html = generateReportHtml(caseData, evidence || [], activityLog || [], profile || {});
      
      res.json({ html });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

function generateReportHtml(
  caseData: any,
  evidence: any[],
  activityLog: any[],
  profile: any
): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimecode = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "N/A";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const evidenceRows = evidence.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.type.charAt(0).toUpperCase() + e.type.slice(1)}</td>
      <td>${formatDate(e.timestamp)}</td>
      <td>${e.relativeTimestamp !== undefined ? formatTimecode(e.relativeTimestamp) : "N/A"}</td>
      <td>${e.latitude && e.longitude ? `${e.latitude.toFixed(6)}, ${e.longitude.toFixed(6)}` : "N/A"}</td>
      <td>${e.aiSummary || e.aiAnalysis || "N/A"}</td>
    </tr>
  `).join("");

  const activityRows = activityLog.map((a) => `
    <tr>
      <td>${formatDate(a.timestamp)}</td>
      <td>${a.action}</td>
      <td>${a.officerName}</td>
      <td>${a.details || "N/A"}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Crime Scene Investigation Report - ${caseData.caseId}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 40px;
      background: #fff;
      color: #1a1a1a;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #1E3A5F;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #1E3A5F;
      font-size: 28px;
    }
    .header .case-id {
      color: #FF5722;
      font-size: 18px;
      font-weight: bold;
      margin-top: 5px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #1E3A5F;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      font-size: 20px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .info-item {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
    }
    .info-item label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      display: block;
      margin-bottom: 5px;
    }
    .info-item span {
      font-size: 16px;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #1E3A5F;
      color: white;
      font-weight: 500;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
    .signature-line {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-box .line {
      border-top: 1px solid #333;
      padding-top: 10px;
      margin-top: 40px;
    }
    .summary-stats {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-box {
      background: #1E3A5F;
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      flex: 1;
    }
    .stat-box .value {
      font-size: 32px;
      font-weight: bold;
    }
    .stat-box .label {
      font-size: 12px;
      opacity: 0.8;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Crime Scene Investigation Report</h1>
    <div class="case-id">${caseData.caseId}</div>
  </div>

  <div class="section">
    <h2>Case Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>Case Title</label>
        <span>${caseData.title}</span>
      </div>
      <div class="info-item">
        <label>Status</label>
        <span>${caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1)}</span>
      </div>
      <div class="info-item">
        <label>Location</label>
        <span>${caseData.location}</span>
      </div>
      <div class="info-item">
        <label>Lead Officer</label>
        <span>${caseData.leadOfficer}</span>
      </div>
      <div class="info-item">
        <label>Date Created</label>
        <span>${formatDate(caseData.createdAt)}</span>
      </div>
      <div class="info-item">
        <label>Last Updated</label>
        <span>${formatDate(caseData.updatedAt)}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Summary</h2>
    <div class="summary-stats">
      <div class="stat-box">
        <div class="value">${evidence.length}</div>
        <div class="label">Evidence Items</div>
      </div>
      <div class="stat-box">
        <div class="value">${evidence.filter(e => e.type === 'photo').length}</div>
        <div class="label">Photos</div>
      </div>
      <div class="stat-box">
        <div class="value">${evidence.filter(e => e.type === 'video').length}</div>
        <div class="label">Videos</div>
      </div>
      <div class="stat-box">
        <div class="value">${activityLog.length}</div>
        <div class="label">Activity Logs</div>
      </div>
    </div>
  </div>

  ${caseData.investigationStartTime ? `
  <div class="section">
    <h2>Investigation Timeline</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>Investigation Started</label>
        <span>${formatDate(caseData.investigationStartTime)}</span>
      </div>
      ${caseData.investigationEndTime ? `
      <div class="info-item">
        <label>Investigation Ended</label>
        <span>${formatDate(caseData.investigationEndTime)}</span>
      </div>
      ` : ''}
      ${caseData.backgroundVideoDuration ? `
      <div class="info-item">
        <label>Recording Duration</label>
        <span>${formatTimecode(caseData.backgroundVideoDuration)}</span>
      </div>
      ` : ''}
      <div class="info-item">
        <label>Evidence Captured</label>
        <span>${evidence.filter(e => e.relativeTimestamp !== undefined).length} items with timeline sync</span>
      </div>
    </div>
    
    ${evidence.filter(e => e.relativeTimestamp !== undefined).length > 0 ? `
    <div style="margin-top: 20px; position: relative; height: 60px; background: #f0f0f0; border-radius: 8px; padding: 10px;">
      <div style="position: absolute; top: 5px; left: 10px; right: 10px; font-size: 11px; color: #666;">Timeline Visualization</div>
      <div style="position: absolute; bottom: 20px; left: 10px; right: 10px; height: 8px; background: #1E3A5F; border-radius: 4px;">
        ${evidence.filter(e => e.relativeTimestamp !== undefined).map(e => {
          const position = caseData.backgroundVideoDuration 
            ? ((e.relativeTimestamp || 0) / caseData.backgroundVideoDuration) * 100 
            : 0;
          const colors: Record<string, string> = {
            photo: '#4488FF',
            video: '#FF4444',
            audio: '#44CC44',
            note: '#FFCC00'
          };
          return `<div style="position: absolute; left: ${position}%; top: -4px; width: 16px; height: 16px; background: ${colors[e.type] || '#888'}; border-radius: 50%; border: 2px solid white;" title="${e.type} at ${formatTimecode(e.relativeTimestamp || 0)}"></div>`;
        }).join('')}
      </div>
      <div style="position: absolute; bottom: 5px; left: 10px; font-size: 10px; color: #666;">00:00</div>
      <div style="position: absolute; bottom: 5px; right: 10px; font-size: 10px; color: #666;">${formatTimecode(caseData.backgroundVideoDuration || 0)}</div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="section">
    <h2>Evidence Catalog</h2>
    ${evidence.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Type</th>
          <th>Timestamp</th>
          <th>Video Timecode</th>
          <th>GPS Coordinates</th>
          <th>AI Analysis</th>
        </tr>
      </thead>
      <tbody>
        ${evidenceRows}
      </tbody>
    </table>
    ` : '<p>No evidence captured for this case.</p>'}
  </div>

  <div class="section">
    <h2>Chain of Custody / Activity Log</h2>
    ${activityLog.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Action</th>
          <th>Officer</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${activityRows}
      </tbody>
    </table>
    ` : '<p>No activity recorded for this case.</p>'}
  </div>

  <div class="signature-line">
    <div class="signature-box">
      <div class="line">Lead Investigator Signature</div>
    </div>
    <div class="signature-box">
      <div class="line">Supervisor Signature</div>
    </div>
  </div>

  <div class="footer">
    <p>Report generated on ${new Date().toLocaleString()} by Smart CSI Mobile Application</p>
    <p>Officer: ${profile.name || 'Unknown'} | Badge: ${profile.badgeNumber || 'N/A'} | Department: ${profile.department || 'N/A'}</p>
    <p><strong>CONFIDENTIAL - LAW ENFORCEMENT SENSITIVE</strong></p>
  </div>
</body>
</html>
  `;
}
