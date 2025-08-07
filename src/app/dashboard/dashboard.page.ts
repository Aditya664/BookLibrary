import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../services/book.service';
import { ApiResponse, BookResponse, GenreResponseWithBooks } from '../Model/ApiResponse';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone:false
})
export class DashboardPage implements OnInit{
   loggedInUserName = localStorage.getItem('fullName');
    genres:GenreResponseWithBooks[] = [];
    popularBooks:BookResponse[] = [];
    isLoading = false;
    recentBooks:BookResponse[] = []
    continueReading!:BookResponse;;

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
    
    fetchData(): void {
      this.isLoading = true;
    
      forkJoin({
        popularBooks: this.bookService.getPopularBooks(),
        genres: this.bookService.getAllGenres(),
        recentBooks:this.bookService.getRecentlyAddedBooks()
      }).subscribe({
        next: ({ popularBooks, genres,recentBooks }) => {
          this.popularBooks = popularBooks.data;
          this.genres = genres.data;
          this.recentBooks = recentBooks.data
          this.isLoading = false;
          this.continueReading = this.popularBooks[0]
        },
        error: (error) => {
          console.error('Error loading data', error);
          this.isLoading = false;
        }
      });
    }

   ngOnInit(): void {
      this.fetchData()
   }

   constructor(private router:Router,private bookService:BookService){}

   get firstName(): string {
    return this.loggedInUserName
      ? this.loggedInUserName.trim().split(' ')[0]
      : 'Reader';
  }
  
  categories = [
    { name: 'Fiction', icon: 'book' },
    { name: 'Science', icon: 'flask' },
    { name: 'Romance', icon: 'heart' },
    { name: 'Self-help', icon: 'bulb' },
    { name: 'History', icon: 'time' }
  ];

  languages = ['English', 'Hindi', 'Marathi', 'Tamil', 'Gujarati'];

  books = [
  {
    id: '1',
    image: 'assets/book.png',
    title: 'Atomic Habits',
    author: 'James Clear',
    rating: 4.8,
    description: 'A practical guide to building good habits and breaking bad ones using proven frameworks.'
  },
  {
    id: '2',
    image: 'assets/book.png',
    title: 'Ikigai',
    author: 'Héctor García',
    rating: 4.5,
    description: 'Explores the Japanese concept of purpose and how it can lead to a long, fulfilling life.'
  },
  {
    id: '3',
    image: 'assets/book.png',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    rating: 4.7,
    description: 'A mystical story about following your dreams and listening to your heart.'
  },
  {
    id: '4',
    image: 'assets/book.png',
    title: 'Deep Work',
    author: 'Cal Newport',
    rating: 4.6,
    description: 'Teaches how to focus without distraction to produce high-quality work.'
  },
  {
    id: '5',
    image: 'assets/book.png',
    title: 'Think Again',
    author: 'Adam Grant',
    rating: 4.4,
    description: 'Challenges us to question our assumptions and think more flexibly.'
  },
  {
    id: '6',
    image: 'assets/book.png',
    title: 'Rich Dad Poor Dad',
    author: 'R. Kiyosaki',
    rating: 4.6,
    description: 'A personal finance classic comparing two contrasting financial mindsets.'
  },
  {
    id: '7',
    image: 'assets/book.png',
    title: '1984',
    author: 'George Orwell',
    rating: 4.9,
    description: 'A dystopian novel warning about the dangers of totalitarianism and surveillance.'
  }
];

  openBook(book: any) {
    this.router.navigate(['/book-detail', book.id]);
  }
  
  
}
