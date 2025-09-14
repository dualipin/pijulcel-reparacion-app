import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Injectable } from '@angular/core';
import { SQLiteService } from './sqlite.service';
import { DbnameVersionService } from './dbname-version.service';
import { PedidoUpgradeStatements } from '../upgrades/pedido.upgrade.statements';
import { Pedido } from '../models/pedido';
import { BehaviorSubject, Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  public userList: BehaviorSubject<Pedido[]> =
    new BehaviorSubject<Pedido[]>([]);
  private databaseName: string = "";
  private pedidoStatement: PedidoUpgradeStatements = new PedidoUpgradeStatements();
  private versionUpgrades;
  private loadToVersion;
  private db!: SQLiteDBConnection;
  private isPedidoReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private isWeb: boolean;

  constructor(private sqliteService: SQLiteService,
    private dbVerService: DbnameVersionService) {

    this.versionUpgrades = this.pedidoStatement.pedidoUpgrades;
    this.loadToVersion = this.versionUpgrades[this.versionUpgrades.length - 1].toVersion;

    const platform = Capacitor.getPlatform();

    if (platform === "web") this.isWeb = true;
    else this.isWeb = false;

  }
  public getIsWeb(): boolean {
    return this.isWeb;
  }
  async initializeDatabase(dbName: string) {
    this.databaseName = dbName;
    // create upgrade statements
    await this.sqliteService
      .addUpgradeStatement({
        database: this.databaseName,
        upgrade: this.versionUpgrades
      });
    // create and/or open the database
    this.db = await this.sqliteService.openDatabase(this.databaseName,
      false,
      'no-encryption',
      this.loadToVersion,
      false
    );
    this.dbVerService.set(this.databaseName, this.loadToVersion);

    await this.getUsers();
  }
  userState() {
    return this.isPedidoReady.asObservable();
  }
  fetchUsers(): Observable<Pedido[]> {
    return this.userList.asObservable();
  }

  private async loadUsers() {
    const users: Pedido[] = (await this.db.query('SELECT * FROM pedidos;')).values as Pedido[];
    this.userList.next(users);
  }
  private async getUsers() {
    await this.loadUsers();
    this.isPedidoReady.next(true);
  }
  async addUser(pedido: Pedido) {
    const sql = `INSERT INTO pedidos
    (bar_code,name_cli,tel_cli,device_name,prob_texto,
    prob_audio,img_1,img_2,estatus,created,updated)
    VALUES (?,?,?,?,?,?,?,?,?,?,?);`;
    if (this.isWeb) {
      const img1Key = pedido.bar_code + "_1";
      await this.saveWebLocalStore(img1Key, pedido.img_1);
      pedido.img_1 = img1Key;

      if (pedido.img_2) {
        const img2Key = pedido.bar_code + "_2";
        await this.saveWebLocalStore(img2Key, pedido.img_2);
        pedido.img_2 = img2Key;
      }

      if (pedido.prob_audio) {
        const audioKey = pedido.bar_code + "_audio";
        await this.saveWebLocalStore(audioKey, pedido.prob_audio);
        pedido.prob_audio = audioKey;
      }
    }
    else { // Si es nativo
      pedido.img_1 = await this.saveNativeImage(pedido.img_1);
      if (pedido.img_2 !== '')
        pedido.img_2 = await this.saveNativeImage(pedido.img_2);

      if (pedido.prob_audio !== '')
        pedido.prob_audio = await this.saveNativeImage(pedido.prob_audio);
    }
    await this.db.run(sql, [pedido.bar_code, pedido.name_cli, pedido.tel_cli,
    pedido.device_name, pedido.prob_texto, pedido.prob_audio,
    pedido.img_1, pedido.img_2, pedido.estatus,
    pedido.created, pedido.updated]);
    await this.getUsers();
  }

  async updateUserById(id: string, active: string) {
    const sql = `UPDATE users SET active=${active} WHERE id=${id}`;
    await this.db.run(sql);
    await this.getUsers();
  }
  async deleteUserById(id: string) {
    const sql = `DELETE FROM pedidos WHERE bar_code='${id}'`;
    await this.db.run(sql);
    await this.getUsers();
  }

  private async saveWebLocalStore(name: string, imgBlob: Blob | string) {
    let base64: string;
    if (imgBlob instanceof Blob) {
      base64 = await this.blobToBase64(imgBlob);
    } else {
      base64 = imgBlob;
    }
    localStorage.setItem(name, base64);
  }


  private async saveNativeImage(imgBlob: Blob | string): Promise<string> {
    const nameUnique = Date.now().toString();

    let base64Data: string;

    if (imgBlob instanceof Blob) {
      base64Data = await this.blobToBase64(imgBlob);
    } else {
      base64Data = imgBlob;
    }

    await Filesystem.writeFile({
      path: nameUnique,
      data: base64Data,
      directory: Directory.Data
    });

    return nameUnique;
  }

  // 🔹 Convertir Blob → base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]); // quitamos "data:image/jpeg;base64,"
      };
      reader.readAsDataURL(blob);
    });
  }
}
