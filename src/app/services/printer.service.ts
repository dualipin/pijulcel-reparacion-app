import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { CapacitorHttp } from '@capacitor/core';
import { DataEncoding, TcpSocket } from 'capacitor-tcp-socket';

interface PrinterConfig {
  ip?: string;
  port?: number;
}

@Injectable({ providedIn: 'root' })
export class PrinterService {

  private readonly printerConfigKey = 'printer_config';
  private readonly scanBatchSize = 30;
  private readonly scanTimeoutMs = 500;

  private readonly testCmd = `
    SIZE 50 mm,30 mm
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

    if (savedConfig?.ip && !ip) {
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

  async getLocalIP(): Promise<string> {
    try {
      const ni = (window as any)?.networkinterface;
      if (ni?.getWiFiIPAddress) {
        return await new Promise<string>((resolve, reject) => {
          ni.getWiFiIPAddress(
            (info: { ip?: string }) => resolve(info?.ip || ''),
            () => reject()
          );
        });
      }
    } catch { }
    return '';
  }

  async detectSubnet(): Promise<string> {
    const localIp = await this.getLocalIP();
    if (localIp) {
      const parts = localIp.trim().split('.');
      if (parts.length === 4) {
        return parts.slice(0, 3).join('.');
      }
    }
    return '';
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
        scanPromises.push(this.checkPrinterPort(targetIp, port, foundPrinters));
      }

      await Promise.all(scanPromises);
    }

    return foundPrinters;
  }

  private async checkPrinterPort(ip: string, port: number, foundList: string[]): Promise<void> {
    try {
      const connectPromise = TcpSocket.connect({ ipAddress: ip, port });
      
      const timeoutPromise = new Promise<{ client?: number }>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), this.scanTimeoutMs)
      );

      const result = await Promise.race([connectPromise, timeoutPromise]);
      
      if (result && result.client !== undefined) {
        foundList.push(ip);
        // Desconectar inmediatamente después de encontrarla
        await TcpSocket.disconnect({ client: result.client });
      }
    } catch (error: any) {
      // Ignorar errores de conexión (refused, timeout, host unreachable)
    }
  }

  async testPrint(ip?: string, port: number = 9100): Promise<boolean> {
    try {
      const target = await this.resolvePrinterTarget(ip, port);

      const { client } = await TcpSocket.connect({
        ipAddress: target.ip,
        port: target.port,
      });
      console.log('✅ Conectado a la impresora', client);

      await TcpSocket.send({
        client,
        data: this.testCmd,
        encoding: DataEncoding.UTF8,
      });

      await TcpSocket.disconnect({ client });
      console.log('✅ Impresión enviada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error al conectar/imprimir:', error);
      return false;
    }
  }

  async sendZPL(ip?: string, port: number = 9100, zplCommand: string = ''): Promise<boolean> {
    try {
      const target = await this.resolvePrinterTarget(ip, port);

      const { client } = await TcpSocket.connect({ ipAddress: target.ip, port: target.port });

      await TcpSocket.send({
        client,
        data: zplCommand,
        encoding: DataEncoding.UTF8,
      });

      await TcpSocket.disconnect({ client });
      console.log('✅ ZPL enviado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error al imprimir ZPL:', error);
      return false;
    }
  }

}
