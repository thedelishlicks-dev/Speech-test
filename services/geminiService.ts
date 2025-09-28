import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const transactionSchema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "A brief, clear English description of the transaction item (e.g., 'Tea', 'Coffee', 'Salary'). Do not include amounts or dates.",
    },
    category: {
      type: Type.STRING,
      description: "The category of the transaction (e.g., Food, Transport, Salary).",
    },
    amount: {
      type: Type.NUMBER,
      description: "The numerical amount of the transaction.",
    },
    type: {
      type: Type.STRING,
      enum: [TransactionType.INCOME, TransactionType.EXPENSE],
      description: "The type of transaction, either 'Income' or 'Expense'.",
    },
    date: {
      type: Type.STRING,
      description: "The date of the transaction in YYYY-MM-DD format. If not specified, use today's date.",
    },
  },
  required: ["description", "category", "amount", "type", "date"],
};

export const parseTransactionFromSpeech = async (text: string): Promise<Omit<Transaction, 'id'>> => {
  try {
    const prompt = `
      You are an expert financial data entry assistant specializing in Malayalam languages.
      The following text is an ASR (Automatic Speech Recognition) transcription of a user speaking in Malayalam.
      However, the ASR system frequently confuses Malayalam with Tamil or Telugu due to phonetic similarities and may output text in the wrong language/script.

      Your primary task is to correctly interpret the user's *intended Malayalam speech*, even if the transcription is in Tamil or another language. Once you have understood the Malayalam intent, parse the transaction details into a structured JSON object with all fields in English.

      IMPORTANT:
      1.  **Correction First:** First, mentally correct the transcription to what the user would have said in Malayalam.
      2.  **English Parsing:** Then, extract the details and format them in English according to the schema.
      3.  **Description Field:** For the 'description' field, extract only the core transaction item (e.g., 'Tea', 'Coffee', 'Salary'). Do not include amounts or dates.

      The current date is ${new Date().toISOString().split('T')[0]}. Use this if no date is mentioned.
      
      Examples of potential input (with ASR errors) and desired English JSON output:
      - Spoken Malayalam: "കാപ്പിക്ക് 50 രൂപ" (Kappikku 50 roopa)
      - Potential incorrect ASR output (Tamil): "காபிக்கு 50 ரூபாய்"
      - Your interpretation: The user said they spent 50 rupees on coffee.
      - Desired JSON output: { "description": "Coffee", "category": "Food", "amount": 50, "type": "Expense", "date": "${new Date().toISOString().split('T')[0]}" }

      - Spoken Malayalam: "എനിക്ക് ശമ്പളമായി 50000 രൂപ കിട്ടി" (Enikku shambalamayi 50000 roopa kitti)
      - Potential incorrect ASR output (Tamil): "எனக்கு சம்பளம் 50000 ரூபாய் கிடைத்தது"
      - Your interpretation: The user received a salary of 50,000.
      - Desired JSON output: { "description": "Salary", "category": "Salary", "amount": 50000, "type": "Income", "date": "${new Date().toISOString().split('T')[0]}" }

      Now, interpret and parse the following text: "${text}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
      },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    if (!Object.values(TransactionType).includes(parsedData.type)) {
      throw new Error(`Invalid transaction type: ${parsedData.type}`);
    }

    return {
      date: parsedData.date,
      description: parsedData.description,
      category: parsedData.category,
      amount: Number(parsedData.amount),
      type: parsedData.type as TransactionType,
    };
  } catch (error) {
    console.error("Error parsing transaction with Gemini:", error);
    throw new Error("Could not understand the transaction details. Please try again.");
  }
};


export const parseTransactionFromImage = async (base64ImageData: string): Promise<Omit<Transaction, 'id'>> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64ImageData.split(',')[1], // Remove the data URI prefix
      },
    };

    const textPart = {
      text: `Analyze the image of this receipt or note. Extract the transaction details and format them as JSON.
      The current date is ${new Date().toISOString().split('T')[0]}. Use this if no date is visible in the image.
      Determine if it's an 'Income' or 'Expense' transaction.
      For the 'description' field, extract only the primary item (e.g., 'Coffee', 'Groceries', 'Salary'). Do not include amounts or dates.
      Provide all fields in English.`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
      },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

     if (!Object.values(TransactionType).includes(parsedData.type)) {
      throw new Error(`Invalid transaction type: ${parsedData.type}`);
    }

    return {
      date: parsedData.date,
      description: parsedData.description,
      category: parsedData.category,
      amount: Number(parsedData.amount),
      type: parsedData.type as TransactionType,
    };

  } catch (error) {
    console.error("Error parsing transaction from image with Gemini:", error);
    throw new Error("Could not read the transaction details from the image. Please try again.");
  }
};