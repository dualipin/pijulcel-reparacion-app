import { IDispositivo } from './Interfaces/IDispositivo';

export class Dispositivo implements IDispositivo {
  id: number;
  nombre: string;

  constructor(id: number, nombre: string) {
    this.id = id;
    this.nombre = nombre;
  }
}
