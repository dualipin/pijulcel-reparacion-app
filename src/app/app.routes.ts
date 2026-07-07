import { Routes } from '@angular/router';
import { NavegadorComponent } from './components/navegador/navegador.component';
import { ConfigImpresoraComponent } from './components/pages/config-impresora/config-impresora.component';
import { DetallesPedidoComponent } from './components/pages/detalles-pedido/detalles-pedido.component';
import { ListaPedidosComponent } from './components/pages/lista-pedidos/lista-pedidos.component';
import { RegistrarPedidoComponent } from './components/pages/registrar-pedido/registrar-pedido.component';
import { LoginComponent } from './components/login/login.component';
import { sesionGuard } from './guards/sesion.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'detalles/:id', component: DetallesPedidoComponent, canActivate: [sesionGuard] },
  {
    path: 'tabs',
    component: NavegadorComponent, canActivate: [sesionGuard],
    children: [
      {
        path: 'list-pedidos', component: ListaPedidosComponent
      },
      { path: 'nuevo-pedido', component: RegistrarPedidoComponent },
      { path: 'config-impresora', component: ConfigImpresoraComponent }
    ]
  },
  {
    path: 'upload-video',
    loadComponent: () => import('./pages/upload-video/upload-video.page').then( m => m.UploadVideoPage)
  },
];
