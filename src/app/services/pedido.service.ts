import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { IPedido } from '../models/Interfaces/IPedido';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  pedidos: IPedido[] = [];

  private urlApi: string = environment.apiUrl + '/pedidos';

  constructor(private http: HttpClient, private authServ: AuthService) {
    }

  public register(body: any): Observable<any> {
    // Usamos fetch nativo en lugar de HttpClient para evitar el bug de XHR
    // en Android WebView que hace que la carga de Blobs grandes se congele.
    return new Observable(observer => {
      const token = this.authServ.token;
      fetch(this.urlApi, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: body
      })
      .then(async response => {
        if (!response.ok) {
          const text = await response.text();
          throw { status: response.status, message: text || response.statusText };
        }
        return response.json();
      })
      .then(data => {
        observer.next(data);
        observer.complete();
      })
      .catch(err => {
        observer.error(err);
      });
    });
  }

  public getAll(): Observable<any> {
    return this.http.get(`${this.urlApi}`, { headers: this.authServ.getHeader() });
  }

  public getById(id: string): Observable<any> {
    return this.http.get(`${this.urlApi}/${id}`, { headers: this.authServ.getHeader() });
  }

  public updateStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.urlApi}/update-estatus/${id}/${status}`, {}, { headers: this.authServ.getHeader() });
  }

  public delete(id: string): Observable<any> {
    return this.http.delete(`${this.urlApi}/${id}`, { headers: this.authServ.getHeader() });
  }

}
