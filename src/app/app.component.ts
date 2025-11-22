import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Camera } from '@capacitor/camera';
import { VoiceRecorder } from 'capacitor-voice-recorder';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor() { }

  async ngOnInit() {

    await Camera.requestPermissions();
    await VoiceRecorder.requestAudioRecordingPermission();

  }
}
