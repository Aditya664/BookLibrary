import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SeeAllBooksPageRoutingModule } from './see-all-books-routing.module';

import { SeeAllBooksPage } from './see-all-books.page';
import { LoaderComponent } from '../shared/components/loader/loader.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SeeAllBooksPageRoutingModule,
    LoaderComponent
  ],
  exports:[SeeAllBooksPage],
  declarations: [SeeAllBooksPage]
})
export class SeeAllBooksPageModule {}
