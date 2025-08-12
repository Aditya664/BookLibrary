import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BookDetailsPageRoutingModule } from './book-details-routing.module';

import { BookDetailsPage } from './book-details.page';
import { LoaderComponent } from '../shared/components/loader/loader.component';
import { TruncatePipe } from '../shared/pipes/truncate.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BookDetailsPageRoutingModule,
    LoaderComponent,
    TruncatePipe
  ],
  declarations: [BookDetailsPage],
  exports: [],
})
export class BookDetailsPageModule {}
