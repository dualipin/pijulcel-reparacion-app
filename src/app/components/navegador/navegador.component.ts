import { Component } from '@angular/core';
import { addIcons } from 'ionicons';
import { apps, addCircle, settings } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { FormsModule} from '@angular/forms';
import {
  IonIcon,
  IonTabBar,
  IonTabButton,
  IonTabs
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-navegador',
  templateUrl: './navegador.component.html',
  styleUrls: ['./navegador.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    IonicModule, FormsModule, IonTabBar, IonTabButton, IonTabs, IonIcon
  ],
  standalone: true
})
export class NavegadorComponent {

  isDesktop: boolean;

  constructor(private platform: Platform) {
    addIcons({ apps, addCircle, settings });
    this.isDesktop = this.platform.is('desktop');
  }

}
