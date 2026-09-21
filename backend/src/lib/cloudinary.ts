import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  api_key: process.env.CLOUDINARY_API_KEY ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
});

export interface CloudinaryUploadResult {
  storageKey: string;
  url: string;
  format: string;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<CloudinaryUploadResult> {
  const result = await new Promise<{
    public_id: string;
    secure_url: string;
    format: string;
  }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        public_id: `documents/${Date.now()}-${originalName
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9._-]/g, "")}`,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
          });
          reject(error);
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error("Cloudinary upload returned no result"));
        }
      }
    ).end(buffer);
  });

  return {
    storageKey: result.public_id,
    url: result.secure_url,
    format: result.format,
  };
}

// export async function validateCloudinaryConfig() {
//   try {
//     const result = await cloudinary.api.ping();
//     console.log("Cloudinary ping result:", result);
//   } catch (error: any) {
//     console.error("Cloudinary ping failed:", {
//       message: error.message,
//       http_code: error.http_code,
//       name: error.name,
//     });
//   }
// }
