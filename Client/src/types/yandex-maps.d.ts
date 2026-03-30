declare global {
  interface YMapsMapClickEvent {
    get(name: 'coords'): [number, number];
  }

  interface YMapsEventManager<THandler> {
    add(eventName: string, handler: THandler): void;
    remove(eventName: string, handler: THandler): void;
  }

  interface YMapsGeoObjectCollection {
    add(object: YMapsPlacemark): void;
    remove(object: YMapsPlacemark): void;
  }

  interface YMapsPlacemark {
    events: YMapsEventManager<() => void>;
    geometry: {
      getCoordinates(): [number, number];
    };
  }

  interface YMapsMap {
    geoObjects: YMapsGeoObjectCollection;
    events: YMapsEventManager<(event: YMapsMapClickEvent) => void>;
    setBounds(
      bounds: [[number, number], [number, number]],
      options: { checkZoomRange: boolean; zoomMargin: number },
    ): void;
    setCenter(center: [number, number], zoom?: number): void;
    destroy(): void;
  }

  interface YMapsApi {
    ready(callback: () => void): void;
    Map: new (
      container: HTMLElement,
      state: { center: [number, number]; zoom: number; controls: string[] },
      options: { suppressMapOpenBlock: boolean },
    ) => YMapsMap;
    Placemark: new (
      coordinates: [number, number],
      properties: { hintContent?: string; balloonContentBody?: string },
      options: {
        iconLayout: unknown;
        iconShape: {
          type: 'Circle';
          coordinates: [number, number];
          radius: number;
        };
        iconOffset: [number, number];
        draggable: boolean;
        hideIconOnBalloonOpen: boolean;
        balloonOffset: [number, number];
      },
    ) => YMapsPlacemark;
    templateLayoutFactory: {
      createClass(template: string): unknown;
    };
  }

  interface Window {
    ymaps?: YMapsApi;
  }
}

export {};
