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
      debugger
      this.platform.backButton.subscribeWithPriority(10, () => {
        const currentUrl = this.router.url;
        if (currentUrl === '/tabs/dashboard') {
          App.exitApp(); 
        } else {
          window.history.length > 1 ? this.nav.back() : this.router.navigate(['/tabs/dashboard']);
        }
      });
    }
  }

}
