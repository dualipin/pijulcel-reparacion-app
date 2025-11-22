import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  // web, ios, android
  private platform: string = Capacitor.getPlatform();
  private token: string;

  constructor() {
    this.token = "";
  }

  public setToken(token: string) {
    this.token = token;
  }

  public getToken(): string {
    return this.token;
  }

  /**
   * Saves a key-value pair to storage based on the current platform.
   *
   * - On web platforms, uses `localStorage`.
   * - On iOS and Android platforms, uses Capacitor's `Preferences` API.
   *
   * @param name - The key under which the item will be stored.
   * @param item - The value to store.
   * @returns A promise that resolves when the item has been saved (for native platforms), or immediately for web.
   */
  public async saveItemStorage(name: string, item: string) {

    if (this.platform === "web")
      localStorage.setItem(name, item);
    else if (this.platform === "ios" || this.platform === "android")
      await Preferences.set({ key: name, value: item });

    console.log(`Item saved: ${name} = ${item} on platform ${this.platform}`);

  }

  /**
   * Retrieves a stored item by its name from the appropriate storage mechanism
   * based on the current platform.
   *
   * - On web platforms, it fetches the item from `localStorage`.
   * - On iOS and Android platforms, it fetches the item using Capacitor's `Preferences` API.
   *
   * @param name - The key/name of the item to retrieve from storage.
   * @returns A promise that resolves to the stored string value, or an empty string if not found.
   */
  public async getItemStorage(name: string): Promise<string> {

    if (this.platform === "web") {
      const token = localStorage.getItem(name);
      if (token)
        return token;
    }
    else if (this.platform === "ios" || this.platform === "android") {
      const { value } = await Preferences.get({ key: name });
      if (value)
        return value;
    }
    return "";
  }

  removeItemStorage(name: string) {

    if (this.platform === "web")
      localStorage.removeItem(name);

    else if (this.platform === "ios" || this.platform === "android")
      Preferences.remove({ key: name });

  }


}
