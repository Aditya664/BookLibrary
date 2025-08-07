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
 
  
  initializeApp() {
    this.platform.ready().then(() => {
      if (this.platform.is('capacitor')) {
        StatusBar.setOverlaysWebView({ overlay: true });
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#ffffff' });
      }
    });
  }

  constructor(private authService:AuthService,
    private platform: Platform,
    private router:Router) {
        this.initializeApp();
    }

    ngOnInit() {
      this.initializeApp();
        if (this.authService.isLoggedIn()) {
          this.router.navigate(['/tabs/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
    }
  
    
}
