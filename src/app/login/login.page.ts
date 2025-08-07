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

    this.presentLoading('Logging in...');

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: ApiResponse<LoginResponse>) => {
        this.dismissLoading();

        if (response.success) {
          this.presentToast(response.message || 'Login successful!', 'success');
          localStorage.setItem('token', response.data.jwtToken);
          localStorage.setItem('fullName', TokenService.getFullName() ?? '');
          this.nav.navigateRoot('/tabs', { replaceUrl: true });
        } else {
          this.presentToast(response.message || 'Login failed.', 'warning');
        }
      },
      error: (error) => {
        this.dismissLoading();
        this.presentToast(
          'Login failed: ' + (error.error?.message || error.message),
          'danger'
        );
        console.error('Login error:', error);
      },
    });
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
