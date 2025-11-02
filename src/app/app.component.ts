import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Camera } from '@capacitor/camera';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
  public environmentInjector = inject(EnvironmentInjector);

  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    await Camera.requestPermissions();
    await VoiceRecorder.requestAudioRecordingPermission();
  }
}
