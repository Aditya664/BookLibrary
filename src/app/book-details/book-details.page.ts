import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { NavController, Platform } from '@ionic/angular';
import { BookService } from '../services/book.service';
import { ApiResponse, BookResponse } from '../Model/ApiResponse';

@Component({
  selector: 'app-book-details',
  templateUrl: './book-details.page.html',
  styleUrls: ['./book-details.page.scss'],
  standalone: false,
})
export class BookDetailsPage implements OnInit {
  book!: BookResponse;
  bookId!: string;
  isLoading = false;
  similarBooks: BookResponse[] = [];
  isBookmarked = false;

  constructor(
    private navCtrl: NavController,
    private platform: Platform,
    private route: ActivatedRoute,
    private bookService: BookService
  ) {}

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
    // Navigate to reading interface or open book reader
    console.log('Reading book:', this.book?.title);
    // You can implement actual reading functionality here
  }

  openBook(book: any) {
    // Navigate to another book's details
    this.navCtrl.navigateForward(['/book-details', book.id]);
  }

  ngOnInit() {
    this.getBookDetailsById();
    this.loadSimilarBooks();
    if (this.platform.is('capacitor')) {
      this.platform.backButton.subscribeWithPriority(10, () => {
        const canGoBack = window.history.length > 1;
        console.log(window.history);
        
        if (canGoBack) {
          this.goBack();
        } else {
          App.exitApp();
        }
      });
    }
  }

  getBookDetailsById() {
    this.isLoading = true;
    this.route.params.subscribe((params) => {
      this.bookId = params['id'];
      this.bookService.getBookById(this.bookId).subscribe((response:ApiResponse<BookResponse>) => {
        this.book = response.data;
        this.isLoading = false;
      }, ()=>{this.isLoading = false;});
    });
  }

  getInitials(title: string): string {
    if (!title) return '';
    return title
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0))
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
      'gradient-pink'
    ];
  
    // Simple hash to get a consistent gradient for each title
    const hash = Array.from(title).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  }

  startReading() {
    // Navigate to reading page or open book reader
    console.log('Starting to read:', this.book.title);
    // You could navigate to a reading page here
    // this.navCtrl.navigateForward(`/reading/${this.book.id}`);
  }

  toggleBookmark() {
    this.isBookmarked = !this.isBookmarked;
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    if (this.isBookmarked) {
      bookmarks.push(this.book);
    } else {
      const index = bookmarks.findIndex((b: any) => b.id === this.book.id);
      if (index > -1) bookmarks.splice(index, 1);
    }
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }

  shareBook() {
    Share.share({
      title: this.book.title,
      text: `Check out this book: ${this.book.title} by ${this.book.author}`,
      url: window.location.href,
      dialogTitle: 'Share this book',
    });
  }

  openRatingModal() {
    // Ideally use a modal or alert controller here
    alert('Rating feature coming soon!');
  }

  loadSimilarBooks() {
    // Load similar books based on genre or author
    this.bookService.getPopularBooks().subscribe((response: ApiResponse<BookResponse[]>) => {
      this.similarBooks = response.data.slice(0, 5); // Show first 5 as similar
    });
  }
}
