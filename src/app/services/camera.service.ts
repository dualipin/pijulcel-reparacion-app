import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  // web, ios, android
  private platform: string = Capacitor.getPlatform();

  /**
   * Captures a photo using the device camera or selects an image from the gallery.
   *
   * @param gallery - If `true`, opens the photo gallery for image selection; if `false`, opens the camera for capturing a new photo.
   * @returns A promise that resolves to a string containing the image data URL (on web) or file path (on iOS/Android), or `null` if the operation fails or is cancelled.
   */
  public async takePhoto(gallery: boolean): Promise<string | null> {

    try {
      const image = await Camera.getPhoto({
        quality: 50,
        allowEditing: false,
        resultType: this.platform === 'web' ? CameraResultType.DataUrl : CameraResultType.Uri,
        source: gallery ? CameraSource.Photos : CameraSource.Camera
      });

      if (this.platform === "web" && image.dataUrl)
        return image.dataUrl;
      else if ((this.platform === "ios" || this.platform === "android") && image.path) {
        return image.path;
      } else {
        return null;
      }

    } catch (error) {
      return null;
    }

  }

  /**
   * Converts a given URI or data URL to a Blob object.
   *
   * Depending on the platform, this method either converts a data URL directly to a Blob (for web)
   * or fetches the resource from the URI and converts it to a Blob (for other platforms).
   *
   * @param uri_url - The URI or data URL to be converted into a Blob.
   * @returns A Promise that resolves to a Blob representing the resource.
   */
  public async convertBlob(uri_url: string): Promise<Blob> {

    if (this.platform === 'web')
      return this.dataURLtoBlob(uri_url);
    else
      return await this.uriToBlob(uri_url);

  }

  /**
   * Returns the appropriate image source URL based on the current platform.
   *
   * On the 'web' platform, returns the image string as-is.
   * On other platforms, converts the file path to a URL using Capacitor's `convertFileSrc` method.
   *
   * @param image - The image path or URL to process.
   * @returns The processed image source URL suitable for the current platform.
   */
  public getImage(image: string): string {

    if (this.platform === 'web')
      return image;
    else
      return Capacitor.convertFileSrc(image);

  }

  /**
   * Converts a file URI to a Blob object.
   *
   * This method uses Capacitor's `convertFileSrc` to obtain a web-accessible path from the given URI,
   * then fetches the resource and returns its contents as a Blob.
   *
   * @param uri - The file URI to convert.
   * @returns A promise that resolves to a Blob representing the file's contents.
   */
  private async uriToBlob(uri: string): Promise<Blob> {
    const webPath = Capacitor.convertFileSrc(uri);
    return await fetch(webPath).then(r => r.blob());
  }

  /**
   * Converts a data URL string to a Blob object.
   *
   * @param dataurl - The data URL to convert, typically in the format 'data:[<mediatype>][;base64],<data>'.
   * @returns A Blob object representing the binary data of the input data URL.
   *
   * @example
   * const blob = dataURLtoBlob('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...');
   */
  private dataURLtoBlob(dataurl: string) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }


}
