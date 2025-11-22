import { ICliente } from "./Interfaces/ICliente";

export class Cliente implements ICliente {

  id: number;
  nombre: string;
  telefono: string;

  constructor(id: number, nombre: string, telefono: string) {
    this.id = id;
    this.nombre = nombre;
    this.telefono = telefono;
  }

}
