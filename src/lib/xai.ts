export async function generateXAIReply(apiKey: string | undefined, tweetContent: string, style: string) {
  let systemPrompt = "You are an expert social media manager specializing in X.com engagement.";
  if (style === 'witty') {
    systemPrompt += " Write a witty, clever, and slightly humorous reply to the following tweet. Keep it under 280 characters.";
  } else if (style === 'professional') {
    systemPrompt += " Write a professional, insightful, and value-adding reply to the following tweet. Keep it under 280 characters.";
  } else if (style === 'controversial') {
    systemPrompt += " Write a slightly controversial, debate-sparking (but not offensive) reply to the following tweet. Keep it under 280 characters.";
  } else {
    systemPrompt += " Write an engaging reply to the following tweet. Keep it under 280 characters.";
  }

  const response = await fetch("/api/xai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey,
      model: "grok-beta",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Tweet: "${tweetContent}"` }
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

export async function analyzeTrendXAI(apiKey: string | undefined, topic: string) {
  const response = await fetch("/api/xai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey,
      model: "grok-beta",
      messages: [
        { role: "system", content: "You are a trend analyst for X.com. Provide a brief analysis of the following topic, including key talking points, sentiment, and potential angles for a viral post." },
        { role: "user", content: `Topic: ${topic}` }
      ],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error?.message || `xAI API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
