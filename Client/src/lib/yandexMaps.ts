const YANDEX_MAPS_SCRIPT_ID = 'trampoline-yandex-maps-script';
const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim() ?? '';
const YANDEX_MAPS_LANG = import.meta.env.VITE_YANDEX_MAPS_LANG?.trim() ?? 'ru_RU';

let loadPromise: Promise<YMapsApi> | null = null;

export const isYandexMapsConfigured = () => Boolean(YANDEX_MAPS_API_KEY);

export const getYandexMapsApiKey = () => YANDEX_MAPS_API_KEY;

export const loadYandexMapsApi = (): Promise<YMapsApi> => {
  if (!YANDEX_MAPS_API_KEY) {
    return Promise.reject(
      new Error('Yandex Maps API key is not configured. Set VITE_YANDEX_MAPS_API_KEY in Client/.env.local.'),
    );
  }

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Yandex Maps can only be loaded in the browser.'));
  }

  if (window.ymaps) {
    return new Promise((resolve) => {
      const ymaps = window.ymaps!;
      ymaps.ready(() => resolve(ymaps));
    });
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(YANDEX_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        const ymaps = window.ymaps;
        if (!ymaps) {
          reject(new Error('Yandex Maps script loaded without ymaps object.'));
          return;
        }

        ymaps.ready(() => resolve(ymaps));
      });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Yandex Maps script.')));
      return;
    }

    const script = document.createElement('script');
    script.id = YANDEX_MAPS_SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(YANDEX_MAPS_API_KEY)}&lang=${encodeURIComponent(YANDEX_MAPS_LANG)}`;
    script.async = true;
    script.onload = () => {
      const ymaps = window.ymaps;
      if (!ymaps) {
        reject(new Error('Yandex Maps script loaded without ymaps object.'));
        return;
      }

      ymaps.ready(() => resolve(ymaps));
    };
    script.onerror = () => reject(new Error('Failed to load Yandex Maps script.'));

    document.head.appendChild(script);
  });

  return loadPromise;
};
