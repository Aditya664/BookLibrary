
import { jwtDecode } from 'jwt-decode';
export interface JwtPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string | string[];
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
  exp: number;
}

export class TokenService {
  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  static getRole(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const roleClaim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      return typeof roleClaim === 'string' ? roleClaim : Array.isArray(roleClaim) ? roleClaim[0] : null;    } catch (e) {
      console.error('Invalid token');
      return null;
    }
  }

  static getFullName(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log(decoded)
      return  decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
    } catch (e) {
      console.error('Invalid token');
      return null;
    }
  }

  static isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  static isUser(): boolean {
    return this.getRole() === 'User';
  }

  static getUserId(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      return userId ? userId: null;
    } catch (e) {
      console.error('Invalid token');
      return null;
    }
  }

  static getUserInfo(): { name: string; email: string } | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return {
        name: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || '',
        email: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || ''
      };
    } catch (e) {
      console.error('Invalid token');
      return null;
    }
  }

  static clearToken(): void {
    localStorage.removeItem('auth_token');
  }
}
