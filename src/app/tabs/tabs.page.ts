import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { NavController, Platform } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone:false
})
export class TabsPage implements OnInit {

  constructor(private platform:Platform,private router:Router,
    private nav:NavController
  ) { }

  ngOnInit() {
    if (this.platform.is('capacitor')) {
      // Global hardware back button handler with higher priority
      this.platform.backButton.subscribeWithPriority(5, () => {
        const currentUrl = this.router.url;
        console.log('Hardware back pressed, current URL:', currentUrl);
        
        // Handle specific navigation flows
        if (currentUrl.includes('/book-detail/')) {
          // From book details, go back to see-all-books or dashboard
          this.nav.back();
        } else if (currentUrl === '/see-all-books') {
          // From see-all-books, go back to dashboard
          this.router.navigate(['/tabs/dashboard']);
        } else if (currentUrl === '/tabs/dashboard') {
          // From dashboard, exit app
          App.exitApp(); 
        } else {
          // Default: try to go back, fallback to dashboard
          this.nav.back();
        }
      });
    }
  }

}
