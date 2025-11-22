import { ICliente } from "./ICliente";
import { IDispositivo } from "./IDispositivo";

export interface IPedido {
  barCode: string;
  cliente: ICliente;
  dispositivo: IDispositivo;
  descrip: string | null;
  audio: string | null;
  img1: string | null;
  img2: string | null;
  estatus: string;
  created: string | Date;
  updated: string | Date;

}
