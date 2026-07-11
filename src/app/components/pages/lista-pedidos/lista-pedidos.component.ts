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
import { NotificationService } from 'src/app/services/notification.service';
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
        this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos);
      }
    },
    {
      text: 'Pendientes',
      icon: 'hourglass-outline',
      handler: () => {
        console.log('Pendientes');
        this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos.filter(
          (pedido) => pedido.estatus === "Pendiente"
        ));
      }
    },
    {
      text: 'En proceso',
      icon: 'construct-outline',
      handler: () => {
        console.log('En proceso');
        this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos.filter(
          (pedido) => pedido.estatus === "En proceso"
        ));
      }
    },
    {
      text: 'Listos para entregar',
      icon: 'checkbox-outline',
      handler: () => {
        console.log('Listos para entregar');
        this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos.filter(
          (pedido) => pedido.estatus === "Listo"
        ));
      }
    },
    {
      text: 'Entregados',
      icon: 'checkbox',
      handler: () => {
        console.log('Entregado');
        this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos.filter(
          (pedido) => pedido.estatus === "Entregado"
        ));
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
    private notifServ: NotificationService,
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
        this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos);
        this.notifServ.programarAvisosEntrega(this.pedidoServ.pedidos);
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

  isWebScanning = false;

  async startScan() {
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
      this.isWebScanning = true;
      
      // Esperamos un tick para que Angular renderice el elemento <video>
      setTimeout(async () => {
        const videoElement = document.getElementById('webScannerVideo') as HTMLVideoElement;
        if (videoElement) {
          try {
            await BarcodeScanner.startScan({ videoElement: videoElement });
            BarcodeScanner.addListener('barcodesScanned', async (result: any) => {
              if (result.barcodes.length > 0) {
                await this.stopWebScan();
                this.procesarCodigo(result.barcodes[0].rawValue);
              }
            });
          } catch (error) {
            console.error('Error iniciando escaneo web:', error);
            this.isWebScanning = false;
          }
        }
      }, 100);
      
    } else {
      // Dispositivos móviles (Android/iOS)
      try {
        const result = await BarcodeScanner.scan();
        if (result.barcodes.length > 0) {
          this.procesarCodigo(result.barcodes[0].rawValue);
        }
      } catch (error) {
        console.error('Error escaneando:', error);
      }
    }
  }

  async stopWebScan() {
    this.isWebScanning = false;
    await BarcodeScanner.stopScan();
    await BarcodeScanner.removeAllListeners();
  }

  async procesarCodigo(codigo: string) {
    console.log('Código detectado:', codigo);

    let encontrado = false;
    this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos.filter(
      (pedido) => {
        String(pedido.barCode) === String(codigo) ? (encontrado = true) : false;
        return String(pedido.barCode) === String(codigo);
      }
    ));

    if (!encontrado) {
      const alert = await this.alertCtrl.create({
        header: 'No encontrado',
        message: 'El código escaneado no coincide con ningún pedido.',
        buttons: ['Aceptar']
      });
      await alert.present();
      this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos);
    }
  }

  ionViewWillEnter() {
    this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos);
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
                  this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos);
                  this.notifServ.programarAvisosEntrega(this.pedidoServ.pedidos);
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

  /** Ordena los pedidos por proximidad de entrega (más próximos primero). Los entregados y sin fecha válida van al final. */
  private ordenarPorEntrega(pedidos: IPedido[]): IPedido[] {
    return [...pedidos].sort((a, b) => {
      const aEntregado = a.estatus === "Entregado";
      const bEntregado = b.estatus === "Entregado";
      if (aEntregado !== bEntregado) return aEntregado ? 1 : -1;

      const aTime = new Date(a.deliveryAt).getTime();
      const bTime = new Date(b.deliveryAt).getTime();
      const aValid = !isNaN(aTime);
      const bValid = !isNaN(bTime);
      if (aValid !== bValid) return aValid ? -1 : 1;
      if (!aValid && !bValid) return 0;

      return aTime - bTime;
    });
  }

  private msHastaEntrega(pedido: IPedido): number | null {
    if (!pedido.deliveryAt) return null;
    const time = new Date(pedido.deliveryAt).getTime();
    return isNaN(time) ? null : time - Date.now();
  }

  getEntregaColor(pedido: IPedido): string {
    if (pedido.estatus === "Entregado") return "medium";
    const ms = this.msHastaEntrega(pedido);
    if (ms === null) return "medium";
    if (ms <= 30 * 60 * 1000) return "danger";     // vencido o falta <= 30 min
    if (ms <= 2 * 60 * 60 * 1000) return "warning"; // falta <= 2 horas
    if (ms <= 24 * 60 * 60 * 1000) return "primary"; // falta <= 1 día
    return "success";
  }

  getEntregaTexto(pedido: IPedido): string {
    const ms = this.msHastaEntrega(pedido);
    if (ms === null) return "";
    if (ms <= 0) return "Vencido";

    const minutos = Math.round(ms / 60000);
    if (minutos < 60) return `En ${minutos} min`;

    const horas = Math.round(minutos / 60);
    if (horas < 24) return `En ${horas} h`;

    const dias = Math.round(horas / 24);
    return `En ${dias} d`;
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
      this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos);
      return;
    }

    this.pedidosFiltrados = this.ordenarPorEntrega(this.pedidoServ.pedidos.filter(p =>
      (p.barCode + "").toLowerCase().includes(val) ||
      (p.cliente.nombre + "").toLowerCase().includes(val) ||
      (p.cliente.telefono + "" || '').toLowerCase().includes(val)
    ));
  }

}
