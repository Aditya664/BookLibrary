import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone:false
})
export class DashboardPage {
   loggedInUserName = localStorage.getItem('fullName');

   constructor(private router:Router){}

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
popularBooks = this.books.slice(0, 3); // top 3 as popular
recentBooks = this.books.slice(3, 5);  // next 2 as recent

  openBook(book: any) {
    this.router.navigate(['/book-detail', book.id]);
  }
  
  
}
