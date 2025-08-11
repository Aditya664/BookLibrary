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
  
  // New properties for enhanced UI
  viewMode: 'grid' | 'list' = 'grid';
  showFilters = false;
  selectedGenres: string[] = [];
  sortBy: 'title' | 'rating' | 'author' | 'recent' = 'title';
  bookmarkedBooks: Set<number> = new Set();

  filterBooksByCategory() {
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

  getStarsArray(rating: number = 0): string[] {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const totalStars = 5;
  
    const starsArray: string[] = [];
  
    for (let i = 0; i < fullStars; i++) {
      starsArray.push('star'); // full star
    }
  
    if (halfStar) {
      starsArray.push('star-half'); // half star
    }
  
    while (starsArray.length < totalStars) {
      starsArray.push('star-outline'); // empty star
    }
  
    return starsArray;
  }
  

  
  onSearch(event: any) {
    const val = event.target.value?.toLowerCase() || '';
    this.selectedGenre = 'All';
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
    this.navCtrl.navigateRoot(['/book-detail', book.id]);
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

  // New methods for enhanced UI functionality
  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  get activeFiltersCount(): number {
    return this.selectedGenres.length + (this.sortBy !== 'title' ? 1 : 0);
  }

  clearAllFilters() {
    this.selectedGenres = [];
    this.sortBy = 'title';
    this.showFilters = false;
    this.applyFilters();
  }

  toggleGenre(genreName: string) {
    const index = this.selectedGenres.indexOf(genreName);
    if (index > -1) {
      this.selectedGenres.splice(index, 1);
    } else {
      this.selectedGenres.push(genreName);
    }
    this.applyFilters();
  }

  setSortBy(sortOption: 'title' | 'rating' | 'author' | 'recent') {
    this.sortBy = sortOption;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.allBooks];

    // Apply search query
    if (this.searchQuery.trim()) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Apply genre filters
    if (this.selectedGenres.length > 0) {
      filtered = filtered.filter(book =>
        book.genres && book.genres.some(genre => 
          this.selectedGenres.includes(genre.name)
        )
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

  trackByBookId(index: number, book: BookResponse): number {
    return book.id;
  }

  toggleBookmark(book: BookResponse, event: Event) {
    event.stopPropagation();
    if (this.bookmarkedBooks.has(book.id)) {
      this.bookmarkedBooks.delete(book.id);
    } else {
      this.bookmarkedBooks.add(book.id);
    }
  }

  isBookmarked(book: BookResponse): boolean {
    return this.bookmarkedBooks.has(book.id);
  }

  shareBook(book: BookResponse, event: Event) {
    event.stopPropagation();
    // Simple share functionality without external APIs
    if (navigator.share) {
      navigator.share({
        title: book.title,
        text: `Check out "${book.title}" by ${book.author}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      const shareText = `Check out "${book.title}" by ${book.author}`;
      navigator.clipboard.writeText(shareText).then(() => {
        // Could show a toast here
        console.log('Book info copied to clipboard');
      });
    }
  }

  ngOnInit(): void {
    // Hardware back button is now handled globally in tabs.page.ts
    this.fetchData();
  }
}
