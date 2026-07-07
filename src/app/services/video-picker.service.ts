import { Injectable } from '@angular/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';

@Injectable({
  providedIn: 'root'
})
export class VideoPickerService {
  async pickVideo() {
    try {
      const result = await FilePicker.pickVideos({
        limit: 1,
      });

      if (result.files.length > 0) {
        const file = result.files[0];
        return {
          uri: file.path || file.name,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          width: file.width || 1920,
          height: file.height || 1080
        };
      }
      return null;
    } catch (error) {
      console.error('Error picking video', error);
      throw error;
    }
  }

  async recordVideo(): Promise<{ uri: string, name: string, size: number, mimeType: string, width?: number, height?: number } | null> {
    return new Promise((resolve, reject) => {
      if (!(navigator as any).device || !(navigator as any).device.capture) {
        return reject(new Error('La funcionalidad de cámara no está disponible (requiere dispositivo real y plugin instalado).'));
      }

      const options = { limit: 1 };
      (navigator as any).device.capture.captureVideo(
        (mediaFiles: any[]) => {
          if (mediaFiles && mediaFiles.length > 0) {
            const file = mediaFiles[0];
            resolve({
              // Use fullPath for native capacitor ffmpeg processing
              uri: file.fullPath.startsWith('file://') ? file.fullPath : 'file://' + file.fullPath,
              name: file.name,
              size: file.size,
              mimeType: file.type,
              width: undefined, // Will use default landscape fallback in compression
              height: undefined
            });
          } else {
            resolve(null);
          }
        },
        (error: any) => {
          // Error code 3 is typically 'Canceled'
          if (error && error.code === 3) {
            resolve(null);
          } else {
            reject(new Error('Error al grabar video: ' + JSON.stringify(error)));
          }
        },
        options
      );
    });
  }
}
