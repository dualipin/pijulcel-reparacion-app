import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Camera } from '@capacitor/camera';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private notifServ: NotificationService) { }

  async ngOnInit() {

    await Camera.requestPermissions();
    await VoiceRecorder.requestAudioRecordingPermission();
    await this.notifServ.requestPermissions();

  }
}
