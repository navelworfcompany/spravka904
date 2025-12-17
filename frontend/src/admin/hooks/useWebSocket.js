// src/admin/hooks/useWebSocket.js
import { useEffect, useRef } from 'react';
import { useAdmin } from './useAdmin';

export const useWebSocket = () => {
  const { addNotification } = useAdmin();
  const ws = useRef(null);

  useEffect(() => {
    // В реальном приложении здесь было бы подключение к WebSocket
    // Сейчас симулируем уведомления для демонстрации
    
    const simulateNotifications = () => {
      const events = [
        {
          type: 'success',
          title: 'Новая заявка',
          message: 'Поступила новая заявка от Иванова'
        },
        {
          type: 'info', 
          title: 'Статус изменен',
          message: 'Заявка #123 переведена в работу'
        },
        {
          type: 'warning',
          title: 'Требуется внимание',
          message: 'Необработанных заявок: 5'
        }
      ];

      // Случайное уведомление каждые 20-40 секунд
      const randomTime = Math.random() * 20000 + 20000;
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      
      setTimeout(() => {
        addNotification(randomEvent);
        simulateNotifications(); // Рекурсивно продолжаем
      }, randomTime);
    };

    simulateNotifications();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [addNotification]);

  return null;
};