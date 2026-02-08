import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function tryParseJSON(content: string): Record<string, unknown> | null {
  let cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try { return JSON.parse(cleaned); } catch { /* noop */ }
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    try { return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1)); } catch { /* noop */ }
  }
  try {
    cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
    return JSON.parse(cleaned);
  } catch { /* noop */ }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, imageUrl, screenName } = await req.json();

    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Either imageBase64 or imageUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const screenContext = screenName ? `Screen: "${screenName}".` : "";

    const systemPrompt = `You are a senior UX consultant evaluating the FUNCTIONALITY of a UI screen.

Focus on:
- Is the user flow clear? Can users accomplish their goal?
- Are CTAs obvious and well-placed?
- Is navigation intuitive?
- Are form inputs properly structured?
- Are error states, empty states, and loading states handled?
- Is the information architecture logical?
- Are interactive elements discoverable?
- Is the screen's purpose immediately clear?

${screenContext}

Rate the functionality as:
- "good" (score >= 75): Well-designed, users can accomplish tasks efficiently
- "mixed" (score 40-74): Has issues but partially functional  
- "bad" (score < 40): Major functionality problems that block users

Respond with ONLY valid JSON:
{
  "verdict": "good" | "mixed" | "bad",
  "score": <number 0-100>,
  "summary": "<2-3 sentence overview>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendations": ["<actionable fix 1>", "<actionable fix 2>"]
}

CRITICAL: Return ONLY JSON. No markdown. No backticks. 2-4 items per array.`;

    const imageContent = imageBase64
      ? { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: `Evaluate the functionality of this UI screen. Is it good or bad for users?` },
                imageContent,
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Functionality analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const result = tryParseJSON(content);
    if (!result) {
      return new Response(
        JSON.stringify({
          verdict: "mixed",
          score: 50,
          summary: "Analysis could not be completed. Please try again.",
          strengths: [],
          weaknesses: [],
          recommendations: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("audit-functionality error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
