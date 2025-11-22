import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { Capacitor } from '@capacitor/core';
import { environment } from './environments/environment.prod';
import { enableProdMode } from '@angular/core';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { provideHttpClient } from '@angular/common/http';

if (environment.production) {
  enableProdMode();
}
// --> Below only required if you want to use a web platform
const platform = Capacitor.getPlatform();
if (platform === "web") {
  // Web platform - required for toast component in Browser
  defineCustomElements(window);
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
