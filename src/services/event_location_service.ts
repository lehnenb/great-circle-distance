import { degreesToRadians } from "../lib/math";

const EARTH_RADIUS  = 6371;

interface ILocation {
  lat: number;
  long: number;
}

const EVENT_COORDINATES: ILocation =  {
  lat: 52.493256,
  long: 13.446082,
};

export class EventLocationService {
  static calculateDistance(destination: ILocation): number {
      const rEvLat = degreesToRadians(90.0 - EVENT_COORDINATES.lat);
      const rEvLong  = degreesToRadians(EVENT_COORDINATES.long);
      const rDestLat = degreesToRadians(90.0 - destination.lat);
      const rDestLong = degreesToRadians(destination.long);

      const cos = Math.sin(rEvLat) * Math.sin(rDestLat) *
                  Math.cos(rEvLong - rDestLong) +
                  Math.cos(rEvLat) * Math.cos(rDestLat);

      const arc = Math.acos(cos);


      return arc * EARTH_RADIUS;
  }
}

export default EventLocationService
