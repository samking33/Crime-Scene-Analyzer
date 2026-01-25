import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Image analysis endpoint for crime scene photos
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "Image data is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant helping law enforcement analyze crime scene photographs. 
Analyze the image and provide a concise but comprehensive description including:
1. Key objects and items visible
2. Potential evidence items (weapons, documents, substances, vehicles, etc.)
3. Environmental details (location type, lighting, time indicators)
4. Any notable features that could be relevant to an investigation

Be factual and objective. Focus on what is clearly visible. Do not speculate about crimes or guilt.
Keep your response to 2-3 sentences maximum.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                  detail: "high"
                }
              },
              {
                type: "text",
                text: "Analyze this crime scene photograph and describe what you see, focusing on potential evidence and key details."
              }
            ]
          }
        ],
        max_tokens: 300,
      });

      const analysis = response.choices[0]?.message?.content || "Unable to analyze image";
      
      res.json({ analysis });
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

  const evidenceRows = evidence.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.type.charAt(0).toUpperCase() + e.type.slice(1)}</td>
      <td>${formatDate(e.timestamp)}</td>
      <td>${e.latitude && e.longitude ? `${e.latitude.toFixed(6)}, ${e.longitude.toFixed(6)}` : "N/A"}</td>
      <td>${e.aiAnalysis || "N/A"}</td>
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

  <div class="section">
    <h2>Evidence Catalog</h2>
    ${evidence.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Type</th>
          <th>Timestamp</th>
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
