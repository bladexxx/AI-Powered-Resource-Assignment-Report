import { GoogleGenAI, Type } from "@google/genai";
import { StructuredData } from '../types';

// This `declare` block informs TypeScript that the `process` object is globally available.
// Vite's `define` configuration will replace these variables with their actual values
// at build time, preventing runtime errors.
declare var process: {
  env: {
    // This variable is provided by the execution environment, not Vite's define config.
    API_KEY: string;
    // These variables are injected by Vite's define config.
    VITE_AI_PROVIDER: string;
    VITE_AI_GATEWAY_URL: string;
    VITE_AI_GATEWAY_API_KEY: string;
    VITE_AI_GATEWAY_MODEL: string;
  }
};

const GEMINI_MODEL = 'gemini-2.5-flash';

// Read configuration from the process.env object. Vite's `define` config replaces these
// variable names with their literal string values during the build.
const aiProvider = process.env.VITE_AI_PROVIDER;
const gatewayUrl = process.env.VITE_AI_GATEWAY_URL;
const gatewayApiKey = process.env.VITE_AI_GATEWAY_API_KEY;
const gatewayModel = process.env.VITE_AI_GATEWAY_MODEL;

// Per project guidelines, the Gemini API key MUST come exclusively from the execution
// environment's `process.env.API_KEY`.
const geminiApiKey = process.env.API_KEY;


// --- Startup Logging: Log the configuration as soon as the module is loaded ---
console.groupCollapsed('[AI Service] Configuration Loaded');
console.info(`AI Provider: %c${aiProvider}`, 'font-weight: bold;');
if (aiProvider === 'GATEWAY') {
    console.log(`Gateway Base URL: ${gatewayUrl || 'Not Set'}`);
    console.log(`Gateway Model: ${gatewayModel || `(default: ${GEMINI_MODEL})`}`);
    console.log(`Gateway API Key Set: %c${!!gatewayApiKey}`, `font-weight: bold; color: ${!!gatewayApiKey ? 'green' : 'red'};`);
} else {
     console.log(`Gemini API Key Set: %c${!!geminiApiKey}`, `font-weight: bold; color: ${!!geminiApiKey ? 'green' : 'red'};`);
}
console.groupEnd();

if (aiProvider === 'GATEWAY' && (!gatewayUrl || !gatewayApiKey)) {
    console.error('[AI Service] CRITICAL: AI Gateway is the configured provider, but VITE_AI_GATEWAY_URL or VITE_AI_GATEWAY_API_KEY is missing in your .env file.');
} else if (aiProvider === 'GEMINI' && !geminiApiKey) {
    console.error('[AI Service] CRITICAL: Gemini is the configured provider, but the API_KEY was not found in the environment. This must be configured in the execution environment where the app is hosted.');
}
// --- End of Startup Logging ---

const schema: any = {
  type: Type.OBJECT,
  properties: {
    teams: {
      type: Type.ARRAY,
      description: "List of all teams.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID for the team, e.g., 'team-alpha'" },
          name: { type: Type.STRING, description: "Name of the team, e.g., 'Alpha'" },
        },
        required: ["id", "name"]
      },
    },
    people: {
      type: Type.ARRAY,
      description: "List of all people.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID for the person, e.g., 'person-john'" },
          name: { type: Type.STRING, description: "Name of the person, e.g., 'John'" },
          teamId: { type: Type.STRING, description: "ID of the team this person belongs to." },
        },
        required: ["id", "name", "teamId"]
      },
    },
    projects: {
      type: Type.ARRAY,
      description: "List of all projects.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID for the project, e.g., 'proj-x'" },
          name: { type: Type.STRING, description: "Name of the project, e.g., 'Project X'" },
        },
        required: ["id", "name"]
      },
    },
    tasks: {
      type: Type.ARRAY,
      description: "List of all tasks within projects.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID for the task, e.g., 'task-1'" },
          name: { type: Type.STRING, description: "Name of the task, e.g., 'Design UI'" },
          projectId: { type: Type.STRING, description: "ID of the project this task belongs to." },
        },
        required: ["id", "name", "projectId"]
      },
    },
    assignments: {
      type: Type.ARRAY,
      description: "Mapping of people to tasks.",
      items: {
        type: Type.OBJECT,
        properties: {
          personId: { type: Type.STRING, description: "ID of the person assigned." },
          taskId: { type: Type.STRING, description: "ID of the task assigned." },
        },
        required: ["personId", "taskId"]
      },
    },
    riskAnalysis: {
      type: Type.STRING,
      description: "A brief analysis of resource allocation, highlighting potential risks like overallocation, underutilization, or skill gaps based on the provided data. Should be formatted in markdown.",
    },
  },
  required: ["teams", "people", "projects", "tasks", "assignments", "riskAnalysis"]
};


const _callAiGateway = async (requestBody: { model: string, [key: string]: any }): Promise<any> => {
  if (!gatewayUrl || !gatewayApiKey) {
      const errorMsg = 'AI Gateway is the configured provider, but VITE_AI_GATEWAY_URL or VITE_AI_GATEWAY_API_KEY is missing in your .env file.';
      console.error(`[AI Service] Aborting gateway request. ${errorMsg}`);
      throw new Error(errorMsg);
  }
  
  const fullGatewayUrl = `${gatewayUrl}`; // Gateway URL might be the full endpoint
  console.log(`[AI Service] Sending request to Gateway URL: %c${fullGatewayUrl}`, 'font-weight: bold;');
  console.log(`[AI Service] Sending request to Gateway with body:`, JSON.stringify(requestBody, null, 2));

  try {
      const response = await fetch(fullGatewayUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${gatewayApiKey}`
          },
          body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      console.log(`[AI Service] Gateway response status: ${response.status}`);
      if (!response.ok) {
          throw new Error(`AI Gateway request failed with status ${response.status}: ${responseText}`);
      }
      return JSON.parse(responseText);
  } catch (error) {
      console.error(`[AI Service] Error during Gateway fetch operation:`, error);
      throw error;
  }
};


export const processDataWithGemini = async (text: string): Promise<StructuredData> => {
  const prompt = `Analyze the following resource assignment data and structure it into a single JSON object. Ensure all IDs are unique and descriptive (e.g., 'team-alpha', 'person-john', 'proj-x', 'task-1'). Also, provide a resource risk analysis. The JSON object must conform to this schema: ${JSON.stringify(schema)}\n\nData:\n${text}`;
  
  if (aiProvider === 'GATEWAY') {
    const modelToUse = gatewayModel || GEMINI_MODEL;
    console.log(`[AI Service] Using AI Gateway. Model: ${modelToUse}`);
    
    const requestBody = {
        model: modelToUse,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
    };

    try {
        const data = await _callAiGateway(requestBody);
        
        if (data.choices && data.choices[0] && data.choices[0].message && typeof data.choices[0].message.content === 'string') {
            const jsonString = data.choices[0].message.content.trim();
            return JSON.parse(jsonString) as StructuredData;
        }
        
        throw new Error('The AI Gateway response was successful but did not contain the expected content in "choices[0].message.content".');

    } catch (error) {
        console.error("Error processing data with AI Gateway:", error);
        throw new Error("Failed to analyze data with AI Gateway. Please check the gateway configuration and input format.");
    }

  } else { // Default to 'GEMINI'
    if (!geminiApiKey) {
        const errorMsg = 'Gemini is the configured provider, but the API_KEY is missing in the execution environment.';
        console.error(`[AI Service] Aborting request. ${errorMsg}`);
        throw new Error(errorMsg);
    }
    console.log(`[AI Service] Using direct Gemini API with model: %c${GEMINI_MODEL}`, 'font-weight: bold;');
    
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Analyze the following resource assignment data and structure it according to the provided schema. Ensure all IDs are unique and descriptive (e.g., 'team-alpha', 'person-john', 'proj-x', 'task-1'). Also, provide a resource risk analysis.\n\nData:\n${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const jsonString = response.text.trim();
      return JSON.parse(jsonString) as StructuredData;
    } catch (error) {
      console.error("Error processing data with Gemini:", error);
      throw new Error("Failed to analyze data with AI. Please check the input format and try again.");
    }
  }
};
