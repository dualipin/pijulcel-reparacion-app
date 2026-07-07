import { VoiceRecorder } from 'capacitor-voice-recorder';
import { addIcons } from 'ionicons';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { camera, checkmarkCircleOutline, documentTextOutline, imageOutline, images, imagesOutline, micOutline, playOutline, stopCircleOutline, trash, radioButtonOnOutline, videocamOutline } from 'ionicons/icons';
import { AlertController, IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { PrinterService } from 'src/app/services/printer.service';
import { CameraService } from 'src/app/services/camera.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { VideoPickerService } from 'src/app/services/video-picker.service';
import { VideoMetadataService } from 'src/app/services/video-metadata.service';
import { VideoCompressionService } from 'src/app/services/video-compression.service';
import { Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

import {
  IonButton, IonIcon, IonInput, IonItem, IonLabel, IonTextarea, IonSpinner,
  IonRefresher, IonRefresherContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent

} from '@ionic/angular/standalone';

@Component({
  selector: 'app-registrar-pedido',
  templateUrl: './registrar-pedido.component.html',
  styleUrls: ['./registrar-pedido.component.scss'],
  imports: [
    IonicModule, CommonModule,
    ReactiveFormsModule, FormsModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonInput, IonTextarea, IonButton, IonIcon, IonSpinner,
    IonRefresher, IonRefresherContent
  ]
})
export class RegistrarPedidoComponent {

  public isLoad: Boolean;

  pedidoForm: FormGroup;

  isRecording = false;

  imagenesPreview: any[] = [];

  audioBlob!: Blob;
  audioBase64!: string;
  audioURL!: string;

  videoFile?: File;
  videoPreviewURL?: string;

  constructor(
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private printerService: PrinterService,
    private cameraServ: CameraService,
    private pedidoServ: PedidoService,
    private videoPickerService: VideoPickerService,
    private metadataService: VideoMetadataService,
    private compressionService: VideoCompressionService
  ) {
    this.isLoad = true;
    this.pedidoForm = this.fb.group({
      bar_code: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(10)]],
      name_cli: ['', [Validators.required, Validators.maxLength(50)]],
      tel_cli: ['', [Validators.required, Validators.maxLength(20)]],
      device_name: ['', [Validators.required, Validators.maxLength(60)]],
      device_color: ['', [Validators.maxLength(50)]],
      prob_texto: ['', [Validators.maxLength(510)]],
    });

    this.generarCodigo();
    addIcons({ documentTextOutline, trash, images, camera, imageOutline, imagesOutline, checkmarkCircleOutline, playOutline, stopCircleOutline, micOutline, radioButtonOnOutline, videocamOutline });
  }


  getImage(image: any) {
    return this.cameraServ.getImage(image);
  }


  async tomarFoto(desdeGaleria: boolean) {
    if (this.imagenesPreview.length >= 2) {
      this.alertCtrl.create({
        header: 'Límite alcanzado',
        message: 'Solo se permiten 2 imágenes por pedido.',
        buttons: ['OK']
      }).then(alert => alert.present());
      return;
    }
    try {
      let imgToSave = await this.cameraServ.takePhoto(desdeGaleria);
      this.imagenesPreview.push(imgToSave);

    } catch (error) {
      console.error('Error al tomar la foto', error);
    }
  }

  deleteImage(index: number) {
    this.imagenesPreview.splice(index, 1);
  }

  isCompressingVideo = false;

  async seleccionarVideo() {
    try {
      this.isCompressingVideo = true;
      const videoFile = await this.videoPickerService.pickVideo();
      if (!videoFile) {
        this.isCompressingVideo = false;
        return;
      }
      
      await this.procesarVideo(videoFile);
      
    } catch (error) {
      console.error(error);
      this.isCompressingVideo = false;
      this.alertCtrl.create({
         header: 'Error',
         message: 'Ocurrió un error al seleccionar el video.',
         buttons: ['OK']
      }).then(alert => alert.present());
    }
  }

  async grabarVideo() {
    try {
      this.isCompressingVideo = true;
      const videoFile = await this.videoPickerService.recordVideo();
      if (!videoFile) {
        this.isCompressingVideo = false;
        return;
      }

      await this.procesarVideo(videoFile);
      
    } catch (error: any) {
      console.error(error);
      this.isCompressingVideo = false;
      this.alertCtrl.create({
         header: 'Error',
         message: error.message || 'Ocurrió un error al grabar el video.',
         buttons: ['OK']
      }).then(alert => alert.present());
    }
  }

  private async procesarVideo(videoFile: any) {
    try {
      const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
      let currentPath = videoFile.uri;
      
      // Intentar obtener size real. Si viene de cámara, puede que no tenga size exacto, usamos getFileSize
      let currentSize = videoFile.size;
      if (!currentSize) {
        currentSize = await this.getFileSize(currentPath);
      }

      if (currentSize > MAX_SIZE_BYTES) {
        this.isCompressingVideo = false;
        this.alertCtrl.create({
          header: 'Video muy pesado',
          message: 'El archivo no puede superar los 50 MB.',
          buttons: ['OK']
        }).then(alert => alert.present());
        return;
      }

      let blob: Blob;
      if (Capacitor.getPlatform() === 'web') {
         if (videoFile.blob) {
            blob = videoFile.blob;
         } else {
            blob = await fetch(currentPath).then(r => r.blob());
         }
      } else {
         try {
           const webPath = Capacitor.convertFileSrc(currentPath);
           blob = await new Promise((resolve, reject) => {
             const xhr = new XMLHttpRequest();
             xhr.open('GET', webPath, true);
             xhr.responseType = 'blob';
             xhr.onload = function() {
               if (this.status >= 200 && this.status < 300) {
                 resolve(this.response);
               } else {
                 reject(new Error(`Error status: ${this.status}`));
               }
             };
             xhr.onerror = function() {
               reject(new Error('Network error loading video blob'));
             };
             xhr.send();
           });
         } catch (fsError) {
           console.error("Error cargando blob nativo, usando fetch fallback", fsError);
           const webPath = Capacitor.convertFileSrc(currentPath);
           blob = await fetch(webPath).then(r => r.blob());
         }
      }

      this.videoPreviewURL = URL.createObjectURL(blob);
      this.videoFile = new File([blob], videoFile.name || 'video.mp4', { type: videoFile.mimeType || 'video/mp4' });
      
      this.isCompressingVideo = false;
    } catch (error) {
      console.error(error);
      this.isCompressingVideo = false;
      this.alertCtrl.create({
         header: 'Error',
         message: 'Ocurrió un error al procesar el video.',
         buttons: ['OK']
      }).then(alert => alert.present());
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

  deleteVideo() {
    this.videoFile = undefined;
    this.videoPreviewURL = undefined;
  }

  async generarCodigo() {
    let code = Math.floor(Date.now() / 1000);
    this.pedidoForm.get('bar_code')?.setValue(code.toString());
  }

  async toggleRecording() {
    if (this.isRecording) {
      // Detener grabación
      const result = await VoiceRecorder.stopRecording();
      this.isRecording = false;

      if (result.value && result.value.recordDataBase64) {
        // El plugin devuelve base64
        this.audioBase64 = result.value.recordDataBase64;
        // Convertir a Blob para enviar al backend
        const byteCharacters = atob(this.audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        this.audioBlob = new Blob([byteArray], { type: 'audio/webm' });
        this.audioURL = URL.createObjectURL(this.audioBlob);
      }
      return;
    }

    try {
      // Solicitar permiso
      const permission = await VoiceRecorder.requestAudioRecordingPermission();
      if (!permission.value) {
        this.alertCtrl.create({
          header: 'No tienes permiso',
          message: 'No se otorgó permiso para grabar audio',
          buttons: ['OK']
        }).then(alert => alert.present());
        return;
      }

      // Iniciar grabación
      const startResult = await VoiceRecorder.startRecording();
      if (startResult.value) {
        this.isRecording = true;
      } else {
        throw new Error('No se pudo iniciar la grabación (el plugin devolvió false).');
      }

    } catch (err: any) {
      this.alertCtrl.create({
        header: 'Error',
        message: 'No se pudo iniciar la grabación: ' + (err.message || JSON.stringify(err)),
        buttons: ['OK']
      }).then(alert => alert.present());
      console.error('Error al iniciar grabación', err);
    }
  }

  public isSending: boolean = false;

  async submitPedido() {
    this.isSending = true;

    if (this.pedidoForm.invalid) {
      this.alertCtrl.create({
        header: 'Formulario incompleto',
        message: 'Por favor llena todos los campos obligatorios.',
        buttons: ['OK']
      }).then(alert => alert.present());
      return;
    }

    // 1️⃣ Crear objeto del pedido (JSON)
    const pedido = {
      cliente: {
        nombre: this.pedidoForm.get('name_cli')?.value,
        telefono: this.pedidoForm.get('tel_cli')?.value.toString()
      },
      dispositivo: {
        nombre: this.pedidoForm.get('device_name')?.value,
        color: this.pedidoForm.get('device_color')?.value || undefined
      },
      barCode: parseInt(this.pedidoForm.get('bar_code')?.value),
      descrip: this.pedidoForm.get('prob_texto')?.value
    };

    console.log('Pedido a enviar:', pedido);

    // 2️⃣ Construir FormData
    const formData = new FormData();

    // Agregar JSON como BLOB
    formData.append(
      "pedido",
      new Blob([JSON.stringify(pedido)], { type: "application/json" })
    );

    // 3️⃣ Procesar imágenes
    for (let i = 0; i < this.imagenesPreview.length; i++) {
      const imgPath = this.imagenesPreview[i];

      const blobImg = await this.cameraServ.convertBlob(imgPath);

      formData.append(
        "imagenes",
        blobImg,
        `imagen_${i}.jpg`
      );
    }

    // 4️⃣ Agregar audio (si existe)
    if (this.audioBlob) {
      formData.append("audio", this.audioBlob, "audio.webm");
    }

    // 4.5️⃣ Agregar video (si existe)
    if (this.videoFile) {
      formData.append("video", this.videoFile, this.videoFile.name);
    }

    try {
      // 5️⃣ Enviar al backend
      const resp = await this.pedidoServ.register(formData).toPromise();
      console.log("Respuesta Backend:", resp);

      this.pedidoServ.pedidos.push(resp.data);

      // 6️⃣ Mostrar alerta de éxito
      this.alertCtrl.create({
        header: 'Pedido registrado',
        message: 'El pedido ha sido registrado exitosamente.',
        buttons: ['OK']
      }).then(alert => alert.present());

      // 7️⃣ Imprimir
      await this.imprimirPedido(pedido.cliente.nombre, pedido.cliente.telefono, pedido.barCode.toString());

      // 8️⃣ Reset del formulario
      this.pedidoForm.reset();
      this.generarCodigo();
      this.audioBlob = new Blob();
      this.audioURL = '';
      this.isRecording = false;
      this.imagenesPreview = [];
      this.videoFile = undefined;
      this.videoPreviewURL = undefined;

    } catch (error: any) {
      console.error("ERROR al enviar:", error);
      
      let msg = 'No se pudo registrar el pedido.';
      if (error.status === 413) {
         msg = 'El archivo de video es demasiado pesado para el servidor (Error 413).';
      } else if (error.status === 0) {
         msg = 'Error de conexión. Puede que el video sea muy pesado o no haya internet.';
      } else if (error.message) {
         msg += ' ' + error.message;
      }

      this.alertCtrl.create({
        header: 'Error',
        message: msg,
        buttons: ['OK']
      }).then(alert => alert.present());
    } finally {
      this.isSending = false;
    }
  }


  async imprimirPedido(name_cli: string, tel_cli: string, bar_code: string) {
    try {
      const config = await Preferences.get({ key: 'printer_config' });
      if (!config.value) return;

      const { ip, port } = JSON.parse(config.value);

      const zpl = `^XA
^PW400
^LH0,0
^CI28

^A0N,25,25
^FO0,10
^FB400,1,0,C,0
^FD${name_cli}^FS

^A0N,20,20
^FO0,40
^FB400,1,0,C,0
^FD${tel_cli}^FS

^LH50,0        // margen solo para el código
^FO0,75
^BY1.5
^BCN,100,Y,N,N
^FD${bar_code}^FS

^XZ`;

      await this.printerService.sendZPL(ip, Number(port), zpl);
      console.log('✅ Código de barras impreso:', bar_code);
    } catch (err) {
      console.error('❌ Error al imprimir código de barras:', err);
    }
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.pedidoForm.reset();
    this.generarCodigo();
    this.audioBlob = new Blob();
    this.audioURL = '';
    this.isRecording = false;
    this.imagenesPreview = [];
    this.videoFile = undefined;
    this.videoPreviewURL = undefined;
    event.target.complete();
  }

}
