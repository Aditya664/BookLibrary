import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

export interface AlertOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: string[] | any[];
  inputs?: any[];
  backdropDismiss?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async showAlert(options: AlertOptions): Promise<HTMLIonAlertElement> {
    const alert = await this.alertController.create({
      header: options.title || this.getDefaultTitle(options.type),
      message: options.message,
      buttons: options.buttons || ['OK'],
      inputs: options.inputs,
      backdropDismiss: options.backdropDismiss ?? true,
      cssClass: `modern-alert ${options.type ? `alert-${options.type}` : 'alert-info'}`
    });

    await alert.present();
    return alert;
  }

  async showSuccess(message: string, title?: string): Promise<HTMLIonAlertElement> {
    return this.showAlert({
      title: title || 'Success',
      message,
      type: 'success'
    });
  }

  async showError(message: string, title?: string): Promise<HTMLIonAlertElement> {
    return this.showAlert({
      title: title || 'Error',
      message,
      type: 'error'
    });
  }

  async showWarning(message: string, title?: string): Promise<HTMLIonAlertElement> {
    return this.showAlert({
      title: title || 'Warning',
      message,
      type: 'warning'
    });
  }

  async showInfo(message: string, title?: string): Promise<HTMLIonAlertElement> {
    return this.showAlert({
      title: title || 'Information',
      message,
      type: 'info'
    });
  }

  async showConfirm(
    message: string, 
    title?: string,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: title || 'Confirm',
        message,
        buttons: [
          {
            text: cancelText,
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => resolve(false)
          },
          {
            text: confirmText,
            cssClass: 'alert-button-confirm',
            handler: () => resolve(true)
          }
        ],
        cssClass: 'modern-alert alert-warning'
      });

      await alert.present();
    });
  }

  async showInput(
    message: string,
    title?: string,
    inputs: any[] = [],
    placeholder?: string
  ): Promise<any> {
    return new Promise(async (resolve) => {
      const defaultInputs = inputs.length > 0 ? inputs : [
        {
          name: 'input',
          type: 'text',
          placeholder: placeholder || 'Enter value...'
        }
      ];

      const alert = await this.alertController.create({
        header: title || 'Input Required',
        message,
        inputs: defaultInputs,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => resolve(null)
          },
          {
            text: 'OK',
            cssClass: 'alert-button-confirm',
            handler: (data) => resolve(data)
          }
        ],
        cssClass: 'modern-alert alert-info'
      });

      await alert.present();
    });
  }

  async showToast(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = 3000,
    position: 'top' | 'middle' | 'bottom' = 'bottom'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      position,
      cssClass: `modern-toast toast-${type}`,
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  private getDefaultTitle(type?: string): string {
    switch (type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      case 'info': return 'Information';
      default: return 'Notice';
    }
  }
}
