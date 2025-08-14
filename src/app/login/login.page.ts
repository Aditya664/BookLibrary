import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { LoadingController, NavController, ToastController } from '@ionic/angular';
import { ApiResponse, LoginResponse } from '../Model/ApiResponse';
import { TokenService } from '../services/token.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  loginForm: FormGroup;
  errorMessage: string = '';
  showPassword = false;
  isLoading = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private nav:NavController
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required],
    });
  }

  login() {
    if (!this.loginForm.valid) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: ApiResponse<LoginResponse>) => {
        this.isLoading = false;
        
        if (response.success) {
          this.presentToast(response.message || 'Login successful!', 'success');
          localStorage.setItem('token', response.data.jwtToken);
          localStorage.setItem('fullName', TokenService.getFullName() ?? '');
          this.nav.navigateRoot('/tabs', { replaceUrl: true });
        } else {
          this.errorMessage = response.message || 'Login failed. Please check your credentials.';
          this.presentToast(this.errorMessage, 'warning');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Login failed. Please try again.';
        this.presentToast(
          'Login failed: ' + (error.error?.message || error.message),
          'danger'
        );
        console.error('Login error:', error);
      },
    });
  }
  
  // Handle forgot password flow
  forgotPassword() {
    this.presentToast('Contact Admin.', 'warning');
    // TODO: Implement forgot password functionality
  }
  
  // Social login methods
  loginWithGoogle() {
    this.presentToast('Google login coming soon!', 'warning');
    // TODO: Implement Google login
  }
  
  loginWithFacebook() {
    this.presentToast('Facebook login coming soon!', 'warning');
    // TODO: Implement Facebook login
  }
  
  loginWithApple() {
    this.presentToast('Apple login coming soon!', 'warning');
    // TODO: Implement Apple login
  }

  private loading: HTMLIonLoadingElement | null = null;

  private presentLoading(message: string) {
    this.loadingCtrl
      .create({
        message,
        spinner: 'crescent',
      })
      .then((loader) => {
        this.loading = loader;
        loader.present();
      });
  }

  private dismissLoading() {
    if (this.loading) {
      this.loading.dismiss();
      this.loading = null;
    }
  }

  private presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger'
  ) {
    this.toastCtrl
      .create({
        message,
        duration: 3000,
        color,
      })
      .then((toast) => toast.present());
  }
}
