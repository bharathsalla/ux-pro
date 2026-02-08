import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ──────────────────────────────────────────────
// MASTER AUDIT RULES LIBRARY
// ──────────────────────────────────────────────
const MASTER_RULES = `
## MASTER UX/UI AUDIT RULES LIBRARY

### 1. NIELSEN'S 10 USABILITY HEURISTICS
H1. Visibility of System Status — loading indicators, progress bars, success/error feedback.
H2. Match between System & Real World — user-friendly language, no jargon, familiar metaphors.
H3. User Control & Freedom — undo, cancel, back, emergency exits.
H4. Consistency & Standards — follow platform conventions, consistent terminology.
H5. Error Prevention — confirmation dialogs, constraints, smart defaults.
H6. Recognition rather than Recall — visible options, recent items, search suggestions.
H7. Flexibility & Efficiency of Use — keyboard shortcuts, customization for power users.
H8. Aesthetic & Minimalist Design — remove noise, every element serves a purpose.
H9. Help users Recognize, Diagnose, Recover from Errors — plain-language errors with fixes.
H10. Help & Documentation — searchable, task-focused, contextual help.

### 2. LAWS OF UX (PSYCHOLOGY)
L1. Fitts's Law — buttons/targets large enough and close to cursor/thumb zones.
L2. Hick's Law — fewer choices = faster decisions; simplify menus and options.
L3. Miller's Law — chunk information into 7±2 groups.
L4. Jakob's Law — match existing mental models and conventions from popular apps.
L5. Aesthetic-Usability Effect — visually appealing designs are perceived as more usable.
L6. Doherty Threshold — system response must be < 400ms to maintain flow.
L7. Zeigarnik Effect — incomplete tasks are remembered; use progress indicators.
L8. Von Restorff Effect — the unique element stands out; use for CTAs.
L9. Serial Position Effect — first and last items are remembered best.
L10. Peak-End Rule — experiences judged by peak moment and ending.
L11. Occam's Razor — simplest solution is usually correct.
L12. Postel's Law — be liberal in accepting input, conservative in output.
L13. Tesler's Law — complexity is conserved; decide if user or system handles it.
L14. Parkinson's Law — task time inflates to fill available time; set clear boundaries.

### 3. SHNEIDERMAN'S 8 GOLDEN RULES
S1. Strive for consistency.
S2. Enable frequent users to use shortcuts.
S3. Offer informative feedback.
S4. Design dialogs to yield closure.
S5. Offer error handling.
S6. Permit easy reversal of actions.
S7. Support internal locus of control.
S8. Reduce short-term memory load.

### 4. GERHARDT-POWALS' COGNITIVE PRINCIPLES
GP1. Automate unwanted workload.
GP2. Reduce uncertainty — make data display obvious.
GP3. Present information in a way that is easy to interpret.
GP4. Integrate related information to reduce search time.

### 5. VISUAL & UI PRINCIPLES
V1. Visual Hierarchy — size, color, weight guide the eye to CTA first.
V2. 8pt Grid System — all spacing in multiples of 8 (4pt for typography baseline).
V3. Typography Scale — consistent heading/body/caption styles with clear hierarchy.
V4. Gestalt: Proximity — related items grouped closely.
V5. Gestalt: Similarity — similar-looking items share function.
V6. Gestalt: Common Region — cards/borders group information.
V7. Gestalt: Continuity — aligned elements feel connected.
V8. Color Theory 60-30-10 — primary, secondary, accent distribution.
V9. Golden Ratio (1.618) — for proportions and scaling.
V10. Whitespace — purposeful negative space, not just "empty."

### 6. WCAG 2.2 ACCESSIBILITY (POUR)
A1. Contrast: 4.5:1 normal text, 3:1 large text (AA); 7:1 / 4.5:1 (AAA).
A2. Alt Text — meaningful descriptions for all non-decorative images.
A3. Semantic HTML — proper heading hierarchy (H1 > H2 > H3).
A4. Keyboard Navigation — no keyboard traps, logical tab order.
A5. Focus Visible — visible focus indicators on all interactive elements.
A6. Touch Targets — minimum 44x44px for mobile interaction.
A7. Text Sizing — minimum 12px, scales for Dynamic Type/accessibility.
A8. Color-Only Meaning — never rely solely on color to convey info.
A9. Error Identification — describe errors in text, not just color.
A10. Pause/Stop/Hide — control for moving/blinking content > 5 seconds.
A11. Meaningful Sequence — screen reader order matches visual order.
A12. Sensory Characteristics — instructions don't rely on shape/color/sound alone.

### 7. PLATFORM GUIDELINES
P1. iOS HIG: clarity, deference, depth; 44pt touch targets; safe areas; modality.
P2. Material Design 3: design tokens, state layers, adaptive layouts, elevation system.
P3. Navigation patterns: hierarchical, flat (tabs), content-driven.
P4. Responsive design: works across mobile, tablet, desktop, foldables.

### 8. IMPLEMENTATION & CODE-READINESS
I1. Naming Conventions — layers/components named semantically (not "Frame 1024").
I2. Component Usage — variants, properties, and instances used correctly.
I3. Auto Layout — proper structure for developer handoff.
I4. Design Tokens — using variables/tokens instead of hardcoded values.
I5. Atomic Design — atoms, molecules, organisms, templates, pages.

### 9. MODERN EDGE AUDITS
E1. Empty States — what does the screen look like with no data?
E2. Loading States — skeleton screens vs spinners; perceived performance.
E3. Edge Cases — very long names, 0 items, maximum items, error states.
E4. Microcopy/UX Writing — active voice, consistent terminology, helpful labels.
E5. Dark Patterns — roach motel, sneak into basket, confirmshaming, forced continuity.
E6. Cognitive Load — estimation of mental effort required per screen.
E7. Motion & Delight — animations purposeful, not distracting; respect reduced motion.
`;

// ──────────────────────────────────────────────
// PERSONA-SPECIFIC CONFIGURATIONS
// ──────────────────────────────────────────────
const PERSONA_CONFIGS: Record<string, { focus: string; priorities: string; tone: string; ruleWeights: string }> = {
  solo: {
    focus: "Pre-handoff quality validation and portfolio-grade polish",
    priorities: "V1-V10, I1-I5, H4, H8, A1, A5, L1",
    tone: "Practical designer language. Be direct and actionable. Quick fixes over theory.",
    ruleWeights: "Visual & UI Principles 35%, Implementation 25%, Usability 20%, Accessibility 20%",
  },
  lead: {
    focus: "Reviewing team output for system consistency and quality gates",
    priorities: "I1-I5, H4, S1, V2-V3, V4-V6, GP4, E1-E3",
    tone: "Structured and technical. Use design system terminology. Focus on patterns, not individual screens.",
    ruleWeights: "Implementation & Consistency 35%, Visual Principles 25%, Usability 25%, Accessibility 15%",
  },
  a11y: {
    focus: "WCAG 2.2 AA/AAA compliance and inclusive design",
    priorities: "A1-A12, P1 (touch targets), L1 (Fitts), H9, S5, E3",
    tone: "Compliance-focused. Reference WCAG success criteria by number. Cite specific ratios and pixel values.",
    ruleWeights: "Accessibility (WCAG) 45%, Usability 25%, Visual Principles 20%, Implementation 10%",
  },
  founder: {
    focus: "Business risk assessment — is this good enough to ship?",
    priorities: "L2 (Hick), L5 (Aesthetic-Usability), L8 (Von Restorff), H1, H8, V1, E1-E4",
    tone: "Simple, jargon-free business language. Translate UX issues into user trust and conversion impact. Say 'users may leave' not 'cognitive load exceeds threshold.'",
    ruleWeights: "User Trust & Conversion 35%, Visual Quality 30%, Mobile Readiness 20%, Accessibility 15%",
  },
  consultant: {
    focus: "Formal heuristic evaluation with structured professional report",
    priorities: "H1-H10, S1-S8, GP1-GP4, L1-L14, A1-A12, V1-V10, I1-I5, E1-E7",
    tone: "Formal, methodological. Reference heuristic numbers (H1, A3, etc.). Include severity ratings. Client-ready language.",
    ruleWeights: "Usability Heuristics 25%, Accessibility 20%, Visual Principles 20%, Laws of UX 15%, Implementation 10%, Modern Edge 10%",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, imageUrl, personaId, fidelity, purpose, screenName } = await req.json();

    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Either imageBase64 or imageUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!personaId) {
      return new Response(
        JSON.stringify({ error: "personaId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const config = PERSONA_CONFIGS[personaId] || PERSONA_CONFIGS.solo;
    const screenContext = screenName ? `\nScreen being audited: "${screenName}".` : "";

    const systemPrompt = `You are the world's most comprehensive UX/UI auditor. You have deep expertise in all major design frameworks, psychological principles, accessibility standards, and platform guidelines.

## YOUR PERSONA
Focus: ${config.focus}
Tone: ${config.tone}
Rule Weights: ${config.ruleWeights}
Priority Rules: ${config.priorities}

${MASTER_RULES}

## ANALYSIS INSTRUCTIONS
You are analyzing a UI/UX design screenshot. Perform a thorough audit using the rules above.
Design context: Fidelity = "${fidelity || "high-fidelity"}", Purpose = "${purpose || "review"}".${screenContext}

For each issue found:
1. Identify which rule(s) it violates (use rule IDs like H1, A3, V2, L5, etc.)
2. Estimate the x,y position on the image as a percentage (0-100)
3. Provide a specific, actionable fix suggestion
4. Assign severity: critical (blocks usability/compliance), warning (degrades experience), info (polish opportunity)

Weight your scoring based on: ${config.ruleWeights}

You MUST respond with ONLY a valid JSON object (no markdown, no backticks) in this exact format:
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence summary in persona-appropriate tone>",
  "riskLevel": "<Low|Medium|High>",
  "categories": [
    {
      "name": "<category name>",
      "score": <number 0-100>,
      "icon": "<single emoji>",
      "issues": [
        {
          "id": "<unique id like USR-01>",
          "ruleId": "<rule ID like H1, A3, V2>",
          "principle": "<short principle name>",
          "title": "<short descriptive title>",
          "description": "<what's wrong and why it matters>",
          "severity": "<critical|warning|info>",
          "category": "<category name>",
          "suggestion": "<specific actionable fix>",
          "x": <number 0-100>,
          "y": <number 0-100>
        }
      ]
    }
  ]
}

Return 4-8 categories with 1-4 issues each. Every issue MUST have x,y coordinates, ruleId, and principle. Be thorough but prioritize according to your persona weights.`;

    // Build image content — support both base64 and URL
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
                {
                  type: "text",
                  text: `Analyze this design screenshot and provide a comprehensive UX audit with positioned annotations for each issue.${screenContext}`,
                },
                imageContent,
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let auditResult;
    try {
      auditResult = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse audit results", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(auditResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("audit-design error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
