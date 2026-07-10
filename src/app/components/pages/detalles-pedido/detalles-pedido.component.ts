import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CameraService } from 'src/app/services/camera.service';
import { IPedido } from 'src/app/models/Interfaces/IPedido';
import { environment } from 'src/environments/environment';
import { PedidoService } from 'src/app/services/pedido.service';
import { lastValueFrom } from 'rxjs';
import { alertCircleOutline, barcodeOutline, callOutline, construct, flagOutline, hardwareChipOutline, imagesOutline, logoWhatsapp, personCircleOutline, refreshOutline, timeOutline, colorPaletteOutline, videocamOutline, printOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonIcon, IonItem, IonLabel, IonNote, IonSelect, IonSelectOption,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText, IonImg,
  IonGrid, IonRow, IonCol, IonFab, IonFabButton, IonButtons, IonBackButton

} from '@ionic/angular/standalone';

@Component({
  selector: 'app-detalles-pedido',
  templateUrl: './detalles-pedido.component.html',
  styleUrls: ['./detalles-pedido.component.scss'],
  imports: [
    IonicModule, CommonModule, ReactiveFormsModule, FormsModule,
    IonIcon, IonItem, IonLabel, IonNote, IonSelect, IonSelectOption,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText, IonImg,
     IonGrid, IonRow, IonCol, IonFab, IonFabButton, IonButtons, IonBackButton
  ],
  standalone: true
})
export class DetallesPedidoComponent implements OnInit {

  pedido: IPedido;

  imgUrl: string = environment.urlImg;

  estatus: string[] = ["Pendiente", "En proceso", "Listo", "Entregado"]

  constructor(
    private route: ActivatedRoute,
    private cameraServ: CameraService,
    private pedidoServ: PedidoService
  ) {
    addIcons({ alertCircleOutline, personCircleOutline, callOutline, barcodeOutline, construct, logoWhatsapp, imagesOutline, hardwareChipOutline, flagOutline, timeOutline, refreshOutline, colorPaletteOutline, videocamOutline, printOutline });
    this.pedido = {
      barCode: "",
      cliente: {
        id: -1,
        nombre: "",
        telefono: ""
      },
      dispositivo: {
        id: -1,
        nombre: "",
        color: ""
      },
      descrip: "",
      audio: "",
      video: "",
      img1: "",
      img2: "",
      estatus: "",
      created: "",
      updated: ""
    };
  }

  async ngOnInit() {
    let idPedido = this.route.snapshot.paramMap.get('id')!;
    console.log('ID recibido:', idPedido);

    lastValueFrom(this.pedidoServ.getById(idPedido))
      .then((res: any) => {
        this.pedido = res.data;
        console.log('Pedido obtenido:', this.pedido);
      })
      .catch(err => {
        console.error('Error al obtener el pedido:', err);
      });
  }

  chageStatus(estatus: string, bar_code: string) {
    lastValueFrom(this.pedidoServ.updateStatus(bar_code, estatus))
      .then((res: any) => {
        console.log('Estatus actualizado:', res);
        this.pedido.estatus = estatus;
        this.pedidoServ.pedidos.map(p => {
          if (p.barCode === this.pedido.barCode) {
            p.estatus = estatus;
          }
          return p;
        });

      })
      .catch(err => {
        console.error('Error al actualizar el estatus:', err);
      });
  }

  getImage(img: string): string {
    return this.cameraServ.getImage(img);
  }

  sendMessage() {
    const url = `https://wa.me/52${this.pedido.cliente.telefono}`;
    window.open(url, '_blank');
  }

  back() {
    window.history.back();
  }

}
