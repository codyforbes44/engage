import { GoogleGenAI, Type, ThinkingLevel, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIServiceOptions {
  useSearch?: boolean;
  useHighThinking?: boolean;
  model?: string;
}

export async function generateContent(prompt: string, options: AIServiceOptions = {}) {
  const { useSearch = false, useHighThinking = false, model: customModel } = options;
  const model = customModel || (useHighThinking ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview');
  
  const config: any = {
    systemInstruction: "You are an expert social media manager specializing in X.com engagement. Your goal is to create high-impact, viral content that resonates with the target audience.",
  };

  if (useHighThinking && model.includes('gemini-3')) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  return response.text;
}

export async function generateImage(prompt: string, options: { size?: string; aspectRatio?: string; highQuality?: boolean } = {}) {
  const { size = '1K', aspectRatio = '1:1', highQuality = false } = options;
  const model = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio,
        imageSize: size as any,
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
}

export async function generateTTS(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Zephyr' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/wav;base64,${base64Audio}`;
  }
  throw new Error("No audio generated");
}

// xAI (Grok) Integration
export async function generateGrokResponse(apiKey: string, prompt: string, systemPrompt: string) {
  if (!apiKey) throw new Error("xAI API key is required");

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-beta",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error?.message || `xAI API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
