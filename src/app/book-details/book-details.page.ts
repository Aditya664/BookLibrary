import { Component, OnInit, HostListener, Pipe, PipeTransform } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, NavController, Platform } from '@ionic/angular';
import { BookService } from '../services/book.service';
import { Share } from '@capacitor/share';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse, BookResponse, ReviewResponse } from '../Model/ApiResponse';

// Truncate pipe for template
@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 25, completeWords = false, ellipsis = '...') {
    if (!value) return '';
    if (value.length <= limit) return value;
    
    if (completeWords) {
      limit = value.substr(0, limit).lastIndexOf(' ');
    }
    return `${value.substr(0, limit)}${ellipsis}`;
  }
}

@Component({
  selector: 'app-book-details',
  templateUrl: './book-details.page.html',
  styleUrls: ['./book-details.page.scss'],
  standalone: false,
})
export class BookDetailsPage implements OnInit {
  book: BookResponse | null = null;
  similarBooks: BookResponse[] = [];
  isBookmarked = false;
  headerScrolled = false;
  hideHeader = false;
  lastScrollTop = 0;
  bookId!: string;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private platform: Platform
  ) { 
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

  goBack() {
    this.navCtrl.back();
  }

  readBook() {
    // Navigate to PDF reader page
    if (this.book && this.book.id) {
      this.navCtrl.navigateForward(['/read-book', this.book.id]);
    } else {
      console.log('No book available to read');
    }
  }

  openBook(book: any) {
    // Navigate to another book's details
    this.navCtrl.navigateForward(['/book-details', book.id]);
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.bookId = id;
        this.loadBookDetails(id);
        this.loadSimilarBooks();
      } else {
        this.navCtrl.navigateBack('/dashboard');
      }
    });
  }

  // Handle scroll events for header show/hide
  onScroll(event: any) {
    const scrollTop = event.detail?.scrollTop || 0;
    this.headerScrolled = scrollTop > 50;
    
    // Hide/show header based on scroll direction
    if (scrollTop > this.lastScrollTop && scrollTop > 100) {
      this.hideHeader = true;
    } else {
      this.hideHeader = false;
    }
    
    // For iOS bounce effect
    if (scrollTop <= 0) {
      this.hideHeader = false;
    }
    
    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  loadBookDetails(id: string) {
    this.isLoading = true;
    this.bookService.getBookById(id).pipe(
      map((response: ApiResponse<BookResponse>) => {
        if (response?.data) {
          this.book = response.data;
          // Initialize reviews if not present
          if (!this.book.reviews) {
            this.book.reviews = [];
          }
          // Check if book is bookmarked
          this.checkIfBookmarked();
        }
        this.isLoading = false;
      }),
      catchError(async (error) => {
        console.error('Error loading book details:', error);
        await this.showErrorAlert('Failed to load book details. Please try again.');
        this.isLoading = false;
        return of(null);
      })
    ).subscribe();
  }

  checkIfBookmarked() {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    this.isBookmarked = bookmarks.includes(this.bookId);
  }

  async shareBook() {
    try {
      await Share.share({
        title: this.book?.title,
        text: `Check out "${this.book?.title}" by ${this.book?.author}`,
        url: window.location.href,
        dialogTitle: 'Share this book'
      });
    } catch (error) {
      console.error('Error sharing book:', error);
    }
  }


  async showSuccessAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Success',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showErrorAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  getInitials(title: string): string {
    if (!title) return 'BK';
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  getGradientClass(title: string): string {
    if (!title) return 'gradient-1';
    // Simple hash function to generate consistent gradient classes
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradientIndex = Math.abs(hash) % 5;
    return `gradient-${gradientIndex + 1}`;
  }

  startReading() {
    // Navigate to PDF reader page
    if (this.book && this.book.id) {
      this.navCtrl.navigateForward(['/read-book', this.book.id]);
    } else {
      console.log('No book available to read');
    }
  }

  toggleBookmark() {
    this.isBookmarked = !this.isBookmarked;
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    if (this.isBookmarked) {
      bookmarks.push(this.book);
    } else {
      const index = bookmarks.findIndex((b: any) => b.id === this.book?.id);
      if (index > -1) bookmarks.splice(index, 1);
    }
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }

  openRatingModal() {
    // Ideally use a modal or alert controller 
    alert('Rating feature coming soon!');
  }

  loadSimilarBooks() {
    // Load similar books based on genre or author
    this.bookService.getPopularBooks().subscribe((response: ApiResponse<BookResponse[]>) => {
      this.similarBooks = response.data?.slice(0, 6) || []; // Show first 6 as similar
    });
  }

  getEstimatedPages(): number {
    // Estimate pages based on title length (simple estimation without API)
    if (!this.book?.title) return 250;
    const titleLength = this.book.title.length;
    return Math.round(200 + (titleLength * 10)); // Base 200 + title factor
  }

  getReadingTime(): number {
    // Estimate reading time based on estimated pages (average 2 minutes per page)
    return Math.round(this.getEstimatedPages() * 2);
  }

  seeAllBooks() {
    this.router.navigate(['/see-all-books']);
  }

}
