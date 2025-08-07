import { Component, OnInit } from '@angular/core';
import { BookResponse, GenreResponseWithBooks } from '../Model/ApiResponse';
import { forkJoin } from 'rxjs';
import { BookService } from '../services/book.service';
import { NavController, Platform } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-see-all-books',
  templateUrl: './see-all-books.page.html',
  styleUrls: ['./see-all-books.page.scss'],
  standalone: false,
})
export class SeeAllBooksPage implements OnInit {
  isLoading = false;

  searchQuery = '';
  allBooks: BookResponse[] = [];
  filteredBooks: BookResponse[] = [];
  genres: GenreResponseWithBooks[] = [];
  selectedGenre = 'All';

  filterBooksByCategory() {
    debugger;
    if (this.selectedGenre === 'All') {
      this.filteredBooks = [...this.allBooks];
    } else {
      this.filteredBooks = this.allBooks.filter((book) =>
        book.genres?.some((genre) => genre.name === this.selectedGenre)
      );
    }
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      this.fetchData();
      event.target.complete();
    }, 1500);
  }
  getInitials(title: string): string {
    if (!title) return '';
    return title
      .split(' ')
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  getGradientClass(title: string): string {
    const gradients = [
      'gradient-red',
      'gradient-blue',
      'gradient-purple',
      'gradient-green',
      'gradient-orange',
      'gradient-teal',
      'gradient-pink',
    ];

    const hash = Array.from(title).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );
    return gradients[hash % gradients.length];
  }

  onSearch(event: any) {
    const val = event.target.value?.toLowerCase() || '';

    if (val.trim()) {
      this.filteredBooks = this.allBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(val) ||
          book.author.toLowerCase().includes(val)
      );
    } else {
      this.filteredBooks = [];
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  constructor(
    private bookService: BookService,
    private navCtrl: NavController,
    private platform: Platform,
    private router: Router
  ) {}

  openBook(book: any) {
    debugger;
    this.router.navigate(['/book-detail', book.id]);
  }

  fetchData(): void {
    this.isLoading = true;

    forkJoin({
      allBooks: this.bookService.getAllBooks(),
      genres: this.bookService.getAllGenres(),
    }).subscribe({
      next: ({ allBooks, genres }) => {
        this.allBooks = allBooks.data;
        this.genres = [
          {
            id: -1,
            name: 'All',
            iconName: 'all',
            books: {id:1,bookName:"null"},
          },
          ...genres.data,
        ];

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading data', error);
        this.isLoading = false;
      },
    });
  }

  ngOnInit(): void {
    if (this.platform.is('capacitor')) {
      this.platform.backButton.subscribeWithPriority(10, () => {
        const canGoBack = window.history.length > 1;
        if (canGoBack) {
          this.goBack();
        } else {
          App.exitApp();
        }
      });
    }
    this.fetchData();
  }
}
