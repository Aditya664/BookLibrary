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
  reminderMe = false;
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

  register() {
    if (!this.registrationForm.valid) return;

    this.presentLoading('Registering...');
    this.authService.register(this.registrationForm.value).subscribe({
      next: (response:ApiResponse<null>) => {
        this.dismissLoading();
        if (response.success) {
          this.presentToast('Registration successful! Please login.', 'success');
          this.router.navigate(['/login']);
        } else {
          this.presentToast('Unexpected response: ' + response, 'warning');
        }
      },
      error: (error) => {
        this.dismissLoading();
        this.presentToast('Registration failed: ' + (error.error?.message || error.message), 'danger');
        console.error('Registration error:', error);
      }
    });
  }

  private loading: HTMLIonLoadingElement | null = null;

  private presentLoading(message: string) {
    this.loadingCtrl.create({
      message,
      spinner: 'crescent'
    }).then(loader => {
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

  private presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    this.toastCtrl.create({
      message,
      duration: 3000,
      color
    }).then(toast => toast.present());
  }
}
