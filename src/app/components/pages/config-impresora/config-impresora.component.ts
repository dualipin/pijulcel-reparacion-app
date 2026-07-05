import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { searchOutline, settings } from 'ionicons/icons';
import { Network } from '@capacitor/network';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Preferences } from '@capacitor/preferences';
import { debounceTime } from 'rxjs/operators';
import { PrinterService } from 'src/app/services/printer.service';
import {
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText, IonInput,
  IonRefresher, IonRefresherContent, IonToolbar, IonHeader,
  IonTitle, IonProgressBar, IonButton, IonSpinner, IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-config-impresora',
  templateUrl: './config-impresora.component.html',
  styleUrls: ['./config-impresora.component.scss'],
  imports: [
    IonicModule, CommonModule, ReactiveFormsModule, IonSpinner,
    FormsModule, IonIcon, IonCard, IonCardHeader, IonToolbar,
    IonCardTitle, IonCardContent, IonText, IonRefresher, IonRefresherContent,
    IonHeader, IonTitle, IonProgressBar, IonInput, IonButton
  ],
  standalone: true,
})
export class ConfigImpresoraComponent implements OnInit {

  public isLoad: Boolean;

  public isLoading = false;
  public isScanning = false;

  printerForm!: FormGroup;
  testStatus: 'OK' | 'ERROR' | null = null;
  testMessage = '';
  scanMessage = 'Busca impresoras en la red local y selecciona una para guardarla.';
  foundPrinters: string[] = [];


  constructor(
    private printer: PrinterService,
    private fb: FormBuilder
  ) {
    this.isLoad = true;
    addIcons({ searchOutline, settings });
  }

  private getScanBaseIp(): string {
    const rawIp = String(this.printerForm?.value?.scanBaseIp ?? this.printerForm?.value?.ip ?? '').trim();

    if (!rawIp) {
      return '';
    }

    const parts = rawIp.replace(/\.$/, '').split('.').filter(Boolean);

    if (parts.length >= 3) {
      return parts.slice(0, 3).join('.');
    }

    return rawIp;
  }

  private setBaseIpFromConfiguredIp(ip?: string) {
    if (!ip) {
      return;
    }

    const parts = ip.trim().replace(/\.$/, '').split('.').filter(Boolean);

    if (parts.length >= 3) {
      this.printerForm.patchValue({
        scanBaseIp: parts.slice(0, 3).join('.'),
      }, { emitEvent: false });
    }
  }


  async testConnection() {
    this.isLoading = true;
    const { ip, port } = this.printerForm.value;
    this.testStatus = null;
    this.testMessage = 'Conectando...';

    try {
      const ok = await this.printer.testPrint(ip, Number(port));
      if (ok) {
        this.testStatus = 'OK';
        this.testMessage = 'Impresora conectada correctamente ✅';
      } else {
        this.testStatus = 'ERROR';
        this.testMessage = 'No se pudo comunicar con la impresora ❌';
      }
    } catch (err) {
      this.testStatus = 'ERROR';
      this.testMessage = 'Error de conexión: ' + err;
    } finally {
      this.isLoading = false;
    }
  }

  async searchPrinters() {
    const baseIp = this.getScanBaseIp();
    const networkStatus = await Network.getStatus();

    this.testStatus = null;
    this.scanMessage = '';
    this.foundPrinters = [];

    if (networkStatus.connectionType === 'none') {
      this.scanMessage = 'El dispositivo no tiene una conexión de red activa.';
      return;
    }

    if (!baseIp) {
      this.scanMessage = 'Ingresa una base de red válida, por ejemplo 192.168.1';
      return;
    }

    this.isScanning = true;
    this.scanMessage = `Escaneando ${baseIp}.1 - ${baseIp}.254 en el puerto 9100...`;

    try {
      const port = Number(this.printerForm.value.port ?? 9100);
      const printers = await this.printer.scanNetworkForPrinters(baseIp, port);
      this.foundPrinters = printers;
      this.scanMessage = printers.length
        ? `Se encontraron ${printers.length} impresora(s) en la red.`
        : 'No se encontraron impresoras en esa red.';
    } catch (error) {
      console.error('❌ Error durante el escaneo:', error);
      this.scanMessage = 'No se pudo completar el escaneo de red.';
    } finally {
      this.isScanning = false;
    }
  }

  async selectPrinter(ip: string) {
    this.printerForm.patchValue({ ip });
    this.setBaseIpFromConfiguredIp(ip);
    await this.saveConfig();
    this.testStatus = 'OK';
    this.testMessage = `Impresora seleccionada y guardada: ${ip}`;
  }

  async saveConfig() {
    await Preferences.set({
      key: 'printer_config',
      value: JSON.stringify({
        ip: this.printerForm.value.ip,
        port: this.printerForm.value.port,
      }),
    });
    this.testMessage = 'Configuración guardada correctamente ✅';
  }

  async ngOnInit() {
    this.printerForm = this.fb.group({
      ip: ['', [Validators.required]],
      port: [9100, [Validators.required]],
      scanBaseIp: [''],
    });

    // Cargar configuración guardada
    const saved = await Preferences.get({ key: 'printer_config' });
    if (saved.value) {
      const data = JSON.parse(saved.value);
      this.printerForm.patchValue(data);
      this.setBaseIpFromConfiguredIp(data.ip);
    }
    // Rellenar automáticamente el segmento de red cuando cambia el campo IP
    this.printerForm.get('ip')?.valueChanges.pipe(
      debounceTime(250),
    ).subscribe((val: string) => {
      this.setBaseIpFromConfiguredIp(val);
    });
    this.isLoad = false;
  }

  handleRefresh(event: RefresherCustomEvent) {
    setTimeout(() => {
      this.ngOnInit();
      event.target.complete();
    }, 100);
  }

}
