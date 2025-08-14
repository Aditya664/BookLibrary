import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { ApiResponse } from '../Model/ApiResponse';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
  standalone: false
})
export class RegistrationPage {
  registrationForm: FormGroup;
  showPassword = false;
  termsAccepted = false;
  isLoading = false;
  errorMessage = '';
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.registrationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      userName: ['', Validators.required],
      fullName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async register() {
    if (!this.registrationForm.valid || !this.termsAccepted) return;

    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const response = await this.authService.register(this.registrationForm.value).toPromise();
      this.isLoading = false;
      
      if (response?.success) {
        this.presentToast('Registration successful! Please login.', 'success');
        this.router.navigate(['/login']);
      } else {
        this.errorMessage = response?.message || 'Registration failed. Please try again.';
      }
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error.error?.message || error.message || 'An error occurred during registration.';
      console.error('Registration error:', error);
    }
  }

  // Social login methods
  async loginWithGoogle() {
    this.errorMessage = 'Google login is not yet implemented.';
    this.presentToast(this.errorMessage, 'warning');
  }

  async loginWithFacebook() {
    this.errorMessage = 'Facebook login is not yet implemented.';
    this.presentToast(this.errorMessage, 'warning');
  }

  async loginWithApple() {
    this.errorMessage = 'Apple login is not yet implemented.';
    this.presentToast(this.errorMessage, 'warning');
  }

  private presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    this.toastCtrl.create({
      message,
      duration: 3000,
      color
    }).then(toast => toast.present());
  }
}
