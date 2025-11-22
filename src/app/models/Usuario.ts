import { IUsuario } from "./Interfaces/IUsuario";

export class Usuario implements IUsuario {

  id: number;
  name: string;
  username: string;
  password: string;

  constructor(id: number, name: string, username: string, password: string) {
    this.id = id;
    this.name = name;
    this.username = username;
    this.password = password;
  }

}
