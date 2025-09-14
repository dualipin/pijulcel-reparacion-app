import { Injectable } from '@angular/core';

interface AlertMessage {
  header: string;
  message: string;
  buttons: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  private isAlertOpen = false;

  public msg: AlertMessage = { header: '', message: '', buttons: [] };

  constructor() { }

  public setOpen(isAlertOpen: boolean) {
    this.isAlertOpen = isAlertOpen;
  }

  public get header(): string {
    return this.msg.header;
  }
  public get message(): string {
    return this.msg.message;
  }
  public get buttons(): string[] {
    return this.msg.buttons;
  }

  public isAlertOpenStatus(): boolean {
    return this.isAlertOpen;
  }

  public setAlertStatus(status: boolean) {
    this.isAlertOpen = status;
  }

  public showScreenAlert(header: string, message: string, buttons: string[] = ['Aceptar']) {
    this.msg = { header, message, buttons };
    this.setOpen(true);
  }

}
