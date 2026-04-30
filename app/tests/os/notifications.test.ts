import { describe, it, expect, beforeEach } from 'vitest';
import {
  notify,
  getNotificationHistory,
  dismissNotification,
  clearAllNotifications,
} from '../../src/scripts/os/notifications';

describe('notification history', () => {
  beforeEach(() => {
    // Clear previous history
    clearAllNotifications();

    // notify() needs this container in the DOM to render toasts
    document.body.innerHTML = '<div id="os-notif-container"></div>';
  });

  it('adds notifications to history via notify()', () => {
    notify('Title', 'Body');

    const history = getNotificationHistory();
    expect(history).toHaveLength(1);
    expect(history[0].title).toBe('Title');
    expect(history[0].body).toBe('Body');
  });

  it('returns history newest first', () => {
    notify('First', 'body1');
    notify('Second', 'body2');

    const history = getNotificationHistory();
    expect(history[0].title).toBe('Second');
    expect(history[1].title).toBe('First');
  });

  it('dismisses a notification by id', () => {
    notify('A', 'a');
    notify('B', 'b');

    const history = getNotificationHistory();
    const idToRemove = history.find((n) => n.title === 'A')!.id;

    dismissNotification(idToRemove);

    expect(getNotificationHistory()).toHaveLength(1);
    expect(getNotificationHistory()[0].title).toBe('B');
  });

  it('clears all notifications', () => {
    notify('X', 'x');
    notify('Y', 'y');

    clearAllNotifications();

    expect(getNotificationHistory()).toHaveLength(0);
  });

  it('caps history at 100 entries', () => {
    for (let i = 0; i < 105; i++) {
      notify(`N${i}`, `body${i}`);
    }

    expect(getNotificationHistory()).toHaveLength(100);
    // Newest should be last added
    expect(getNotificationHistory()[0].title).toBe('N104');
  });
});
