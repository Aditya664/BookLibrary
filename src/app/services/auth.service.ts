import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiResponse, LoginResponse } from '../Model/ApiResponse';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl ="http://freeelib.runasp.net";
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient, private router: Router) { }

  register(registerData: any):Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/api/User/Register`, {
      ...registerData,
      roles: ['User'] // Set default role
    });
  }

  login(loginData: any):Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/api/User/Login`, loginData)
      .pipe(
        tap(response => {
          if (response && response.data.jwtToken) {
            this.setToken(response.data.jwtToken);
            return true; // Indicate successful login
          } else {
            return false; // Indicate login failure
          }
        })
      );
  }

  logout() {
    this.removeToken();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
