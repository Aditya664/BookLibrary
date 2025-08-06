import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent  implements OnInit{
  constructor(private authService:AuthService,
    private platform: Platform,
    private router:Router) {}

    ngOnInit() {
      this.platform.ready().then(() => {
        this.setStatusBarTheme();
  
        if (this.authService.isLoggedIn()) {
          this.router.navigate(['/tabs/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
      });
    }
  
    async setStatusBarTheme() {
      try {
        await StatusBar.setStyle({ style: Style.Dark });  // Dark icons (good for light background)
        await StatusBar.setBackgroundColor({ color: '#ffffff' });  // White background
      } catch (error) {
        console.warn('Status bar plugin not available or failed:', error);
      }
    }
}
