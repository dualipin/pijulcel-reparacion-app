import { NavController } from '@ionic/angular/standalone';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExceptionService {

  constructor(
    private alertCtrl: AlertController,
    private authServ: AuthService,
    private navCtrl: NavController
  ) { }

  /**
   * Maneja los errores de las peticiones HTTP.
   * @param {any} error - El error capturado por el interceptor.
   * Este método maneja errores comunes como el 503 (Servicio no disponible) y el 0 (Sin conexión).
   */
  handleError(error: any): void {
    console.log("La petición respondio con [" + error.status + "]", error);

    if(error.status == 401) {
      // ERROR 401: No autorizado - Sesión expirada
      this.alertCtrl.create({
        header: 'Sesión expirada',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
        buttons: ['OK']
      }).then(alert => alert.present());

      this.navCtrl.navigateRoot('/login');
      return;
    }

    // ERROR 503: Servicio no disponible
    // ERROR 0: Sin conexión
    if (error.status == 503 || error.status == 0)
      this.reintentarConexion();
  }

  async reintentarConexion() {
    const alert = await this.alertCtrl.create({
      header: "¡Servidor desconectado!",
      message: "Lamentamos el inconveniente, vuelve a intentarlo más tarde.",
      buttons: [
        { text: 'Reintentar', handler: async () => {
          try {
            await lastValueFrom(this.authServ.testAPI());
            const confirm = await this.alertCtrl.create({
              header: "Conexión restaurada",
              message: "La conexión se restauró correctamente.",
              buttons: ["OK"]
            });
            await confirm.present();
          } catch (error:any) {
            this.handleError(error);
          }
         } },
        { text: 'Entiendo', role: 'cancel' }
      ]
    });
    await alert.present();
  }

}
