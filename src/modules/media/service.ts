import { client } from "@/lib/rpc";

import type { UploadParams, MediaFile } from "@/modules/media/types";
import { getMediaType } from "@/modules/media/utils";

export class MediaService {
  private static instance: MediaService;

  private constructor() { }

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }

    return MediaService.instance;
  }

  async uploadFile({ file, path = "" }: UploadParams): Promise<MediaFile> {
    // Upload via API route (handles S3 server-side)
    const formData = new FormData();
    formData.append('file', file);
    if (path) {
      formData.append('path', path);
    }

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      throw new Error(errorData?.error || `Upload failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      url: data.url,
      type: data.type,
      filename: data.filename,
      size: data.size,
      createdAt: new Date(data.createdAt)
    };
  }

  async deleteFile(id: string): Promise<void> {
    try {
      // Step 1: Get media details to know the S3 key
      const mediaRes = await client.api.media[":id"].$get({
        param: { id }
      });

      if (!mediaRes.ok) {
        const errorData = (await mediaRes.json().catch(() => ({}))) as any;
        throw new Error(
          errorData?.message || (typeof errorData?.error === "string" ? errorData.error : errorData?.error?.message) || `Server error: ${mediaRes.status} ${mediaRes.statusText}`
        );
      }

      const media = await mediaRes.json();

      if (!media || !media.url) {
        throw new Error("Media item URL not found");
      }

      // Step 2: Ask server to delete S3 object
      const key = this.extractKeyFromUrl(media.url);
      if (key && key !== "undefined") {
        const deleteRes = await fetch('/api/media/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
          credentials: 'include'
        });

        if (!deleteRes.ok) {
          const errorData = (await deleteRes.json().catch(() => ({}))) as any;
          console.warn("Storage delete warning:", errorData);
        }
      }

      // Step 3: Delete from database
      const dbDeleteRes = await client.api.media[":id"].$delete({
        param: { id }
      });

      if (!dbDeleteRes.ok) {
        const errorData = (await dbDeleteRes.json().catch(() => ({}))) as any;
        throw new Error(
          errorData?.message || (typeof errorData?.error === "string" ? errorData.error : errorData?.error?.message) || `Database delete failed (${dbDeleteRes.status})`
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to delete media: ${error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private extractKeyFromUrl(url: string): string {
    if (!url) return "";
    try {
      const parsedUrl = new URL(url, "http://dummy.local");
      const pathname = parsedUrl.pathname;
      if (pathname.includes("/api/media/file/")) {
        return decodeURIComponent(pathname.split("/api/media/file/")[1]);
      }
      return decodeURIComponent(pathname.substring(1));
    } catch {
      // Fallback if not a valid URL
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    }
  }

  async getAllMedia() {
    try {
      const response = await client.api.media.$get();

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(
          errorData?.message || (typeof errorData?.error === "string" ? errorData.error : errorData?.error?.message) || `Server error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to fetch media: ${error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getMediaById(id: string) {
    try {
      const response = await client.api.media[":id"].$get({
        param: { id }
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(
          errorData?.message || (typeof errorData?.error === "string" ? errorData.error : errorData?.error?.message) || `Server error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to fetch media with id ${id}: ${error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
