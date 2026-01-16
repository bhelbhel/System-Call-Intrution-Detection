
import { GoogleGenAI } from "@google/genai";
import { SyscallData, RiskLevel } from "../types";

export const getAnalysisExplanation = async (
  status: string,
  riskLevel: RiskLevel,
  deviationScore: number,
  syscalls: SyscallData[]
): Promise<string> => {
  // Use the API key directly from process.env.API_KEY as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const abnormalSyscalls = syscalls
    .filter(s => s.deviation > 30)
    .sort((a, b) => b.deviation - a.deviation)
    .slice(0, 5);

  const prompt = `
    Act as a senior cybersecurity forensic analyst. 
    Analyze the following System Call Intrusion Detection report:
    - Overall Status: ${status}
    - Risk Level: ${riskLevel}
    - Average Deviation Score: ${deviationScore.toFixed(2)}%
    - Top Abnormal System Calls: ${abnormalSyscalls.map(s => `${s.name} (Dev: ${s.deviation.toFixed(1)}%)`).join(", ")}

    Provide a concise, professional explanation (max 3 sentences) of why this activity might be considered ${status}. 
    Focus on the technical implications of the spiked system calls (e.g., memory manipulation, unauthorized execution, network activity).
    Format as plain text without Markdown.
  `;

  try {
    // Correct usage of generateContent with model and contents.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Property access to .text is correct according to the guideline.
    return response.text || "No automated explanation available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI analysis. System behavior indicates a significant deviation from baseline patterns in security-critical syscalls.";
  }
};
