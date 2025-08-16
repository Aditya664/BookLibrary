import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BookService } from '../services/book.service';
import { TokenService } from '../services/token.service';
import { ModalController, NavController } from '@ionic/angular/standalone';

// Ionic Components
import { 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonTitle, 
  IonContent, 
  IonSpinner,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonList,
  IonNote,
  IonBackButton
} from '@ionic/angular/standalone';

// Icons - Ionic 7+ automatically registers icons

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  // Add other book properties as needed
}

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: false,
})
export class FavoritesPage implements OnInit {
  favorites: Book[] = [];
  isLoading = true;
  userId: string | null = null;

  constructor(
    private bookService: BookService,
    private tokenService: TokenService,
    private modalCtrl: ModalController,
    private navCtrl: NavController
  ) {
    // Icons are automatically registered in Ionic 7+
  }

  async ngOnInit() {
    this.userId = TokenService.getUserId();
    if (this.userId) {
      await this.loadFavorites();
    }
  }

  async loadFavorites() {
    if (!this.userId) return;
    
    this.isLoading = true;
    try {
      const response = await this.bookService.getUserFavoritesAsync(this.userId).toPromise();
      if (response?.success && response.data) {
        // Map the response data to match the Book interface
        this.favorites = response.data.map((item: any) => ({
          id: item.bookId || item.id,
          title: item.title || 'Unknown Title',
          author: item.author || 'Unknown Author',
          coverImage: item.coverImage || 'assets/icon/default-book-cover.png'
        }));
      } else {
        this.favorites = [];
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.favorites = [];
    } finally {
      this.isLoading = false;
    }
  }

  async openBookDetails(book: Book) {
    // Navigate to book details page
    this.navCtrl.navigateForward(['/book-details', book.id]);
  }

  async removeFromFavorites(bookId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (!this.userId) return;
    
    try {
      const response = await this.bookService.removeFromFavorites(this.userId, bookId).toPromise();
      if (response?.success) {
        this.favorites = this.favorites.filter(book => book.id !== bookId);
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  }

  goBack() {
    this.navCtrl.back();
  }
}
