import { IDispositivo } from './Interfaces/IDispositivo';

export class Dispositivo implements IDispositivo {
  id: number;
  nombre: string;
  color?: string;

  constructor(id: number, nombre: string, color?: string) {
    this.id = id;
    this.nombre = nombre;
    this.color = color;
  }
}
