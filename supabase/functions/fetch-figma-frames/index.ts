import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
  // Supports:
  // https://www.figma.com/file/FILE_KEY/...
  // https://www.figma.com/design/FILE_KEY/...
  // https://figma.com/design/FILE_KEY/...
  const patterns = [
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const fileKey = match[1];
      // Extract node-id from query params
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
    // This is a page — get its direct children (top-level frames)
    for (const child of node.children) {
      if (child.type === "FRAME" || child.type === "COMPONENT" || child.type === "COMPONENT_SET" || child.type === "SECTION") {
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

    // 1. Fetch file structure
    console.log("Fetching Figma file:", fileKey);
    const fileResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=2`, {
      headers: {
        "X-Figma-Token": FIGMA_ACCESS_TOKEN,
      },
    });

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.error("Figma API error:", fileResponse.status, errorText);
      if (fileResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: "Access denied. Make sure your Figma token has access to this file." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Figma API error: ${fileResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileData = await fileResponse.json();
    const fileName = fileData.name || "Untitled";

    // 2. Extract all top-level frames from all pages
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

    // Limit to max 20 frames
    const framesToExport = allFrames.slice(0, 20);
    const nodeIds = framesToExport.map((f) => f.id).join(",");

    // 3. Export frames as images
    console.log(`Exporting ${framesToExport.length} frames as images`);
    const imageResponse = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeIds)}&format=png&scale=2`,
      {
        headers: {
          "X-Figma-Token": FIGMA_ACCESS_TOKEN,
        },
      }
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error("Figma image export error:", imageResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to export Figma frames as images." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageData = await imageResponse.json();
    const images = imageData.images || {};

    // 4. Build response
    const frames = framesToExport
      .map((frame) => ({
        id: frame.id,
        name: frame.name,
        nodeId: frame.id,
        imageUrl: images[frame.id] || null,
      }))
      .filter((f) => f.imageUrl !== null);

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
