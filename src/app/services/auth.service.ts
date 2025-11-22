import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private urlApi: string = environment.apiUrl + '/auth';
  private token: string = '';

  constructor(private http: HttpClient) { }

  public login(body: any): Observable<any> {
    return this.http.post(`${this.urlApi}/login`, body);
  }

  public testAPI(): Observable<any> {
    return this.http.get(this.urlApi + '/test');
  }

  public setToken(token: string): void {
    this.token = token;
  }
  public getToken(): string {
    return this.token;
  }

  public getHeader(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });
  }

}
