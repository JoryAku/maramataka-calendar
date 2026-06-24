import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MaramatakaNight } from '../../maramataka.models';

@Component({
  selector: 'app-maramataka-night-card',
  imports: [CommonModule],
  templateUrl: './maramataka-night-card.html',
  styleUrl: './maramataka-night-card.css',
})
export class MaramatakaNightCard {
  night = input.required<MaramatakaNight>();
  isCurrent = input(false);
}
