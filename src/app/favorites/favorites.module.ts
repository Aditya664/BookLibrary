import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule, ModalController } from '@ionic/angular';

import { FavoritesPage } from './favorites.page';
import { FavoritesRoutingModule } from './favorites-routing.module';
import { LoaderComponent } from '../shared/components/loader/loader.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FavoritesRoutingModule,
    LoaderComponent
  ],
  declarations: [
    FavoritesPage,
  ],
  providers: [
    ModalController
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FavoritesModule {}
