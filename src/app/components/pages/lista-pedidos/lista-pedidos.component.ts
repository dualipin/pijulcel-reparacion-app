import { MessageService } from 'src/app/services/message.service.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { camera, checkbox, checkboxOutline, print, constructOutline, ellipsisVertical, hourglassOutline, logoWhatsapp, trash, layers, apps, informationCircleOutline } from 'ionicons/icons';
import { Pedido } from 'src/app/models/pedido';
import { Capacitor } from '@capacitor/core';
import { ActionSheetController, IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { StorageService } from 'src/app/services/storage.service';
import { of, switchMap } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lista-pedidos',
  templateUrl: './lista-pedidos.component.html',
  styleUrls: ['./lista-pedidos.component.scss'],
  imports: [IonicModule, CommonModule],
  standalone: true,
})
export class ListaPedidosComponent implements OnInit, AfterViewInit {

  public isLoad: Boolean;

  pedidos: Pedido[] = [];

  getFileSrc(path: string): string {
    return Capacitor.convertFileSrc(path);
  }

  public filtrar = [
    {
      text: 'Todos',
      icon: 'layers',
      handler: () => {
        console.log('Todos');
        this.pedidosFiltrados = this.pedidos;
      }
    },
    {
      text: 'Pendientes',
      icon: 'hourglass-outline',
      handler: () => {
        console.log('Pendientes');
        this.pedidosFiltrados = this.pedidos.filter(
          (pedido) => pedido.estatus === "Pendiente"
        );
      }
    },
    {
      text: 'En proceso',
      icon: 'construct-outline',
      handler: () => {
        console.log('En proceso');
        this.pedidosFiltrados = this.pedidos.filter(
          (pedido) => pedido.estatus === "En proceso"
        );
      }
    },
    {
      text: 'Listos para entregar',
      icon: 'checkbox-outline',
      handler: () => {
        console.log('Listos para entregar');
        this.pedidosFiltrados = this.pedidos.filter(
          (pedido) => pedido.estatus === "Listo"
        );
      }
    },
    {
      text: 'Entregados',
      icon: 'checkbox',
      handler: () => {
        console.log('Entregado');
        this.pedidosFiltrados = this.pedidos.filter(
          (pedido) => pedido.estatus === "Entregado"
        );
      }

    },
    {
      text: 'Cancelar',
      role: 'cancel'
    },
  ];

  pedidosFiltrados: Pedido[]; // copia inicial

  constructor(private router: Router, private actionSheetCtrl: ActionSheetController, public msgServ: MessageService, private storServ: StorageService) {
    this.pedidosFiltrados = [];
    this.isLoad = true;
    addIcons({ apps, ellipsisVertical, informationCircleOutline, camera, print, layers, logoWhatsapp, trash, checkbox, checkboxOutline, constructOutline, hourglassOutline });
  }
  ngAfterViewInit(): void {
    const platform = Capacitor.getPlatform();
    console.log(platform);
    if (platform === 'ios') {
      const search = document.getElementById("barSearch");
      if (search)
        search.style.marginTop = "1.25vh";
    }
  }

  async openAcciones(pedido: Pedido) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Acciones',
      buttons: [
        {
          text: 'Reimprimir código de barras',
          icon: 'print',
          handler: () => {
            this.msgServ.showScreenAlert('¡Reimprimiendo!', 'Reimprimiendo ticket del pedido ' + pedido.bar_code);
          }
        },
        {
          text: 'WhatsApp',
          icon: 'logo-whatsapp',
          handler: () => {
            const url = `https://wa.me/529361165168?text=Hola%20${pedido.name_cli},%20sobre%20tu%20pedido%20${pedido.bar_code}`;
            window.open(url, '_blank');
            //this.msgServ.showScreenAlert('¡Whatsapp!', 'Enviar mensaje a ' + pedido.tel_cli, ['Aceptar']);
          }
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.eliminarPedido(pedido);
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  getImage(img: string): string {
    let isWeb = this.storServ.getIsWeb();
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

  async eliminarPedido(pedido: Pedido) {
    this.storServ.deleteUserById(pedido.bar_code);

    if (this.storServ.getIsWeb()) {
      this.storServ.deleteFileWeb(pedido.bar_code + "_1");
      if (pedido.img_2)
        this.storServ.deleteFileWeb(pedido.bar_code + "_2");
    } else {
      let res = await this.storServ.eliminarImagen(this.extractUri(pedido.img_1));
      if (res === "error")
        this.msgServ.showScreenAlert('¡Error!', 'Hubo un error al eliminar la imagen');

      if (pedido.img_2 !== '') {
        res = await this.storServ.eliminarImagen(this.extractUri(pedido.img_2));
        if (res === "error")
          this.msgServ.showScreenAlert('¡Error!', 'Hubo un error al eliminar la imagen');
      }

      if (pedido.prob_audio !== '') {
        res = await this.storServ.eliminarImagen(this.extractUri(pedido.prob_audio));
        if (res === "error")
          this.msgServ.showScreenAlert('¡Error!', 'Hubo un error al eliminar la imagen');
      }
    }
    this.msgServ.showScreenAlert('¡Eliminado!', 'Pedido eliminado correctamente');
  }

  extractUri(uri: string): string {
    const partes = uri.split('/');
    return partes[partes.length - 1];
  }

  ngOnInit() {
    try {
      this.storServ.userState().pipe(
        switchMap(res => {
          if (res) {
            return this.storServ.fetchUsers();
          } else {
            return of([]); // Return an empty array when res is false
          }
        })
      ).subscribe(data => {
        console.log(data);
        this.pedidos = data; // Update the user list when the data changes
        this.pedidosFiltrados = [];
        for (let i = this.pedidos.length - 1; i >= 0; i--) {
          const element: Pedido = this.pedidos[i];
          this.pedidosFiltrados.push(element);
        }
      });

    } catch (err) {
      throw new Error(`Error: ${err}`);
    }
  }

  irDetalle(bar_code: string) {
    this.router.navigate(['/detalles', bar_code]);
  }

  handleRefresh(event: RefresherCustomEvent) {
    setTimeout(() => {
      window.location.reload();
      event.target.complete();
    }, 100);
  }

  filtrarPedidos(event: any) {
    const val = event.target.value.toLowerCase();
    if (!val) {
      this.pedidosFiltrados = [...this.pedidos];
      return;
    }

    this.pedidosFiltrados = this.pedidos.filter(p =>
      p.bar_code.toLowerCase().includes(val) ||
      p.name_cli.toLowerCase().includes(val) ||
      p.tel_cli.toLowerCase().includes(val)
    );
  }

}
