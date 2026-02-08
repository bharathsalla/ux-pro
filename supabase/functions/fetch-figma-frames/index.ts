import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
  const patterns = [/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const fileKey = match[1];
      const urlObj = new URL(url);
      const nodeId = urlObj.searchParams.get("node-id") || undefined;
      return { fileKey, nodeId };
    }
  }
  return null;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

function extractFrames(node: FigmaNode): { id: string; name: string }[] {
  const frames: { id: string; name: string }[] = [];
  if (node.type === "CANVAS" && node.children) {
    for (const child of node.children) {
      if (
        child.type === "FRAME" ||
        child.type === "COMPONENT" ||
        child.type === "COMPONENT_SET" ||
        child.type === "SECTION"
      ) {
        frames.push({ id: child.id, name: child.name });
      }
    }
  } else if (node.children) {
    for (const child of node.children) {
      frames.push(...extractFrames(child));
    }
  }
  return frames;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, { headers });

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const waitMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : 1000 * (attempt + 1); // 1s, 2s, 3s
      console.log(`Rate limited (429). Waiting ${waitMs}ms (attempt ${attempt + 1}/${retries})`);
      await delay(waitMs);
      continue;
    }

    return response;
  }

  // Final attempt
  return await fetch(url, { headers });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { figmaUrl } = await req.json();

    if (!figmaUrl) {
      return new Response(
        JSON.stringify({ error: "figmaUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIGMA_ACCESS_TOKEN = Deno.env.get("FIGMA_ACCESS_TOKEN");
    if (!FIGMA_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ error: "FIGMA_ACCESS_TOKEN is not configured. Please add your Figma token." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Invalid Figma URL. Please provide a valid Figma file or design link." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { fileKey } = parsed;
    const figmaHeaders = { "X-Figma-Token": FIGMA_ACCESS_TOKEN };

    // ────────────────────────────────────────────
    // STEP 1: Fetch entire file tree in ONE call
    // ────────────────────────────────────────────
    console.log("Fetching Figma file tree:", fileKey);
    const fileResponse = await fetchWithRetry(
      `https://api.figma.com/v1/files/${fileKey}?depth=2`,
      figmaHeaders
    );

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.error("Figma API error:", fileResponse.status, errorText);
      if (fileResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: "Access denied. Make sure your Figma token has access to this file." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (fileResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limit" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Figma API error: ${fileResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileData = await fileResponse.json();
    const fileName = fileData.name || "Untitled";

    // ────────────────────────────────────────────
    // STEP 2: Parse frames locally (zero API calls)
    // ────────────────────────────────────────────
    const allFrames: { id: string; name: string }[] = [];
    if (fileData.document?.children) {
      for (const page of fileData.document.children) {
        allFrames.push(...extractFrames(page));
      }
    }

    if (allFrames.length === 0) {
      return new Response(
        JSON.stringify({ error: "No frames found in this Figma file." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cap at 8 frames max
    const framesToExport = allFrames.slice(0, 8);

    // ────────────────────────────────────────────
    // STEP 3: Export images SEQUENTIALLY with delay
    // No parallel requests. No Promise.all.
    // ────────────────────────────────────────────
    await delay(500); // Breathe after file fetch

    const allImages: Record<string, string> = {};

    // Process ONE frame at a time with 400ms gap
    for (const frame of framesToExport) {
      await delay(400);
      
      try {
        const imgResponse = await fetchWithRetry(
          `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(frame.id)}&format=png&scale=1`,
          figmaHeaders
        );

        if (imgResponse.ok) {
          const imgData = await imgResponse.json();
          if (imgData.images?.[frame.id]) {
            allImages[frame.id] = imgData.images[frame.id];
          }
        } else if (imgResponse.status === 429) {
          // Hit rate limit mid-export, return what we have so far
          console.log("Hit rate limit during export, returning partial results");
          break;
        } else {
          console.error(`Failed to export "${frame.name}":`, imgResponse.status);
        }
      } catch (e) {
        console.error(`Error exporting "${frame.name}":`, e);
      }
    }

    // ────────────────────────────────────────────
    // STEP 4: Build response
    // ────────────────────────────────────────────
    const frames = framesToExport
      .map((frame) => ({
        id: frame.id,
        name: frame.name,
        nodeId: frame.id,
        imageUrl: allImages[frame.id] || null,
      }))
      .filter((f) => f.imageUrl !== null);

    if (frames.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Could not export any frame images. Figma may be rate limiting — wait 60 seconds and try again.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully extracted ${frames.length} frames from "${fileName}"`);

    return new Response(
      JSON.stringify({
        fileName,
        fileKey,
        frames,
        totalFrames: allFrames.length,
        exportedFrames: frames.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fetch-figma-frames error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
