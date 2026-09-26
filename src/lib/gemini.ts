import { GoogleGenAI, Type, ThinkingLevel, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generatePostIdea(topic: string, useSearch: boolean, useHighThinking: boolean) {
  const model = useHighThinking ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: "You are an expert social media manager. Write an engaging, viral X (Twitter) post about the given topic. Keep it under 280 characters if possible, use relevant emojis, and include 1-2 hashtags.",
  };

  if (useHighThinking) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({
    model,
    contents: `Topic: ${topic}`,
    config,
  });

  return response.text;
}

export async function generateImage(prompt: string, size: string, aspectRatio: string, highQuality: boolean) {
  const model = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio,
        imageSize: size,
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
