import { Pedido } from './../../../models/pedido';
import { MessageService } from './../../../services/message.service.service';
import { addIcons } from 'ionicons';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { checkmarkCircleOutline, documentTextOutline, imageOutline, imagesOutline, micOutline, playOutline, stopCircleOutline, trash } from 'ionicons/icons';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { StorageService } from 'src/app/services/storage.service';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-registrar-pedido',
  templateUrl: './registrar-pedido.component.html',
  styleUrls: ['./registrar-pedido.component.scss'],
  imports: [IonicModule, CommonModule, ReactiveFormsModule, CommonModule],
  standalone: true,
})
export class RegistrarPedidoComponent implements OnInit {

  public isLoad: Boolean;

  pedidoForm: FormGroup;

  isRecording = false;

  imagenesPreview: any[] = [];

  audioBlob!: Blob;
  audioURL!: string;

  constructor(private fb: FormBuilder, public msgServ: MessageService, private storServ: StorageService) {
    this.isLoad = true;
    this.pedidoForm = this.fb.group({
      bar_code: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(10)]],
      name_cli: ['', Validators.required],
      tel_cli: ['', Validators.required],
      device_name: ['', Validators.required],
      prob_texto: [''],
    });

    this.generarCodigo();
    addIcons({ documentTextOutline, imageOutline, imagesOutline, checkmarkCircleOutline, playOutline, stopCircleOutline, micOutline, trash });
  }


  getImage(image: any) {

    if (Capacitor.getPlatform() === 'web')
      return image;

    else
      return Capacitor.convertFileSrc(image);

  }


  async tomarFoto(desdeGaleria: boolean) {
    if (this.imagenesPreview.length >= 2) {
      this.msgServ.showScreenAlert('Límite alcanzado', 'Solo se permiten 2 imágenes por pedido');
      return;
    }
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        allowEditing: false,
        resultType: Capacitor.getPlatform() === 'web' ? CameraResultType.DataUrl : CameraResultType.Uri,
        source: desdeGaleria ? CameraSource.Photos : CameraSource.Camera
      });

      let imgToSave: string | Blob;

      if (Capacitor.getPlatform() === 'web' && image.dataUrl) {
        imgToSave = image.dataUrl; // base64 para web
      } else if (image.path) {
        // nativo
        imgToSave = image.path;
      } else {
        this.msgServ.showScreenAlert('¡Algo paso!', 'Algo paso al obtener la foto');
        return;
      }

      console.log(imgToSave);

      this.imagenesPreview.push(imgToSave);

    } catch (error) {
      console.error('Error al tomar la foto', error);
    }
  }

  deleteImage(index: number) {
    this.imagenesPreview.splice(index, 1);
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
        const audioBase64 = result.value.recordDataBase64;
        // Convertir a Blob para enviar al backend
        const byteCharacters = atob(audioBase64);
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
        this.msgServ.showScreenAlert('Error', 'No se otorgó permiso para grabar audio');
        return;
      }

      // Iniciar grabación
      await VoiceRecorder.startRecording();
      this.isRecording = true;

    } catch (err) {
      this.msgServ.showScreenAlert('Error', 'No se pudo iniciar la grabación');
      console.error('Error al iniciar grabación', err);
    }
  }

  async submitPedido() {

    // 3️⃣ Crear objeto del pedido
    const pedido: Pedido = {
      bar_code: this.pedidoForm.get('bar_code')?.value,
      name_cli: this.pedidoForm.get('name_cli')?.value,
      tel_cli: this.pedidoForm.get('tel_cli')?.value.toString(),
      device_name: this.pedidoForm.get('device_name')?.value,
      estatus: 'pendiente',
      img_1: this.imagenesPreview[0],
      img_2: this.imagenesPreview[1] || '',
      prob_texto: this.pedidoForm.get('prob_texto')?.value,
      prob_audio: this.audioURL || '',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    console.log('Pedido a enviar:', pedido);

    try {
      this.storServ.addUser(pedido);

      this.msgServ.showScreenAlert('¡Registrado!', 'Pedido registrado correctamente');

      // 5️⃣ Reset del formulario
      this.pedidoForm.reset();
      this.generarCodigo();
      this.audioBlob = new Blob();
      this.audioURL = '';
      this.isRecording = false;
      this.imagenesPreview = [];

    } catch (error: any) {
      console.log(error);
    }
  }


  async convertUriToBase64(uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject; reader.readAsDataURL(blob);
    });
  }


  ngOnInit() {
    setTimeout(() => {
      this.isLoad = false;
    }, 1500);
  }

  handleRefresh(event: RefresherCustomEvent) {
    setTimeout(() => {
      window.location.reload();
      event.target.complete();
    }, 100);
  }

}
