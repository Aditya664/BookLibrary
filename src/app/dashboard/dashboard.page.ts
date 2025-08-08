import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../services/book.service';
import {
  ApiResponse,
  BookResponse,
  GenreResponseWithBooks,
} from '../Model/ApiResponse';
import { forkJoin } from 'rxjs';
import { NavController, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';

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
  isLoading = false;
  recentBooks: BookResponse[] = [];
  continueReading!: BookResponse;
  featuredBooks: BookResponse[] = [
    {
      id: 1,
      image: 'assets/book.png',
      title: 'Atomic Habits',
      author: 'James Clear',
      rating: 4.8,
      description:
        'A practical guide to building good habits and breaking bad ones using proven frameworks.',
      genres: [],
      reviews: [],
      createdAt: '2023-08-07T12:00:00.000Z',
    },
    {
      id: 2,
      image: 'assets/book.png',
      title: 'Ikigai',
      author: 'Héctor García',
      rating: 4.5,
      description:
        'Explores the Japanese concept of purpose and how it can lead to a long, fulfilling life.',
      genres: [],
      reviews: [],
      createdAt: '2023-08-07T12:00:00.000Z',
    },
  ];

  searchQuery = '';
  allBooks: BookResponse[] = [];
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
      read: false
    },
    {
      id: 2,
      title: 'Reading Goal',
      message: 'You\'re 2 books away from your monthly goal!',
      time: '1 day ago',
      read: false
    },
    {
      id: 3,
      title: 'Book Recommendation',
      message: 'Based on your reading history, you might like "Deep Work"',
      time: '3 days ago',
      read: true
    }
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
    // Navigate to dedicated search page or expand search functionality
    this.router.navigate(['/search']);
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markNotificationAsRead(notificationId: number) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.updateNotificationCount();
    }
  }

  updateNotificationCount() {
    this.notificationCount = this.notifications.filter(n => !n.read).length;
  }

  showFilters = false;
  selectedGenres: string[] = [];
  availableGenres:string[] = []
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

    const hash = Array.from(title).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );
    return gradients[hash % gradients.length];
  }

  fetchData(): void {
    this.isLoading = true;

    forkJoin({
      popularBooks: this.bookService.getPopularBooks(),
      genres: this.bookService.getAllGenres(),
      recentBooks: this.bookService.getRecentlyAddedBooks(),
      allBooks: this.bookService.getAllBooks(),
    }).subscribe({
      next: ({ popularBooks, genres, recentBooks, allBooks }) => {
        this.popularBooks = popularBooks.data.slice(0, 10);
        this.genres = genres.data;
        this.availableGenres = [...this.genres].map((genre) => genre.name);  
        this.recentBooks = recentBooks.data;
        this.isLoading = false;
        this.continueReading = this.popularBooks[0];
        this.allBooks = allBooks.data;
      },
      error: (error) => {
        console.error('Error loading data', error);
        this.isLoading = false;
      },
    });
  }

  ngOnInit(): void {
    this.fetchData();
  }

  constructor(
    private router: Router,
    private bookService: BookService,
    private platform: Platform,
    private nav: NavController
  ) {}

  get firstName(): string {
    return this.loggedInUserName
      ? this.loggedInUserName.trim().split(' ')[0]
      : 'Reader';
  }



  languages = ['English', 'Hindi', 'Marathi', 'Tamil', 'Gujarati'];

  books = [
    {
      id: '1',
      image: 'assets/book.png',
      title: 'Atomic Habits',
      author: 'James Clear',
      rating: 4.8,
      description:
        'A practical guide to building good habits and breaking bad ones using proven frameworks.',
    },
    {
      id: '2',
      image: 'assets/book.png',
      title: 'Ikigai',
      author: 'Héctor García',
      rating: 4.5,
      description:
        'Explores the Japanese concept of purpose and how it can lead to a long, fulfilling life.',
    },
    {
      id: '3',
      image: 'assets/book.png',
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      rating: 4.7,
      description:
        'A mystical story about following your dreams and listening to your heart.',
    },
    {
      id: '4',
      image: 'assets/book.png',
      title: 'Deep Work',
      author: 'Cal Newport',
      rating: 4.6,
      description:
        'Teaches how to focus without distraction to produce high-quality work.',
    },
    {
      id: '5',
      image: 'assets/book.png',
      title: 'Think Again',
      author: 'Adam Grant',
      rating: 4.4,
      description:
        'Challenges us to question our assumptions and think more flexibly.',
    },
    {
      id: '6',
      image: 'assets/book.png',
      title: 'Rich Dad Poor Dad',
      author: 'R. Kiyosaki',
      rating: 4.6,
      description:
        'A personal finance classic comparing two contrasting financial mindsets.',
    },
    {
      id: '7',
      image: 'assets/book.png',
      title: '1984',
      author: 'George Orwell',
      rating: 4.9,
      description:
        'A dystopian novel warning about the dangers of totalitarianism and surveillance.',
    },
  ];

  openBook(book: any) {
    this.nav.navigateRoot(['/book-detail', book.id]);
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
