import { Injectable } from '@angular/core';

export interface VideoMetadata {
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  codec?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoMetadataService {
  async getMetadata(filePath: string, fileSize: number): Promise<VideoMetadata> {
    // Note: To fully implement reading duration/width/height/fps/codec 
    // we would use a native method or FFmpeg probe.
    // For now we just return the known file size as placeholder for PoC.
    return {
      size: fileSize
    };
  }
}
