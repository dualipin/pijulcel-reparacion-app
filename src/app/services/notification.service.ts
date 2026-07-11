import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { IPedido } from '../models/Interfaces/IPedido';

const AVISO_MS = 30 * 60 * 1000; // 30 minutos antes de la entrega

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private permisosSolicitados = false;

  async requestPermissions(): Promise<void> {
    if (this.permisosSolicitados) return;
    this.permisosSolicitados = true;
    try {
      await LocalNotifications.requestPermissions();
    } catch (err) {
      console.error('Error solicitando permisos de notificaciones:', err);
    }
  }

  /** Programa un aviso 30 minutos antes de la entrega de cada pedido pendiente. */
  async programarAvisosEntrega(pedidos: IPedido[]): Promise<void> {
    try {
      const pendientes = await LocalNotifications.getPending();
      if (pendientes.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pendientes.notifications.map(n => ({ id: n.id }))
        });
      }

      const notificaciones = pedidos
        .filter(p => p.estatus !== 'Entregado' && !!p.deliveryAt)
        .map(p => ({ pedido: p, aviso: new Date(p.deliveryAt).getTime() - AVISO_MS }))
        .filter(({ aviso }) => !isNaN(aviso) && aviso > Date.now())
        .map(({ pedido, aviso }) => ({
          id: this.idParaPedido(pedido.barCode),
          title: 'Pedido próximo a entregar',
          body: `El pedido ${pedido.barCode} de ${pedido.cliente?.nombre || 'cliente'} se entrega en 30 minutos.`,
          schedule: { at: new Date(aviso) },
          extra: { barCode: pedido.barCode }
        }));

      if (notificaciones.length > 0) {
        await LocalNotifications.schedule({ notifications: notificaciones });
      }
    } catch (err) {
      console.error('Error programando avisos de entrega:', err);
    }
  }

  private idParaPedido(barCode: string): number {
    let hash = 0;
    for (let i = 0; i < barCode.length; i++) {
      hash = (hash * 31 + barCode.charCodeAt(i)) >>> 0;
    }
    return hash % 2147483647;
  }
}
