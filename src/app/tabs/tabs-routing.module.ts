import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('../dashboard/dashboard.module').then(m => m.DashboardPageModule),
      },
      {
        path: 'search',
        loadChildren: () =>
          import('../see-all-books/see-all-books.module').then(m => m.SeeAllBooksPageModule),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('../profile/profile.module').then(m => m.ProfilePageModule),
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full',
      }
    ]
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
