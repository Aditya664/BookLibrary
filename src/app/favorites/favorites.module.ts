import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FavoritesPage } from './favorites.page';
import { FavoritesRoutingModule } from './favorites-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FavoritesRoutingModule,
  ],
  declarations: [FavoritesPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FavoritesModule {}
