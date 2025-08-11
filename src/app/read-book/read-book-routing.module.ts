import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReadBookPage } from './read-book.page';

const routes: Routes = [
  {
    path: '',
    component: ReadBookPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReadBookPageRoutingModule {}
