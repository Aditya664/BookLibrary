import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

interface Book {
  id?: string | number;
  title?: string;
  author?: string;
  image?: string;
  genres?: Array<{ name: string }>;
  averageRating?: number;
  rating?: number; // Added for backward compatibility
  createdAt?: string;
  // Add other book properties as needed
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit {
  // Search and filter properties
  searchQuery = '';
  filteredBooks: BookResponse[] = [];
  showSearchResults = false;
  showFilters = false;
  availableGenres: string[] = [];
  selectedGenres: string[] = [];
  sortBy: 'title' | 'author' | 'rating' | 'recent' = 'recent';

  // Data properties
  popularBooks: BookResponse[] = [];
  genres: GenreResponseWithBooks[] = [];
  recentBooks: BookResponse[] = [];
  allBooks: BookResponse[] = [];
  continueReading: ReadingProgressResponseDto | null = null;
  completedBooks: ReadingProgressResponseDto[] = [];
  isLoading = false;
  loggedInUserName = localStorage.getItem('fullName');
  userId: string | null = null;
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

  constructor(
    private bookService: BookService,
    private nav: NavController,
    private router: Router,
  ) {}


  onSearch(event: any) {
    const val = event.detail?.value ? event.detail.value.toString().toLowerCase().trim() : '';
    this.searchQuery = val;
    this.applyFilters();
  }

  private applySearch() {
    if (!this.searchQuery.trim()) {
      this.showSearchResults = false;
      this.filteredBooks = [];
      return;
    }

    if (!this.allBooks?.length) {
      console.warn('No books available for search');
      this.showSearchResults = true;
      this.filteredBooks = [];
      return;
    }

    const searchLower = this.searchQuery.toLowerCase();
    this.filteredBooks = this.allBooks.filter(book => {
      const titleMatch = book.title?.toLowerCase().includes(searchLower) || false;
      const authorMatch = book.author?.toLowerCase().includes(searchLower) || false;
      const genreMatch = book.genres?.some(genre =>
        genre?.name?.toLowerCase().includes(searchLower)
      ) || false;
      return titleMatch || authorMatch || genreMatch;
    });

    this.showSearchResults = true;
  }

  clearSearch() {
    console.log('Clearing search');
    this.searchQuery = '';
    this.showSearchResults = false;
    this.filteredBooks = [];
  }

  getInitials(title?: string): string {
    if (!title) return '';
    return title
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getGradientForBook(title: string): string {
      const gradients = [
        'gradient-1', // Blue to Purple
        'gradient-2', // Green to Cyan
        'gradient-3', // Orange to Red
        'gradient-4', // Pink to Purple
        'gradient-5', // Teal to Blue
        'gradient-6'  // Yellow to Orange
      ];
  
      // Create a consistent hash from the title
      const hash = Array.from(title).reduce(
        (acc, char) => acc + char.charCodeAt(0),
        0
      );
      
      return gradients[hash % gradients.length];
  }

  getGradientClass(title: string): string {
    return this.getGradientForBook(title);
  }

  openBook(book: any) {
    this.nav.navigateForward(['/book-detail', book.id]);
  }

  getGenreIcon(genreName: string): string {
    const iconMap: { [key: string]: string } = {
      'Fiction': 'book-outline',
      'Non-Fiction': 'library-outline',
      'Science': 'flask-outline',
      'Technology': 'laptop-outline',
      'History': 'time-outline',
      'Biography': 'person-outline',
      'Romance': 'heart-outline',
      'Mystery': 'search-outline',
      'Fantasy': 'planet-outline',
      'Horror': 'skull-outline'
    };
    return iconMap[genreName] || 'book-outline';
  }

  navigateToGenre(genreName: string, language?: string) {
    const queryParams: any = { genre: genreName };
    if (language) {
      queryParams.language = language;
    }
    this.router.navigate(['/see-all-books'], { queryParams });
  }

  navigateToBook(bookId?: string) {
    this.nav.navigateForward(['/book-detail', bookId]);
  }

  navigateToReadBook(bookId?: string, page?: number) {
    debugger
    this.nav.navigateForward(['/read-book', bookId]);
  }

  seeAllBooks(language?: string) {
    const queryParams: any = {};
    if (language) {
      queryParams.language = language;
    }
    this.router.navigate(['/see-all-books'], { queryParams });
  }

  openReadingSchedule() {
    console.log('Opening reading schedule...');
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      this.fetchData();
      event.target.complete();
    }, 1500);
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

 

  openFilters() {
    // Initialize available genres if not already set
    if (this.availableGenres.length === 0 && this.allBooks?.length) {
      const allGenres = new Set<string>();
      this.allBooks.forEach(book => {
        book.genres?.forEach(genre => {
          if (genre?.name) {
            allGenres.add(genre.name);
          }
        });
      });
      this.availableGenres = Array.from(allGenres).sort();
    }
    this.showFilters = true;
  }

  closeFilters() {
    this.showFilters = false;
    this.applyFilters();
  }

  toggleGenreFilter(genre: string) {
    const index = this.selectedGenres.indexOf(genre);
    if (index > -1) {
      this.selectedGenres.splice(index, 1);
    } else {
      this.selectedGenres.push(genre);
    }
  }

  setSortBy(sortOption: 'title' | 'author' | 'rating' | 'recent') {
    this.sortBy = sortOption;
    this.applyFilters();
  }

  applyFilters() {
    if (this.searchQuery.trim()) {
      this.applySearch();
    } else if (this.selectedGenres.length > 0 || this.sortBy !== 'title') {
      this.filteredBooks = this.filterBooks();
      this.showSearchResults = true;
    } else {
      this.showSearchResults = false;
      this.filteredBooks = [];
    }
  }

  clearFilters() {
    this.selectedGenres = [];
    this.sortBy = 'title';
    this.searchQuery = '';
    this.showSearchResults = false;
    this.filteredBooks = [];
  }

  private filterBooks(): BookResponse[] {
    if (!this.allBooks?.length) return [];

    let filtered = [...this.allBooks];

    // Apply genre filters
    if (this.selectedGenres.length > 0) {
      filtered = filtered.filter(book =>
        book.genres?.some(genre =>
          genre?.name && this.selectedGenres.includes(genre.name)
        )
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'recent':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        default:
          return 0;
      }
    });

    return filtered;
  }

  fetchData(): void {
    this.isLoading = true;
    const userId = TokenService.getUserId();
    
    forkJoin({
      popularBooks: this.bookService.getPopularBooks().pipe(
        catchError((error) => {
          console.error('Error loading popular books:', error);
          return of({ data: [] as BookResponse[] });
        })
      ),
      completedBooks : this.bookService.getUserReadingProgress(this.userId ?? '').pipe(
        catchError((error) => {
          console.error('Error loading completed books:', error);
          return of({ data: [] as ReadingProgressResponseDto[] });
        })
      ),
      genres: this.bookService.getAllGenres().pipe(
        catchError((error) => {
          console.error('Error loading genres:', error);
          return of({ data: [] as GenreResponseWithBooks[] });
        })
      ),
      recentBooks: this.bookService.getRecentlyAddedBooks().pipe(
        catchError((error) => {
          console.error('Error loading recent books:', error);
          return of({ data: [] as BookResponse[] });
        })
      ),
      allBooks: this.bookService.getAllBooks().pipe(
        catchError((error) => {
          console.error('Error loading all books:', error);
          return of({ data: [] as BookResponse[] });
        })
      ),
      continueReading: userId ? this.bookService.getLastReadBook(userId).pipe(
        catchError((error) => {
          console.error('Error loading continue reading:', error);
          return of({ data: null });
        })
      ) : of({ data: null })
    }).subscribe({
      next: (responses) => {
        this.popularBooks = responses.popularBooks.data?.slice(0, 10) || [];
        this.genres = responses.genres.data || [];
        this.recentBooks = responses.recentBooks.data || [];
        this.allBooks = responses.allBooks.data || [];
        this.continueReading = responses.continueReading?.data || null;
        this.completedBooks = responses.completedBooks.data.filter(p => p.percentage >= 100) || [];
        this.isLoading = false;
        this.generateTopBooksByLanguage();
      },
      error: (error) => {
        console.error('Error in fetchData:', error);
        this.isLoading = false;
      }
    });
  }

  ngOnInit(): void {
    this.userId = TokenService.getUserId();
    this.fetchData();
  }

  topBooksByLanguage: { language: string; books: BookResponse[] }[] = [];

  generateTopBooksByLanguage() {
    const grouped: { [key: string]: any[] } = {};
    // Group books by language
    this.allBooks.forEach(book => {
      if (!grouped[book?.language ?? '']) grouped[book?.language ?? ''] = [];
      grouped[book?.language ?? ''].push(book);
    });
  
    // Sort each group by rating and take top 10
    this.topBooksByLanguage = Object.keys(grouped).map(lang => ({
      language: lang,
      books: grouped[lang]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10)
    }));
  }

}

