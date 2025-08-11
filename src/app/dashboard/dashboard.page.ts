import { Component, OnInit } from '@angular/core';
import { BookService } from '../services/book.service';
import { TokenService } from '../services/token.service';
import { ReadingProgressResponseDto } from '../Model/ApiResponse';
import {
  ApiResponse,
  BookResponse,
  GenreResponseWithBooks,
} from '../Model/ApiResponse';
import { catchError, forkJoin, of } from 'rxjs';
import { LoadingController, NavController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit {
  loggedInUserName = localStorage.getItem('fullName');
  genres: GenreResponseWithBooks[] = [];
  popularBooks: BookResponse[] = [];
  allBooks: BookResponse[] = [];
  continueReading: ReadingProgressResponseDto  | null = null;
  isLoading = false;
  recentBooks: BookResponse[] = [];
  userId: string | null = null;


  constructor(
    private bookService: BookService,
    private nav: NavController,
  ) {}

  searchQuery = '';
  filteredBooks: BookResponse[] = [];
  showSearchResults = false;
  notificationCount = 3;
  showNotifications = false;
  notifications = [
    {
      id: 1,
      title: 'New Book Added',
      message: 'Atomic Habits is now available in your library',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      title: 'Reading Goal',
      message: 'You\'re 2 books away from your monthly goal!',
      time: '1 day ago',
      read: false,
    },
    {
      id: 3,
      title: 'Book Recommendation',
      message: 'Based on your reading history, you might like "Deep Work"',
      time: '3 days ago',
      read: true,
    },
  ];

  onSearch(event: any) {
    const val = event.target.value.toLowerCase();
    this.searchQuery = val;

    if (val.trim() === '') {
      this.showSearchResults = false;
      this.filteredBooks = [];
      return;
    }

    this.filteredBooks = this.allBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(val) ||
        book.author.toLowerCase().includes(val)
    );
    this.showSearchResults = true;
  }

  clearSearch() {
    this.searchQuery = '';
    this.showSearchResults = false;
    this.filteredBooks = [];
  }

  openSearch() {
    this.nav.navigateRoot(['/search']);
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markNotificationAsRead(notificationId: number) {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.updateNotificationCount();
    }
  }

  updateNotificationCount() {
    this.notificationCount = this.notifications.filter((n) => !n.read).length;
  }

  showFilters = false;
  selectedGenres: string[] = [];
  availableGenres: string[] = [];
  sortBy = 'title';

  openFilters() {
    this.showFilters = true;
  }

  closeFilters() {
    this.showFilters = false;
  }

  toggleGenreFilter(genre: string) {
    const index = this.selectedGenres.indexOf(genre);
    if (index > -1) {
      this.selectedGenres.splice(index, 1);
    } else {
      this.selectedGenres.push(genre);
    }
    this.applyFilters();
  }

  setSortBy(sortOption: string) {
    this.sortBy = sortOption;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.allBooks];

    // Apply search query
    if (this.searchQuery.trim()) {
      filtered = filtered.filter((book) =>
        book.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Apply genre filters
    if (this.selectedGenres.length > 0) {
      filtered = filtered.filter((book) =>
        book.genres && book.genres.some((genre) => this.selectedGenres.includes(genre.name))
      );
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'author':
        filtered.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    this.filteredBooks = filtered;
  }

  clearFilters() {
    this.selectedGenres = [];
    this.sortBy = 'title';
    this.applyFilters();
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

    const hash = Array.from(title).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  }

  fetchData(): void {
    this.isLoading = true;
  
    forkJoin({
      popularBooks: this.bookService.getPopularBooks()
        .pipe(catchError(() => of({ data: [] }))),
      genres: this.bookService.getAllGenres()
        .pipe(catchError(() => of({ data: [] }))),
      recentBooks: this.bookService.getRecentlyAddedBooks()
        .pipe(catchError(() => of({ data: [] }))),
      allBooks: this.bookService.getAllBooks()
        .pipe(catchError(() => of({ data: [] }))),
      continueReading: this.bookService.getLastReadBook(TokenService.getUserId() ?? "")
        .pipe(catchError(() => of({ data: null })))
    }).subscribe({
      next: ({ popularBooks, genres, recentBooks, allBooks, continueReading }) => {
        this.popularBooks = popularBooks.data.slice(0, 10);
        this.genres = genres.data;
        this.availableGenres = [...this.genres].map((genre) => genre.name);
        this.recentBooks = recentBooks.data;
        this.allBooks = allBooks.data;
        this.continueReading = continueReading.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading data', error);
        this.isLoading = false;
      }
    });
  }

  ngOnInit(): void {
    this.userId = TokenService.getUserId();
    this.fetchData();
  }

  loadContinueReading() {
    if (!this.userId) {
      console.warn('No user ID found for continue reading');
      return;
    }
  }

  navigateToBook(bookId: string) {
    this.nav.navigateRoot(['/book-detail', bookId]);
  }

  navigateToReadBook(bookId: string | number) {
    const id = typeof bookId === 'number' ? bookId.toString() : bookId;
    this.nav.navigateForward(['/read-book', id]);
  }



  seeAllBooks() {
    this.nav.navigateForward(['/see-all-books']);
  }

  openBook(book: any) {
    const id = (book?.id ?? '').toString();
    this.nav.navigateForward(['/book-detail', id]);
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      this.fetchData();
      event.target.complete();
    }, 1500);
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
