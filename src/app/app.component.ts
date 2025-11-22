import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private authServ: AuthService,
    private storageServ: StorageService
  ) { }

  ngOnInit() {
    this.storageServ.getItemStorage('token')
      .then(token => {
        if (token) this.authServ.setToken(token);
      });
  }
}
