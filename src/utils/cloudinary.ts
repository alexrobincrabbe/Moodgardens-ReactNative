import { Cloudinary } from "cloudinary-core";
import { PixelRatio } from "react-native";

const cl = new Cloudinary({
  cloud_name: "df8lhl810",
  secure: true,
});

export function getOptimizedCloudinaryUrl(
  publicId: string,
  width: number,
  version?: number | null
): string {
  const pixelRatio = PixelRatio.get();
  const v = version != null ? String(version) : undefined;

  return cl.url(publicId, {
    width,
    crop: "limit",
    quality: "auto",
    fetch_format: "auto",
    dpr: pixelRatio,
    version: v,  // 👈 this is what changes the URL
  });
}
