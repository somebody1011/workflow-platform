import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

export interface SupabaseUploadResult {
  storageKey: string;
  url: string;
  format: string;
}

export async function uploadToSupabase(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<SupabaseUploadResult> {
  const ext = originalName.split(".").pop() ?? "bin";
  const fileName = `${Date.now()}-${originalName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "")}`;
  const storagePath = `documents/${fileName}`;
  const normalizedMimeType = (mimeType.split(";")[0] ?? mimeType).trim();

  const { error } = await supabase.storage
    .from("workflow bucket")
    .upload(storagePath, new Uint8Array(buffer), {
      contentType: normalizedMimeType,
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(error.message || "Failed to upload to Supabase");
  }

  const { data } = supabase.storage
    .from("workflow bucket")
    .getPublicUrl(storagePath);

  return {
    storageKey: storagePath,
    url: data.publicUrl,
    format: ext,
  };
}

export async function getSupabaseSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
  const { data } = await supabase.storage
    .from("workflow bucket")
    .createSignedUrl(storagePath, expiresIn);

  if (!data?.signedUrl) {
    throw new Error("Failed to create signed URL");
  }

  return data.signedUrl;
}

export async function validateSupabaseConfig() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error("Supabase storage list failed:", error.message);
    } else {
      console.log("Supabase storage buckets:", data.map((b) => b.name));
    }
  } catch (error: any) {
    console.error("Supabase config validation failed:", error.message);
  }
}
