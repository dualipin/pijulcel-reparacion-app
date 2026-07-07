import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VideoPickerService } from '../../services/video-picker.service';
import { VideoMetadataService } from '../../services/video-metadata.service';
import { VideoCompressionService } from '../../services/video-compression.service';
import { UploadService } from '../../services/upload.service';
import { Filesystem } from '@capacitor/filesystem';

type ProcessingState = 
  | 'idle' 
  | 'selecting' 
  | 'analyzing' 
  | 'optimizing' 
  | 'preparing_upload' 
  | 'uploading' 
  | 'finished' 
  | 'error';

@Component({
  selector: 'app-upload-video',
  templateUrl: './upload-video.page.html',
  styleUrls: ['./upload-video.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class UploadVideoPage implements OnInit {
  
  state: ProcessingState = 'idle';
  originalSizeMb: number = 0;
  compressedSizeMb: number = 0;
  reductionPercentage: number = 0;
  errorMessage: string = '';
  
  private MAX_SIZE_MB = 100;
  private MAX_SIZE_BYTES = this.MAX_SIZE_MB * 1024 * 1024;

  constructor(
    private videoPickerService: VideoPickerService,
    private metadataService: VideoMetadataService,
    private compressionService: VideoCompressionService,
    private uploadService: UploadService
  ) {}

  ngOnInit() {}

  async processVideo(source: 'gallery' | 'camera' = 'gallery') {
    try {
      this.state = 'selecting';
      this.errorMessage = '';
      
      // Phase 1 - Video selection
      let videoFile = null;
      if (source === 'camera') {
        videoFile = await this.videoPickerService.recordVideo();
      } else {
        videoFile = await this.videoPickerService.pickVideo();
      }

      if (!videoFile) {
        this.state = 'idle';
        return;
      }

      this.state = 'analyzing';
      
      // Phase 2 - Get metadata
      const metadata = await this.metadataService.getMetadata(videoFile.uri, videoFile.size);
      let currentSize = metadata.size;
      this.originalSizeMb = currentSize / (1024 * 1024);
      let currentPath = videoFile.uri;

      // Phase 4 & 6 - Compression Strategy and Validation
      if (currentSize > this.MAX_SIZE_BYTES) {
        this.state = 'optimizing';
        
        // Attempt 1: 720p
        currentPath = await this.compressionService.compress720(videoFile.uri, videoFile.width || 1920, videoFile.height || 1080);
        currentSize = await this.getFileSize(currentPath);

        // Attempt 2: 540p
        if (currentSize > this.MAX_SIZE_BYTES) {
          currentPath = await this.compressionService.compress540(videoFile.uri, videoFile.width || 1920, videoFile.height || 1080);
          currentSize = await this.getFileSize(currentPath);
        }

        // Attempt 3: 480p
        if (currentSize > this.MAX_SIZE_BYTES) {
          currentPath = await this.compressionService.compress480(videoFile.uri, videoFile.width || 1920, videoFile.height || 1080);
          currentSize = await this.getFileSize(currentPath);
        }

        // Final check
        if (currentSize > this.MAX_SIZE_BYTES) {
          this.state = 'error';
          this.errorMessage = 'El video es demasiado grande incluso después de comprimirlo (máx 100MB).';
          return;
        }
      }

      this.compressedSizeMb = currentSize / (1024 * 1024);
      this.reductionPercentage = this.originalSizeMb > 0 
        ? ((this.originalSizeMb - this.compressedSizeMb) / this.originalSizeMb) * 100 
        : 0;

      // Phase 8 - Upload
      this.state = 'preparing_upload';
      // Simulated delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.state = 'uploading';
      this.uploadService.uploadVideo(currentPath).subscribe({
        next: (res) => {
          this.state = 'finished';
        },
        error: (err) => {
          this.state = 'error';
          this.errorMessage = 'Error al subir el video: ' + err.message;
        }
      });

    } catch (error: any) {
      this.state = 'error';
      this.errorMessage = error.message || 'Ocurrió un error inesperado';
      console.error(error);
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stat = await Filesystem.stat({ path: filePath });
      return stat.size;
    } catch (e) {
      console.error('Error reading file size:', e);
      return 0;
    }
  }
  
  reset() {
    this.state = 'idle';
    this.originalSizeMb = 0;
    this.compressedSizeMb = 0;
    this.reductionPercentage = 0;
    this.errorMessage = '';
  }
}
