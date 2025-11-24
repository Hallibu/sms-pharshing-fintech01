import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CATEGORIES } from "../types";

// Initialize client - assumes process.env.API_KEY is available
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

export interface ParsedSmsResult {
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
}

export const parseSmsWithGemini = async (smsText: string, senderInfo?: string): Promise<ParsedSmsResult> => {
  try {
    const currentYear = new Date().getFullYear();
    
    const prompt = `
      Extract financial transaction details from the following SMS message.
      Sender: ${senderInfo || 'Unknown'}
      Message: "${smsText}"
      
      Current Year Context: ${currentYear} (Use this if year is missing in the date).
      
      Categorize the transaction into one of these exact categories: ${CATEGORIES.join(', ')}.
      If the category is unclear, use "Other".
      
      Detect currency (e.g., USD, INR, GHS, EUR). Default to 'USD' if not found but looks like money.
      
      Determine if it is an 'income' (credit, deposit, received) or 'expense' (debit, spent, paid).
      
      Return a JSON object.
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: "The numeric amount of the transaction" },
        currency: { type: Type.STRING, description: "The 3-letter currency code (e.g. USD, INR)" },
        merchant: { type: Type.STRING, description: "The name of the merchant, person, or entity" },
        category: { type: Type.STRING, description: "One of the provided categories" },
        type: { type: Type.STRING, enum: ['income', 'expense'], description: "Transaction direction" },
        date: { type: Type.STRING, description: "The date of transaction in ISO 8601 format (YYYY-MM-DD)" }
      },
      required: ["amount", "currency", "merchant", "category", "type", "date"]
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for deterministic extraction
      }
    });

    if (!response.text) {
        throw new Error("No response from AI");
    }

    const result = JSON.parse(response.text) as ParsedSmsResult;
    return result;

  } catch (error) {
    console.error("Error parsing SMS with Gemini:", error);
    throw new Error("Failed to parse SMS content. Please try manual entry.");
  }
};