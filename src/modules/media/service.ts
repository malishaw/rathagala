import { client } from "@/lib/rpc";

import type { UploadParams, MediaFile } from "@/modules/media/types";
import { getMediaType } from "@/modules/media/utils";

export class MediaService {
  private static instance: MediaService;

  private constructor() {}

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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
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
      const media = await client.api.media[":id"].$get({
        param: { id }
      });

      // Step 2: Ask server to delete S3 object
      const key = this.extractKeyFromUrl(media.url);
      await fetch('/api/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
        credentials: 'include'
      });

      // Step 3: Delete from database
      await client.api.media[":id"].$delete({
        param: { id }
      });
    } catch (error) {
      throw new Error(
        `Failed to delete media: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private extractKeyFromUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return decodeURIComponent(parsedUrl.pathname.substring(1));
    } catch {
      // Fallback if not a valid URL
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    }
  }

  async getAllMedia() {
    try {
      const mediaList = await client.api.media.$get();

      return mediaList;
    } catch (error) {
      throw new Error(
        `Failed to fetch media: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getMediaById(id: string) {
    try {
      const media = await client.api.media[":id"].$get({
        param: { id }
      });
      return media;
    } catch (error) {
      throw new Error(
        `Failed to fetch media with id ${id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
