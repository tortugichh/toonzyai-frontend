// Google Analytics инициализация
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const initializeAnalytics = () => {
  const GA_ID = import.meta.env.VITE_GA_ID;
  
 

  // Создаем скрипт для загрузки Google Analytics
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // Инициализируем dataLayer и gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer.push(args);
  };

  // Конфигурируем Google Analytics
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);


};

// Функция для отправки событий
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Функция для отправки просмотров страниц
export const trackPageView = (page_path: string, page_title?: string) => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', import.meta.env.VITE_GA_ID, {
      page_path,
      page_title,
    });
  }
}; 

// Функция GA4 для отслеживания регистрации (конверсия sign_up)
export const trackSignUp = (method: string = 'email') => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'sign_up', {
      method,
    });
  }
}; 