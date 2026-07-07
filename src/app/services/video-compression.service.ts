import { Injectable } from '@angular/core';
import { CapacitorFFmpeg } from '@capgo/capacitor-ffmpeg';
import { Filesystem, Directory } from '@capacitor/filesystem';

@Injectable({
  providedIn: 'root'
})
export class VideoCompressionService {
  
  private async compress(filePath: string, width: number, height: number, bitrate: number): Promise<string> {
    const cacheDir = await Filesystem.getUri({
      directory: Directory.Cache,
      path: ''
    });
    const fileName = `compressed_${Date.now()}_${height}.mp4`;
    const outputPath = `${cacheDir.uri}/${fileName}`;
    
    try {
      await CapacitorFFmpeg.reencodeVideo({
        inputPath: filePath,
        outputPath: outputPath,
        width: width,
        height: height,
        bitrate: bitrate
      });
      return outputPath;
    } catch (error) {
      console.error('Compression failed:', error);
      throw error;
    }
  }

  async compress720(filePath: string, originalWidth: number, originalHeight: number): Promise<string> {
    const { w, h } = this.calculateDimensions(originalWidth, originalHeight, 720);
    return this.compress(filePath, w, h, 2500000);
  }

  async compress540(filePath: string, originalWidth: number, originalHeight: number): Promise<string> {
    const { w, h } = this.calculateDimensions(originalWidth, originalHeight, 540);
    return this.compress(filePath, w, h, 1500000);
  }

  async compress480(filePath: string, originalWidth: number, originalHeight: number): Promise<string> {
    const { w, h } = this.calculateDimensions(originalWidth, originalHeight, 480);
    return this.compress(filePath, w, h, 900000);
  }
  
  private calculateDimensions(origW: number, origH: number, targetMin: number) {
    if (!origW || !origH) {
      return { w: Math.round((targetMin * 16) / 9), h: targetMin };
    }
    const isPortrait = origH > origW;
    let w, h;
    if (isPortrait) {
      w = targetMin;
      h = Math.round((origH * targetMin) / origW);
    } else {
      h = targetMin;
      w = Math.round((origW * targetMin) / origH);
    }
    return { w: w % 2 === 0 ? w : w + 1, h: h % 2 === 0 ? h : h + 1 };
  }
}
