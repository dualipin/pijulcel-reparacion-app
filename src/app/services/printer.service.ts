import { Injectable } from '@angular/core';
import { TcpSocket, DataEncoding } from 'capacitor-tcp-socket';

@Injectable({ providedIn: 'root' })
export class PrinterService {

  // 🔹 Comando TSPL de prueba (texto centrado)
  private readonly testCmd = `
    SIZE 40 mm,30 mm
    GAP 2 mm,0
    DENSITY 10
    CLS
    TEXT 10,80,"3",0,1,1,"Prueba de conexión OK"
    PRINT 1
  `;

  constructor() { }

  /**
   * 🔍 Testea conexión con la impresora
   * @param ip Dirección IP de la impresora
   * @param port Puerto TCP (por defecto 9100)
   */
  async testPrint(ip: string, port: number = 9100): Promise<boolean> {
    try {
      // 1️⃣ Conectar
      const result = await TcpSocket.connect({
        ipAddress: ip,
        port: port,
      });

      const client = result.client;
      console.log('✅ Conectado a la impresora', client);

      // 2️⃣ Enviar comando de prueba
      await TcpSocket.send({
        client,
        data: this.testCmd,
        encoding: DataEncoding.UTF8,
      });

      // 3️⃣ Desconectar
      await TcpSocket.disconnect({ client });
      console.log('✅ Impresión enviada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error al conectar/imprimir:', error);
      return false;
    }
  }

  /**
   * 🖨️ Enviar comando ZPL a la impresora (por TCP/IP)
   */
  async sendZPL(ip: string, port: number, zplCommand: string): Promise<boolean> {
    try {
      // 1️⃣ Conectar
      const { client } = await TcpSocket.connect({ ipAddress: ip, port });

      // 2️⃣ Enviar como texto UTF-8
      await TcpSocket.send({
        client,
        data: zplCommand,
        encoding: "utf8" as any,
      });

      // 3️⃣ Cerrar conexión
      await TcpSocket.disconnect({ client });
      console.log('✅ ZPL enviado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error al imprimir ZPL:', error);
      return false;
    }
  }


}
