import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavController, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';

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
        // Enable fullscreen mode with status bar overlay for immersive experience
        StatusBar.setOverlaysWebView({ overlay: true });
        StatusBar.setStyle({ style: Style.Light });
        StatusBar.setBackgroundColor({ color: 'transparent' });
        
        // Set status bar height for proper content spacing
        const statusBarHeight = this.platform.is('ios') ? '44px' : '24px';
        document.documentElement.style.setProperty('--actual-status-bar-height', statusBarHeight);
        
        // Add safe area padding for fullscreen layout
        document.documentElement.style.setProperty('--ion-safe-area-top', statusBarHeight);
      } else {
        // For web/browser, set status bar height to 0
        document.documentElement.style.setProperty('--actual-status-bar-height', '0px');
        document.documentElement.style.setProperty('--ion-safe-area-top', '0px');
      }
    });
  }

  constructor(private authService:AuthService,
    private platform: Platform,
    private nav:NavController,
    private router:Router) {
        this.initializeApp();
    }

    async ngOnInit() {
      this.initializeApp();
    
      // Check login status using AuthService or localStorage
      const isLoggedIn = this.authService.isLoggedIn(); // should internally check localStorage or token
    
      if (this.platform.is('capacitor')) {
        this.platform.backButton.subscribeWithPriority(10, () => {
          const currentUrl = this.router.url;
    
          if (currentUrl === '/tabs/dashboard') {
            App.exitApp(); // Exit app if already on dashboard
          } else {
            window.history.length > 1 ? this.nav.back() : this.nav.navigateRoot('/tabs/dashboard');
          }
        });
      }
    
      if (isLoggedIn) {
        if (this.router.url === '/' || this.router.url === '/login') {
          this.nav.navigateRoot(['/tabs/dashboard']);
        }
      } else {
        this.nav.navigateRoot(['/login']);
      }
    }
}
