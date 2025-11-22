import { IonicModule, AlertController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { StorageService } from 'src/app/services/storage.service';
import { addIcons } from 'ionicons';
import { eye, eyeOff, lockClosed, lockOpen, arrowBackOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    IonicModule, CommonModule, FormsModule, ReactiveFormsModule
  ],
  standalone: true
})
export class LoginComponent {

  loginForm: FormGroup;
  isCharging: Boolean = false;

  isHiddenPassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authServ: AuthService,
    private alertCtrl: AlertController,
    private router: Router,
    private storageServ: StorageService
  ) {
    addIcons({ eye, eyeOff, lockClosed, lockOpen, arrowBackOutline });
    this.loginForm = this.fb.group({
      user: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  async onLogin() {
    this.isCharging = true;

    const user = this.loginForm.get("user")?.value;
    const pass = this.loginForm.get("password")?.value;

    let info = {
      "username": user,
      "password": pass
    }

    lastValueFrom(this.authServ.login(info))
      .then(async (res: any) => {
        console.log(res);
        this.isCharging = false;
        this.router.navigateByUrl('/tabs/list-pedidos');
        this.authServ.setToken(res.data.token);
        await this.storageServ.saveItemStorage("token", res.data.token);
      })
      .catch(async (err) => {
        console.error(err);
        this.isCharging = false;
        const alert = await this.alertCtrl.create({
          header: 'Credenciales inválidas',
          message: 'Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.',
          buttons: ['Aceptar']
        });
        await alert.present();
      });


  }

  goBack() {
    this.router.navigateByUrl('/login-create');
  }


}
