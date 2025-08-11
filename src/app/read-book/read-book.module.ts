import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReadBookPageRoutingModule } from './read-book-routing.module';

import { ReadBookPage } from './read-book.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReadBookPageRoutingModule
  ],
  declarations: [ReadBookPage]
})
export class ReadBookPageModule {}
