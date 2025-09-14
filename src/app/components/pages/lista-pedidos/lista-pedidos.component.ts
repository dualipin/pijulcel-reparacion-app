import { MessageService } from 'src/app/services/message.service.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { camera, checkbox, checkboxOutline, print, constructOutline, ellipsisVertical, hourglassOutline, logoWhatsapp, trash, layers, apps, informationCircleOutline } from 'ionicons/icons';
import { Pedido } from 'src/app/models/pedido';
import { Capacitor } from '@capacitor/core';
import { ActionSheetController, IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { StorageService } from 'src/app/services/storage.service';
import { of, switchMap } from 'rxjs';

@Component({
  selector: 'app-lista-pedidos',
  templateUrl: './lista-pedidos.component.html',
  styleUrls: ['./lista-pedidos.component.scss'],
  imports: [IonicModule, CommonModule],
  standalone: true,
})
export class ListaPedidosComponent implements OnInit {

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
      }
    },
    {
      text: 'Pendientes',
      icon: 'hourglass-outline',
      handler: () => {
        console.log('Pendientes');
      }
    },
    {
      text: 'En proceso',
      icon: 'construct-outline',
      handler: () => {
        console.log('En proceso');
      }
    },
    {
      text: 'Listos para entregar',
      icon: 'checkbox-outline',
      handler: () => {
        console.log('Listos para entregar');
      }
    },
    {
      text: 'Entregados',
      icon: 'checkbox',
      handler: () => {
        console.log('Entregado');
      }

    },
    {
      text: 'Cancelar',
      role: 'cancel'
    },
  ];

  pedidosFiltrados: Pedido[]; // copia inicial

  constructor(private actionSheetCtrl: ActionSheetController, public msgServ: MessageService, private storServ: StorageService) {
    this.pedidosFiltrados = [...this.pedidos];
    this.isLoad = true;
    addIcons({ apps, ellipsisVertical, informationCircleOutline, camera, print, layers, logoWhatsapp, trash, checkbox, checkboxOutline, constructOutline, hourglassOutline });
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
            /*const phone = pedido.tel_cli;
            const url = `https://wa.me/52${phone}?text=Hola%20${pedido.name_cli},%20sobre%20tu%20pedido%20${pedido.bar_code}`;
            window.open(url, '_blank');*/
            this.msgServ.showScreenAlert('¡Whatsapp!', 'Enviar mensaje a ' + pedido.tel_cli, ['Aceptar']);
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

  async getImage(img: string): Promise<string> {
    let isWeb = this.storServ.getIsWeb();
    if(isWeb){
      let data = localStorage.getItem(img);
      if(data) return data;
      else return "";
    } else {
      return this.storServ.getNativeImage(img);
    }
  }

  eliminarPedido(pedido: Pedido) {
    this.storServ.deleteUserById(pedido.bar_code);
    this.msgServ.showScreenAlert('¡Eliminado!', 'Pedido eliminado correctamente');
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
        this.pedidosFiltrados = data;
      });

    } catch (err) {
      throw new Error(`Error: ${err}`);
    }
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
