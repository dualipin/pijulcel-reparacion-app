import { NavController } from '@ionic/angular/standalone';
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

export const sesionGuard: CanActivateFn = async (route, state) => {
  const authServ = inject(AuthService);
  const storageServ = inject(StorageService);
  const navCtrl = inject(NavController);
  
  let token = authServ.token;
  if (!token) {
    token = await storageServ.getItemStorage('token');
    if (token) {
      authServ.token = token;
    }
  }

  console.log('Token en guard:', token);
  if (token == null || token === '') {
    navCtrl.navigateRoot('/login');
    return false;
  }
  return true;
};
