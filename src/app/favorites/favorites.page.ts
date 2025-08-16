import { Component, OnInit, HostListener } from '@angular/core';
import { BookService } from '../services/book.service';
import { TokenService } from '../services/token.service';
import { Router } from '@angular/router';
import { AlertController, LoadingController, NavController, ToastController } from '@ionic/angular';
import { map, Subject, Subscription } from 'rxjs';
import { ApiResponse, BookResponse, FavoriteListResponseDto } from '../Model/ApiResponse';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: false
})
export class FavoritesPage implements OnInit {
  favoriteBooks: BookResponse[] = [];
  viewMode: 'grid' | 'list' = 'grid';
  headerScrolled = false;
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  // Color gradients for book placeholders
  private gradients = [
    'gradient-1',
    'gradient-2',
    'gradient-3',
    'gradient-4',
    'gradient-5',
    'gradient-6'
  ];

  private userId: string;

  constructor(
    private bookService: BookService,
    private router: Router,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.userId = TokenService.getUserId() || '';
  }

  ngOnInit() {
    this.loadFavorites();
  }

  ionViewWillEnter() {
    this.loadFavorites();
  }

  ionViewWillLeave() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async handleRefresh(event: any) {
    await this.loadFavorites();
    event.target.complete();
  }

  onScroll(event: any) {
    this.headerScrolled = event.detail.scrollTop > 10;
  }

  getGradientClass(title: string): string {
    // Use the same gradient pattern as the dashboard
    const gradients = [
      'gradient-1', // Blue to Purple
      'gradient-2', // Green to Cyan
      'gradient-3', // Orange to Red
      'gradient-4', // Pink to Purple
      'gradient-5', // Teal to Blue
      'gradient-6', // Yellow to Orange
    ];

    // Create a consistent hash from the title
    const hash = Array.from(title).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );

    return gradients[hash % gradients.length];
  }

  goBack() {
    this.navCtrl.back();
  }

  getInitials(title: string): string {
    if (!title) return '??';
    return title
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  trackByBookId(index: number, book: any): string {
    return book.id || index;
  }

  async loadFavorites() {
    this.loading = true;
    this.error = null;
    setTimeout(() => {
      try {
        this.bookService.getUserFavoritesAsync(this.userId).subscribe({
            next: (res) => {
              this.favoriteBooks = res.data.map((item: FavoriteListResponseDto) => ({
                ...item.book
              }));
            },
            error: (err) => {
              console.error("Error while fetching favorites:", err);
            }
          });
      } catch (err) {
        console.error('Error loading favorites:', err);
        this.error = 'Failed to load favorites. Please try again.';
      } finally {
        this.loading = false;
      }
    }, 500);
  }

  openBook(book: BookResponse) {
    this.router.navigate(['/book-details', book.id]);
  }

  async removeFromFavorites(bookId: string, event: Event) {
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Remove from Favorites',
      message: 'Are you sure you want to remove this book from your favorites?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Remove',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Removing from favorites...',
              spinner: 'crescent'
            });
            await loading.present();

            try {
              // Call backend API to toggle favorites (remove from favorites)
              await this.bookService.toggleFavoritesAsync({
                userId: this.userId,
                bookId: bookId
              }).toPromise().then(() => this.loadFavorites()).catch((error)=>console.log(error)
              );
              
              // Show success toast
              const toast = await this.toastController.create({
                message: 'Removed from favorites',
                duration: 2000,
                position: 'bottom',
                color: 'success',
                buttons: [{
                  icon: 'close',
                  role: 'cancel'
                }]
              });
              await toast.present();
              
            } catch (error) {
              console.error('Error removing from favorites:', error);
              
              // Show error toast
              const errorToast = await this.toastController.create({
                message: 'Failed to remove from favorites. Please try again.',
                duration: 3000,
                position: 'bottom',
                color: 'danger',
                buttons: [{
                  icon: 'close',
                  role: 'cancel'
                }]
              });
              await errorToast.present();
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async shareBook(book: any, event: Event) {
    event.stopPropagation();

    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: book.title,
          text: `Check out "${book.title}" by ${book.author}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out "${book.title}" by ${book.author}`)}`;
      window.open(shareUrl, '_blank');
    }
  }

}
