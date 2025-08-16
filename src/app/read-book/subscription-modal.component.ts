import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-subscription-modal',
  template: `
    <ion-content class="subscription-modal" fullscreen>
      <!-- Close Icon -->
      <ion-button fill="clear" class="close-btn" (click)="closeModal()">
        <ion-icon name="close-circle" size="large"></ion-icon>
      </ion-button>

      <!-- Background overlay gradient -->
      <div class="background-overlay"></div>

      <!-- Hero Image -->
      <div class="header-images">
        <ion-img
          src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80"
        ></ion-img>
      </div>

      <h2 class="title">Unlimited Reading 📚</h2>
      <p class="subtitle">Access thousands of eBooks anytime, anywhere</p>

      <!-- Floating PREMIUM Card -->
      <ion-card class="plan-card premium">
        <ion-card-content>
          <div class="plan-header">
            <h3>✨ PREMIUM (Lifetime)</h3>
            <ion-badge color="danger">60% OFF</ion-badge>
          </div>
          <p class="plan-price">INR 120 · Cancel Anytime</p>
          <p class="plan-description">
            One-time payment for lifetime access. Enjoy all ebooks without
            limits.
          </p>
        </ion-card-content>
      </ion-card>

      <!-- Subscribe Button -->
      <ion-button expand="block" class="continue-btn" (click)="subscribe()">
        Subscribe Now
      </ion-button>
    </ion-content>
  `,
  styles: [
    `
      .subscription-modal {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 25px;
        padding-top: calc(
          25px + env(safe-area-inset-top)
        ); /* Add safe area for status bar */
        background: linear-gradient(160deg, #f0f4f8, #d9e2ec);
        overflow: hidden;
      }

      /* Close Icon */
      .close-btn {
        position: absolute;
        top: calc(
          15px + env(safe-area-inset-top)
        ); /* move down for status bar */
        right: 15px;
        z-index: 10;
        color: #ff5a5f;
      }

      .background-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.6),
          rgba(255, 255, 255, 0.3)
        );
        backdrop-filter: blur(8px);
        z-index: 0;
      }

      .header-images {
        width: 100%;
        margin-bottom: 25px;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        position: relative;
        z-index: 1;
      }

      .header-images ion-img {
        width: 100%;
        height: auto;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      .header-images ion-img:hover {
        transform: scale(1.03);
      }

      .title {
        font-size: 1.9rem;
        font-weight: 800;
        text-align: center;
        color: #111;
        z-index: 1;
        margin-bottom: 8px;
      }

      .subtitle {
        font-size: 1.05rem;
        text-align: center;
        color: #555;
        margin-bottom: 30px;
        z-index: 1;
      }

      .plan-card {
        width: 95%;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        margin-bottom: 30px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        z-index: 1;
      }

      .plan-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 28px 50px rgba(0, 0, 0, 0.2);
      }

      .plan-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .plan-card h3 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
      }

      .plan-price {
        font-size: 1.05rem;
        color: #444;
        margin-bottom: 6px;
      }

      .plan-description {
        font-size: 0.95rem;
        color: #666;
      }

      .premium {
        background: linear-gradient(135deg, #fff0e6, #ffd9b3);
        border: none;
      }

      .continue-btn {
        font-weight: 700;
        border-radius: 16px;
        background: linear-gradient(90deg, #ff8a00, #e52e71);
        color: #fff;
        padding: 16px 0;
        font-size: 1.05rem;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        z-index: 1;
      }

      .continue-btn:active {
        transform: scale(0.97);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      @media (max-width: 400px) {
        .subscription-modal {
          padding: 15px;
        }
        .title {
          font-size: 1.6rem;
        }
        .subtitle {
          font-size: 0.95rem;
        }
        .plan-card h3 {
          font-size: 1.3rem;
        }
        .plan-price,
        .plan-description {
          font-size: 0.9rem;
        }
        .continue-btn {
          font-size: 0.95rem;
        }
      }
    `,
  ],
  standalone: false,
})
export class SubscriptionModalComponent {
  constructor(private modalCtrl: ModalController) {}

  subscribe() {
    console.log('User subscribed!');
    this.modalCtrl.dismiss();
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}
