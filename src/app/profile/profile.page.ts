import { Component, OnInit, HostListener } from '@angular/core';
import { BookService } from '../services/book.service';
import { TokenService } from '../services/token.service';
import { FavoriteResponseDto, ReadingProgressResponseDto } from '../Model/ApiResponse';
import { NavController, ToastController } from '@ionic/angular';
import { AlertService } from '../services/alert.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone:false
})
export class ProfilePage implements OnInit {
  favorites: FavoriteResponseDto[] = [];
  recentBooks: ReadingProgressResponseDto[] = [];
  readingStats = {
    booksRead: 0,
    booksCompleted: 0,
    totalReadingTime: 0,
    averageRating: 0,
    favoriteGenre: 'Fiction',
    currentStreak: 0,
    longestStreak: 0
  };
  isLoading = false;
  userId: string | null = null;
  readingGole = localStorage.getItem('readingGole');
  headerScrolled = false;
  hideHeader = false;
  lastScrollTop = 0;
  userProfile = {
    name: 'Book Lover',
    email: 'user@booklibrary.com',
    joinDate: new Date('2024-01-01'),
    avatar: '',
    bio: 'Passionate reader and book enthusiast'
  };
  readingGoal = {
    targetBooks: parseInt(this.readingGole ?? '10'),
    current: 0,
    year: new Date().getFullYear()
  };
  preferences = {
    darkMode: false,
    notifications: true,
    autoBackup: true
  };

  constructor(
    private bookService: BookService,
    private navCtrl: NavController,
    private alertService: AlertService,
    private toastController: ToastController,
    private router: Router
  ) { }

  ngOnInit() {
    this.userId = TokenService.getUserId();
    if (this.userId) {
      this.loadProfileData();
    }
  }


  async loadProfileData() {
    this.isLoading = true;
    try {
      // Load user profile info
      this.loadUserProfile();
      
      // Load reading progress and calculate stats from existing data
      if (this.userId) {
        this.bookService.getUserReadingProgress(this.userId).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const allProgress = response.data;
              
              // Filter recent books with progress
              this.recentBooks = allProgress
                .filter((progress: ReadingProgressResponseDto) => progress.percentage > 0)
                .sort((a: ReadingProgressResponseDto, b: ReadingProgressResponseDto) => 
                  new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                .slice(0, 5);
              
              // Calculate stats from existing progress data
              this.calculateStatsFromProgress(allProgress);
            }
          },
          error: (error) => {
            console.error('Error loading reading progress:', error);
            this.isLoading = false;
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      this.isLoading = false;
    }
  }

  calculateStatsFromProgress(progressData: ReadingProgressResponseDto[]) {
    const completedBooks = progressData.filter(p => p.percentage >= 100);
    const inProgressBooks = progressData.filter(p => p.percentage > 0 && p.percentage < 100);
    
    this.readingStats = {
      booksRead: progressData.length,
      booksCompleted: completedBooks.length,
      totalReadingTime: progressData.length * 45, // Estimate 45 min per book
      averageRating: 4.2, // Mock value
      favoriteGenre: 'Fiction', // Mock value
      currentStreak: Math.min(completedBooks.length, 7),
      longestStreak: Math.min(completedBooks.length + 3, 15)
    };
    
    this.readingGoal.current = completedBooks.length;
    this.isLoading = false;
  }

  loadUserProfile() {
    // In a real app, this would come from user service
    const userInfo = TokenService.getUserInfo();
    if (userInfo) {
      this.userProfile.name = userInfo.name || 'Book Lover';
      this.userProfile.email = userInfo.email || 'user@booklibrary.com';
    }
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

  getUserInitials(): string {
    return this.getInitials(this.userProfile.name);
  }

  getProgressPercentage(): number {
    return Math.min((this.readingGoal.current / this.readingGoal.targetBooks) * 100, 100);
  }

  async updateReadingGoal() {
    const result = await this.alertService.showInput(
      `Set your reading goal for ${this.readingGoal.year}`,
      'Update Reading Goal',
      [{
        name: 'goal',
        type: 'number',
        placeholder: 'Number of books',
        value: this.readingGoal.targetBooks.toString()
      }]
    );
    
    if (result && result.goal && result.goal > 0) {
      this.readingGoal.targetBooks = parseInt(result.goal);
      this.showToast('Reading goal updated successfully!');
    }
  }

  async editProfile() {
    const result = await this.alertService.showInput(
      'Update your profile information',
      'Edit Profile',
      [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Full Name',
          value: this.userProfile.name
        },
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email',
          value: this.userProfile.email
        },
        {
          name: 'bio',
          type: 'textarea',
          placeholder: 'Bio',
          value: this.userProfile.bio
        }
      ]
    );
    
    if (result && result.name) {
      this.userProfile.name = result.name;
      this.userProfile.email = result.email;
      this.userProfile.bio = result.bio;
      this.showToast('Profile updated successfully!');
    }
  }

  togglePreference(key: keyof typeof this.preferences) {
    this.preferences[key] = !this.preferences[key];
    const keyName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    this.showToast(`${keyName} ${this.preferences[key] ? 'enabled' : 'disabled'}`);
  }

  async logout() {
    const confirmed = await this.alertService.showConfirm(
      'Are you sure you want to logout?',
      'Logout',
      'Logout',
      'Cancel'
    );
    
    if (confirmed) {
      // Clear user data and navigate to login
      TokenService.clearToken();
      this.router.navigate(['/login']);
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  navigateToReadBook(bookId: number) {
    this.navCtrl.navigateForward(`/read-book/${bookId}`);
  }

  navigateBack() {
    this.navCtrl.back();
  }

  getMemberSince(): string {
    if (!this.userProfile.joinDate) return '';
    const date = new Date(this.userProfile.joinDate);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  seeAllBooks() {
    this.navCtrl.navigateForward('/see-all-books');
  }

  // Handle scroll events for header show/hide (exact match to book details)
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
      this.headerScrolled = false;
    }
    
    this.lastScrollTop = scrollTop;
  }
}
