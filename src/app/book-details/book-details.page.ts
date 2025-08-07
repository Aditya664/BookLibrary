import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { NavController, Platform } from '@ionic/angular';

@Component({
  selector: 'app-book-details',
  templateUrl: './book-details.page.html',
  styleUrls: ['./book-details.page.scss'],
  standalone: false,
})
export class BookDetailsPage implements OnInit {
  book = {
    id: '1',
    image:
      'https://images-na.ssl-images-amazon.com/images/I/51Z0nLAfLmL._SX331_BO1,204,203,200_.jpg', // replace with actual image path or URL
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    rating: 4,
    description: `The Alchemist is a story about the journey of a young shepherd named Santiago. He dreams of a treasure hidden in the Egyptian pyramids and embarks on a quest full of spiritual lessons, omens, and discoveries.`,
    genres: ['Fiction', 'Philosophy', 'Adventure', 'Spiritual'],
    reviews: [
      {
        user: 'Anjali Sharma',
        comment: 'A beautiful journey of self-discovery. Highly recommended!',
      },
      {
        user: 'Ravi Mehta',
        comment: 'Uplifting and thought-provoking. A must-read classic.',
      },
    ],
  };

  constructor(
    private navCtrl: NavController,
    private platform: Platform
  ) {}

  goBack() {
    this.navCtrl.back(); 
  }

  ngOnInit() {
    if (this.platform.is('capacitor')) {
      this.platform.backButton.subscribeWithPriority(10, () => {
        const canGoBack = window.history.length > 1;
        if (canGoBack) {
          this.goBack();
        } else {
          App.exitApp(); 
        }
      });
    }
  }
  
  

  isBookmarked = false;

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
}
