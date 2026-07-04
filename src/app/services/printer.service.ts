import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { DataEncoding, TcpSocket } from 'capacitor-tcp-socket';

interface PrinterConfig {
  ip?: string;
  port?: number;
}

@Injectable({ providedIn: 'root' })
export class PrinterService {

  private readonly printerConfigKey = 'printer_config';
  private readonly scanBatchSize = 20;
  private readonly scanTimeoutMs = 400;

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

  private normalizeIp(ip: string): string {
    return ip.trim();
  }

  private normalizeBaseIp(baseIp: string): string {
    const normalized = baseIp.trim().replace(/\.$/, '');
    const parts = normalized.split('.').filter(Boolean);

    if (parts.length >= 3) {
      return parts.slice(0, 3).join('.');
    }

    return normalized;
  }

  private async getStoredPrinterConfig(): Promise<PrinterConfig | null> {
    const saved = await Preferences.get({ key: this.printerConfigKey });

    if (!saved.value) {
      return null;
    }

    try {
      return JSON.parse(saved.value) as PrinterConfig;
    } catch (error) {
      console.error('❌ Configuración de impresora inválida:', error);
      return null;
    }
  }

  private async resolvePrinterTarget(ip?: string, port: number = 9100): Promise<{ ip: string; port: number }> {
    const savedConfig = await this.getStoredPrinterConfig();

    if (savedConfig?.ip) {
      return {
        ip: this.normalizeIp(savedConfig.ip),
        port: Number(savedConfig.port ?? port ?? 9100),
      };
    }

    const normalizedIp = ip ? this.normalizeIp(ip) : '';

    if (!normalizedIp) {
      throw new Error('No hay una IP de impresora configurada');
    }

    return {
      ip: normalizedIp,
      port: Number(port ?? 9100),
    };
  }

  async getPrinterConfig(): Promise<PrinterConfig | null> {
    return this.getStoredPrinterConfig();
  }

  async scanNetworkForPrinters(baseIp: string, port: number = 9100): Promise<string[]> {
    const normalizedBaseIp = this.normalizeBaseIp(baseIp);

    if (!normalizedBaseIp) {
      return [];
    }

    const foundPrinters: string[] = [];

    for (let start = 1; start <= 254; start += this.scanBatchSize) {
      const scanPromises: Promise<void>[] = [];
      const end = Math.min(start + this.scanBatchSize - 1, 254);

      for (let host = start; host <= end; host++) {
        const targetIp = `${normalizedBaseIp}.${host}`;
        scanPromises.push(this.checkPrinterOnIp(targetIp, port, foundPrinters));
      }

      await Promise.all(scanPromises);
    }

    return foundPrinters;
  }

  private async checkPrinterOnIp(ip: string, port: number, foundList: string[]): Promise<void> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let client: number | null = null;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Timeout')), this.scanTimeoutMs);
      });

      const connectPromise = TcpSocket.connect({
        ipAddress: ip,
        port,
      });

      const result = await Promise.race([connectPromise, timeoutPromise]) as { client: number };
      client = result.client;
      foundList.push(ip);
    } catch (error) {
      return;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (client !== null) {
        try {
          await TcpSocket.disconnect({ client });
        } catch (disconnectError) {
          console.warn('⚠️ No se pudo cerrar la conexión TCP:', disconnectError);
        }
      }
    }
  }

  /**
   * 🔍 Testea conexión con la impresora
   * @param ip Dirección IP de la impresora
   * @param port Puerto TCP (por defecto 9100)
   */
  async testPrint(ip?: string, port: number = 9100): Promise<boolean> {
    try {
      const target = await this.resolvePrinterTarget(ip, port);

      // 1️⃣ Conectar
      const result = await TcpSocket.connect({
        ipAddress: target.ip,
        port: target.port,
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
  async sendZPL(ip?: string, port: number = 9100, zplCommand: string = ''): Promise<boolean> {
    try {
      const target = await this.resolvePrinterTarget(ip, port);

      // 1️⃣ Conectar
      const { client } = await TcpSocket.connect({ ipAddress: target.ip, port: target.port });

      // 2️⃣ Enviar como texto UTF-8
      await TcpSocket.send({
        client,
        data: zplCommand,
        encoding: DataEncoding.UTF8,
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
