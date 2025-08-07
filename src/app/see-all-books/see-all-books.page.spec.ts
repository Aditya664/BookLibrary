import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeeAllBooksPage } from './see-all-books.page';

describe('SeeAllBooksPage', () => {
  let component: SeeAllBooksPage;
  let fixture: ComponentFixture<SeeAllBooksPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SeeAllBooksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
