import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { settings } from 'ionicons/icons';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Preferences } from '@capacitor/preferences';
import { PrinterService } from 'src/app/services/printer.service';

@Component({
  selector: 'app-config-impresora',
  templateUrl: './config-impresora.component.html',
  styleUrls: ['./config-impresora.component.scss'],
  imports: [
    IonicModule, CommonModule, ReactiveFormsModule,
    FormsModule
  ],
  standalone: true,
})
export class ConfigImpresoraComponent implements OnInit {

  public isLoad: Boolean;

  public isLoading = false;

  printerForm!: FormGroup;
  testStatus: 'OK' | 'ERROR' | null = null;
  testMessage = '';


  constructor(
    private printer: PrinterService,
    private fb: FormBuilder
  ) {
    this.isLoad = true;
    addIcons({ settings });
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

  async saveConfig() {
    await Preferences.set({
      key: 'printer_config',
      value: JSON.stringify(this.printerForm.value),
    });
    this.testMessage = 'Configuración guardada correctamente ✅';
  }

  async ngOnInit() {
    this.printerForm = this.fb.group({
      ip: ['', [Validators.required]],
      port: [9100, [Validators.required]],
    });

    // Cargar configuración guardada
    const saved = await Preferences.get({ key: 'printer_config' });
    if (saved.value) {
      const data = JSON.parse(saved.value);
      this.printerForm.patchValue(data);
    }
    this.isLoad = false;
  }

  handleRefresh(event: RefresherCustomEvent) {
    setTimeout(() => {
      this.ngOnInit();
      event.target.complete();
    }, 100);
  }

}
