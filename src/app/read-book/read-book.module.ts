import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReadBookPageRoutingModule } from './read-book-routing.module';

import { ReadBookPage } from './read-book.page';
import { TruncatePipe } from '../shared/pipes/truncate.pipe';
import { SubscriptionModalComponent } from './subscription-modal.component';

@NgModule({
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    IonicModule, 
    ReadBookPageRoutingModule,
    TruncatePipe,
  ],
  declarations: [
    ReadBookPage,
    SubscriptionModalComponent
  ]
})
export class ReadBookPageModule {}
