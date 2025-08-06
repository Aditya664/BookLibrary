import { Component, OnInit } from '@angular/core';
import { IonicSlides } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone:false
})
export class HomePage implements OnInit {

  ngOnInit(): void {
      
  }
  books = [
    {
      title: 'Ther Melian: Discord',
      author: 'Shienny M.S',
      image: 'assets/images/ther-melian.jpg',
    },
    {
      title: 'The Poppy War',
      author: 'R.F Kuang',
      image: 'assets/images/poppy-war.jpg',
    },
    {
      title: 'The Glass Magician',
      author: 'Charlie N.',
      image: 'assets/images/glass-magician.jpg',
    },
  ];

}