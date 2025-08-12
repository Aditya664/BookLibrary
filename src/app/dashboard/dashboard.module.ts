import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { DashboardPage } from './dashboard.page';
import { LoaderComponent } from '../shared/components/loader/loader.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    LoaderComponent
  ],
  declarations: [
    DashboardPage,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [LoaderComponent]
})
export class DashboardPageModule {}
