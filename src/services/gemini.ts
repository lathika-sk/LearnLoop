import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}

const ai = new GoogleGenAI({ apiKey });

const SYSTEM_PROMPT = `You are LearnLoop AI, a professional, high-performance academic study assistant. 
Your goal is to help students master complex topics through clarity, precision, and engagement. 
Maintain a sophisticated yet accessible tone. 
Always prioritize accuracy and pedagogical value. 
Use professional academic language while ensuring concepts are explained in "simple English" for maximum comprehension.`;

export const explainConcept = async (topic: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${SYSTEM_PROMPT}
    
    Explain the concept of "${topic}" for a university-level student but use simplified language.
    Include:
    1. A clear, authoritative definition.
    2. A logical, step-by-step breakdown of how it works.
    3. Three diverse, real-world applications.
    4. A concise, witty academic summary (meme-style summary).
    5. A highly descriptive prompt for a technical diagram generator.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          definition: { type: Type.STRING },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          examples: { type: Type.ARRAY, items: { type: Type.STRING } },
          memeSummary: { type: Type.STRING },
          diagramPrompt: { type: Type.STRING }
        },
        required: ["definition", "steps", "examples", "memeSummary", "diagramPrompt"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzePaper = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${SYSTEM_PROMPT}
    
    Analyze the following academic text or question paper:
    "${text}"
    
    Identify key questions or concepts and for each:
    1. Provide a professional, simplified explanation.
    2. Give a practical, real-world example.
    3. Offer a strategic hint to guide the student toward the solution without giving it away.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            explanation: { type: Type.STRING },
            example: { type: Type.STRING },
            hint: { type: Type.STRING }
          },
          required: ["question", "explanation", "example", "hint"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const interviewSimulation = async (topic: string, history: { role: string, content: string }[]) => {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `${SYSTEM_PROMPT}
      
      You are an Elite Technical Interviewer from a Fortune 500 tech company. 
      Conduct a rigorous technical interview on the topic: "${topic}". 
      
      Rules:
      - Be professional, slightly intimidating but fair.
      - Use "Paradox Questioning": Ask questions that challenge conventional wisdom or force the student to choose between two valid but conflicting approaches.
      - Provide critical, constructive feedback after each response.
      - If the student is doing well, increase the difficulty.
      - Keep responses concise and focused on the technical depth.`
    }
  });

  const lastMessage = history[history.length - 1]?.content || `I am ready for my interview on ${topic}.`;
  const response = await chat.sendMessage({ message: lastMessage });
  return response.text;
};

export const generateMeme = async (concept: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${SYSTEM_PROMPT}
    
    Create a professional yet humorous "Academic Meme" for: "${concept}". 
    The humor should be "smart" and relatable to students in that field. 
    Format: A witty observation followed by a relatable punchline.`,
  });
  return response.text;
};

export const ghostStudentChat = async (topic: string, userMessage: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${SYSTEM_PROMPT}
    
    You are "Ghosty", a brilliant but slightly eccentric peer student studying "${topic}". 
    You are known for your "unorthodox" way of thinking and asking deep "what if" questions that reveal hidden complexities. 
    Be helpful, collaborative, and intellectually stimulating. 
    
    Current discussion: "${userMessage}"`,
  });
  return response.text;
};

export const generateDiagram = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: {
      parts: [
        { text: `A professional, high-resolution educational infographic or diagram: ${prompt}. Use a clean, modern aesthetic suitable for a high-end textbook. Minimal text, maximum clarity.` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
