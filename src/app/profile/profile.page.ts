import { Component, OnInit } from '@angular/core';
import { BookService } from '../services/book.service';
import { TokenService } from '../services/token.service';
import { FavoriteResponseDto } from '../Model/ApiResponse';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone:false
})
export class ProfilePage implements OnInit {
  favorites: FavoriteResponseDto[] = [];
  isLoading = false;
  userId: string | null = null;

  constructor(
    private bookService: BookService,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    this.userId = TokenService.getUserId();
    if (this.userId) {
      this.loadUserFavorites();
    }
  }

  loadUserFavorites() {
    // Favorites functionality removed
    this.isLoading = false;
  }

  removeFavorite(bookId: number) {
    // Implementation for removing a favorite
    // This would require a delete API endpoint
  }

  navigateToBook(bookId: number) {
    this.navCtrl.navigateForward(`/book-details/${bookId}`);
  }

  getInitials(title: string): string {
    if (!title) return '';
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
