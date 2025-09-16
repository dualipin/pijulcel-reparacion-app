import { StorageService } from 'src/app/services/storage.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { Pedido } from 'src/app/models/pedido';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-detalles-pedido',
  templateUrl: './detalles-pedido.component.html',
  styleUrls: ['./detalles-pedido.component.scss'],
  imports: [IonicModule, CommonModule],
  standalone: true
})
export class DetallesPedidoComponent implements OnInit {

  pedido: Pedido;

  estatus: string[] = ["Pendiente", "En proceso", "Listo", "Entregado"]

  constructor(private route: ActivatedRoute, private storeServ: StorageService) {
    this.pedido = {
      bar_code: "",
      name_cli: "",
      tel_cli: "",
      device_name: "",
      prob_texto: "",
      prob_audio: "",
      img_1: "",
      img_2: "",
      estatus: "",
      created: "",
      updated: ""
    };
  }

  async ngOnInit() {
    let idPedido = this.route.snapshot.paramMap.get('id')!;
    console.log('ID recibido:', idPedido);

    let res = await this.storeServ.getPedidoById(idPedido);
    console.log(res);
    if (res)
      this.pedido = res;

    this.pedido.updated = new Date(this.pedido.updated);
    this.pedido.created = new Date(this.pedido.created);
  }

  chageStatus(estatus: string, bar_code: string) {
    this.storeServ.updateStatusById(estatus, bar_code);
  }

  getImage(img: string): string {
    let isWeb = this.storeServ.getIsWeb();
    if (isWeb) {
      let data = localStorage.getItem(img);
      if (data) {
        return data;
      }
      else return "";
    } else {
      return Capacitor.convertFileSrc(img);
    }
  }

  sendMessage() {
    const url = `https://wa.me/52${this.pedido.tel_cli}`;
    window.open(url, '_blank');
  }

}
