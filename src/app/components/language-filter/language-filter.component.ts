import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-language-filter',
  templateUrl: './language-filter.component.html',
  styleUrls: ['./language-filter.component.scss'],
})
export class LanguageFilterComponent {
  @Input() availableLanguages: string[] = [];
  @Input() selectedLanguages: string[] = [];
  @Output() languageToggled = new EventEmitter<string>();
  @Output() clearAll = new EventEmitter<void>();

  getLanguageFlag(language: string): string {
    const flags: { [key: string]: string } = {
      'English': '🇬🇧',
      'Hindi': '🇮🇳',
      'Marathi': '🇮🇳',
    };
    return flags[language] || '🌐';
  }

  onLanguageToggle(language: string) {
    this.languageToggled.emit(language);
  }

  onClearAll() {
    this.clearAll.emit();
  }
}
