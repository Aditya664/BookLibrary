import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReadBookPage } from './read-book.page';

describe('ReadBookPage', () => {
  let component: ReadBookPage;
  let fixture: ComponentFixture<ReadBookPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadBookPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
