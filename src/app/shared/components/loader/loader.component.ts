import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LoaderComponent {
  @Input() text: string = 'Loading...';
  @Input() subtext: string = 'Just a moment please';
}
