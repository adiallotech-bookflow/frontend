import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'confirmation';
  title: string;
  message: string;
  actions?: {
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }[];
  autoClose?: boolean;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);

  show(notification: Omit<Notification, 'id'>): string {
    const id = `notification-${Date.now()}`;
    const newNotification: Notification = { ...notification, id };

    this.notifications.update(notifications => [...notifications, newNotification]);

    if (notification.autoClose !== false) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.duration || 5000);
    }

    return id;
  }

  showConfirmation(title: string, message: string, onConfirm: () => void, onCancel?: () => void): string {
    return this.show({
      type: 'confirmation',
      title,
      message,
      autoClose: false,
      actions: [
        {
          label: 'Confirm',
          action: () => {
            onConfirm();
            this.dismiss(this.notifications().find(n => n.title === title && n.message === message)?.id || '');
          },
          style: 'primary'
        },
        {
          label: 'Cancel',
          action: () => {
            onCancel?.();
            this.dismiss(this.notifications().find(n => n.title === title && n.message === message)?.id || '');
          },
          style: 'secondary'
        }
      ]
    });
  }

  dismiss(id: string): void {
    this.notifications.update(notifications =>
      notifications.filter(notification => notification.id !== id)
    );
  }
}
