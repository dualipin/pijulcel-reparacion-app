import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private urlApi: string = environment.apiUrl + '/auth';
  public token: string | null = null;

  constructor(private http: HttpClient, private storage: StorageService) {
    this.init();
  }

  async init() {
    this.token = await this.storage.getItemStorage('token');
    console.log('Token en Service:', this.token);
  }

  public login(body: any): Observable<any> {
    return this.http.post(`${this.urlApi}/login`, body);
  }

  public testAPI(): Observable<any> {
    return this.http.get(this.urlApi + '/test');
  }

  public getHeader(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });
  }

}
