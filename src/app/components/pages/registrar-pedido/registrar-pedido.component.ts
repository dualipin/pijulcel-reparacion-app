import { VoiceRecorder } from 'capacitor-voice-recorder';
import { addIcons } from 'ionicons';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { camera, checkmarkCircleOutline, documentTextOutline, imageOutline, images, imagesOutline, micOutline, playOutline, stopCircleOutline, trash } from 'ionicons/icons';
import { AlertController, IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { PrinterService } from 'src/app/services/printer.service';
import { CameraService } from 'src/app/services/camera.service';
import { PedidoService } from 'src/app/services/pedido.service';

import {
  IonButton, IonIcon, IonInput, IonItem, IonLabel, IonTextarea,
  IonRefresher, IonRefresherContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent

} from '@ionic/angular/standalone';

@Component({
  selector: 'app-registrar-pedido',
  templateUrl: './registrar-pedido.component.html',
  styleUrls: ['./registrar-pedido.component.scss'],
  imports: [
    IonicModule, CommonModule,
    ReactiveFormsModule, FormsModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonInput, IonTextarea, IonButton, IonIcon,
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

  constructor(
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private printerService: PrinterService,
    private cameraServ: CameraService,
    private pedidoServ: PedidoService
  ) {
    this.isLoad = true;
    this.pedidoForm = this.fb.group({
      bar_code: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(10)]],
      name_cli: ['', [Validators.required, Validators.maxLength(50)]],
      tel_cli: ['', [Validators.required, Validators.maxLength(20)]],
      device_name: ['', [Validators.required, Validators.maxLength(60)]],
      prob_texto: ['', [Validators.maxLength(510)]],
    });

    this.generarCodigo();
    addIcons({ documentTextOutline, trash, images, camera, imageOutline, imagesOutline, checkmarkCircleOutline, playOutline, stopCircleOutline, micOutline });
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
      await VoiceRecorder.startRecording();
      this.isRecording = true;

    } catch (err) {
      this.alertCtrl.create({
        header: 'Error',
        message: 'No se pudo iniciar la grabación',
        buttons: ['OK']
      }).then(alert => alert.present());
      console.error('Error al iniciar grabación', err);
    }
  }

  async submitPedido() {

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
        nombre: this.pedidoForm.get('device_name')?.value
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

    try {
      // 5️⃣ Enviar al backend
      const resp = await this.pedidoServ.register(formData).toPromise();
      console.log("Respuesta Backend:", resp);

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

    } catch (error) {
      console.error("ERROR al enviar:", error);

      this.alertCtrl.create({
        header: 'Error',
        message: 'No se pudo registrar el pedido.',
        buttons: ['OK']
      }).then(alert => alert.present());
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
    event.target.complete();
  }

}
