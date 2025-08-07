import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SeeAllBooksPage } from './see-all-books.page';

const routes: Routes = [
  {
    path: '',
    component: SeeAllBooksPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SeeAllBooksPageRoutingModule {}
