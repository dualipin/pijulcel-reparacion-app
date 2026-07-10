import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, NgZone, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { camera, checkbox, checkboxOutline, print, constructOutline, ellipsisVertical, hourglassOutline, logoWhatsapp, trash, layers, apps, informationCircleOutline, barcodeOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { ActionSheetController, AlertController, IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { Router } from '@angular/router';
import { PrinterService } from 'src/app/services/printer.service';
import { Preferences } from '@capacitor/preferences';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { CameraService } from 'src/app/services/camera.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { lastValueFrom } from 'rxjs';
import { IPedido } from 'src/app/models/Interfaces/IPedido';
import { environment } from 'src/environments/environment';
import { ExceptionService } from 'src/app/services/exception.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonButtons, IonButton, IonFab, IonFabButton,
  IonSearchbar, IonContent, IonList, IonItem, IonLabel,
  IonBadge, IonRefresher, IonRefresherContent, IonHeader, IonTitle, IonToolbar, IonThumbnail

} from '@ionic/angular/standalone';

@Component({
  selector: 'app-lista-pedidos',
  templateUrl: './lista-pedidos.component.html',
  styleUrls: ['./lista-pedidos.component.scss'],
  imports: [
    IonicModule, CommonModule, FormsModule, ReactiveFormsModule, IonHeader,
    IonToolbar, IonTitle, IonButtons, IonButton, IonSearchbar,
    IonContent, IonList, IonItem, IonLabel, IonBadge, IonRefresher,
    IonRefresherContent, IonThumbnail, IonFab, IonFabButton
  ]
})
export class ListaPedidosComponent implements OnInit, AfterViewInit {

  public isLoad: Boolean = true;

  imgUrl: string = environment.urlImg;



  getFileSrc(path: string): string {
    return Capacitor.convertFileSrc(path);
  }

  public filtrar = [
    {
      text: 'Todos',
      icon: 'layers',
      handler: () => {
        console.log('Todos');
        this.pedidosFiltrados = this.pedidoServ.pedidos;
      }
    },
    {
      text: 'Pendientes',
      icon: 'hourglass-outline',
      handler: () => {
        console.log('Pendientes');
        this.pedidosFiltrados = this.pedidoServ.pedidos.filter(
          (pedido) => pedido.estatus === "Pendiente"
        );
      }
    },
    {
      text: 'En proceso',
      icon: 'construct-outline',
      handler: () => {
        console.log('En proceso');
        this.pedidosFiltrados = this.pedidoServ.pedidos.filter(
          (pedido) => pedido.estatus === "En proceso"
        );
      }
    },
    {
      text: 'Listos para entregar',
      icon: 'checkbox-outline',
      handler: () => {
        console.log('Listos para entregar');
        this.pedidosFiltrados = this.pedidoServ.pedidos.filter(
          (pedido) => pedido.estatus === "Listo"
        );
      }
    },
    {
      text: 'Entregados',
      icon: 'checkbox',
      handler: () => {
        console.log('Entregado');
        this.pedidosFiltrados = this.pedidoServ.pedidos.filter(
          (pedido) => pedido.estatus === "Entregado"
        );
      }

    },
    {
      text: 'Cancelar',
      role: 'cancel'
    },
  ];

  pedidosFiltrados: IPedido[] = []; // copia inicial

  constructor(
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private printerService: PrinterService,
    private alertCtrl: AlertController,
    private cameraServ: CameraService,
    private pedidoServ: PedidoService,
    private exServ: ExceptionService,
    private zone: NgZone
  ) {
    addIcons({ barcodeOutline, apps, ellipsisVertical, informationCircleOutline, camera, print, layers, logoWhatsapp, trash, checkbox, checkboxOutline, constructOutline, hourglassOutline });
  }

  async ngOnInit() {
    this.isLoad = true;
    await lastValueFrom(this.pedidoServ.getAll())
      .then(res => {
        console.log('Pedidos obtenidos:', res);
        this.pedidoServ.pedidos = res.data;
        this.pedidosFiltrados = [...this.pedidoServ.pedidos];
      })
      .catch(err => {
        console.error('Error al obtener los pedidos:', err);
        this.isLoad = false;
        this.exServ.handleError(err);
      }).finally(() => {
        this.isLoad = false;
      });
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

  async startScan() {
    const result = await BarcodeScanner.scan();
    if (result.barcodes.length > 0) {

      console.log('Código detectado:', result.barcodes[0].rawValue);

      let encontrado = false;

      this.pedidosFiltrados = this.pedidoServ.pedidos.filter(
        (pedido) => {
          console.log('Filtrando pedido:', pedido);
          String(pedido.barCode) === String(result.barcodes[0].rawValue) ? (encontrado = true) : false;
          return String(pedido.barCode) === String(result.barcodes[0].rawValue);
        }
      );

      if (!encontrado) {
        const alert = await this.alertCtrl.create({
          header: 'No encontrado',
          message: 'El código escaneado no coincide con ningún pedido.',
          buttons: ['Aceptar']
        });
        await alert.present();
        this.pedidosFiltrados = this.pedidoServ.pedidos;
      }
    }
  }

  ionViewWillEnter() {
    this.pedidosFiltrados = [...this.pedidoServ.pedidos];
  }

  async openAcciones(pedido: IPedido) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Acciones',
      buttons: [
        {
          text: 'Reimprimir código de barras',
          icon: 'print',
          handler: async () => {
            try {
              const config = await Preferences.get({ key: 'printer_config' });
              if (!config.value) return;

              const { ip, port } = JSON.parse(config.value);

              const zpl = `^XA
^PW380
^LL240
^LH0,0
^CI28

^A0N,25,25
^FO0,5
^FB380,1,0,C,0
^FD${pedido.cliente.nombre}^FS

^A0N,25,25
^FO0,35
^FB380,1,0,C,0
^FD${pedido.cliente.telefono}^FS

^A0N,25,25
^FO0,65
^FB380,1,0,C,0
^FD${pedido.dispositivo.nombre} - ${pedido.dispositivo.color || 'Sin color'}^FS

^FO130,95
^BQN,2,5
^FDQA,${pedido.barCode}^FS

^XZ`;


              await this.printerService.sendZPL(ip, port, zpl);
              console.log('✅ Código de barras Reimpreso:', pedido.barCode);
            } catch (err) {
              console.error('❌ Error al imprimir código de barras:', err);
            }
          }
        },
        {
          text: 'WhatsApp',
          icon: 'logo-whatsapp',
          handler: () => {
            const url = `https://wa.me/529361165168?text=Hola%20${pedido.cliente.nombre},%20sobre%20tu%20pedido%20${pedido.barCode}`;
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
    return this.cameraServ.getImage(img);
  }

  eliminarPedido(pedido: IPedido) {
    this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar el pedido con código ${pedido.barCode}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            console.log(`Pedido con código ${pedido.barCode} eliminado.`);
            lastValueFrom(this.pedidoServ.delete(pedido.barCode))
              .then(res => {
                this.zone.run(() => {
                  this.pedidoServ.pedidos = this.pedidoServ.pedidos.filter(
                    p => parseInt(p.barCode) !== parseInt(pedido.barCode)
                  );
                  this.pedidosFiltrados = [...this.pedidoServ.pedidos];
                  console.log('Después de eliminar:', this.pedidosFiltrados);
                });
              })
              .catch(err => {
                console.error('Error al eliminar el pedido:', err);
                this.exServ.handleError(err);
              });
          }
        }
      ]
    }).then(alert => alert.present());
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case "Pendiente":
        return "warning";   // amarillo
      case "En proceso":
        return "primary";   // azul
      case "Listo":
        return "tertiary";  // morado/verde según tema
      case "Entregado":
        return "success";   // verde
      default:
        return "medium";    // gris
    }
  }


  irDetalle(bar_code: string) {
    this.router.navigate(['/detalles', bar_code]);
  }

  async handleRefresh(event: RefresherCustomEvent) {
    await this.ngOnInit();
    event.target.complete();
  }

  filtrarPedidos(event: any) {
    const val = (event.target.value || '') + "".toLowerCase();
    if (!val) {
      this.pedidosFiltrados = [...this.pedidoServ.pedidos];
      return;
    }

    this.pedidosFiltrados = this.pedidoServ.pedidos.filter(p =>
      (p.barCode + "").toLowerCase().includes(val) ||
      (p.cliente.nombre + "").toLowerCase().includes(val) ||
      (p.cliente.telefono + "" || '').toLowerCase().includes(val)
    );
  }

}
