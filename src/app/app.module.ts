import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';


@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule,HttpClientModule, IonicModule.forRoot({
    scrollAssist: true,      
    scrollPadding: false,      
    inputBlurring: false,      
  }), AppRoutingModule,ReactiveFormsModule ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },AuthService,TokenService],
  bootstrap: [AppComponent],
})
export class AppModule {}
