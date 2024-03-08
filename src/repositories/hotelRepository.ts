export interface Availability {
  from: string;
  to: string;
}

export interface Hotel {
  id: number;
  name: string;
  starRating: string;
  pricePerNightPerTraveller: number;
  availability: Availability[];
}

export interface HotelRepository {
  get: () => Promise<Hotel[]>;
}

const data: Hotel[] = [
  {
    id: 1,
    name: 'Econo Lodge',
    starRating: '2.5',
    pricePerNightPerTraveller: 40,
    availability: [
      { from: '2022-03-01 00:00', to: '2022-05-01 00:00' },
      { from: '2022-07-01 00:00', to: '2022-09-01 00:00' },
      { from: '2022-11-01 00:00', to: '2023-01-01 00:00' },
    ],
  },
  {
    id: 2,
    name: 'Midtown Suites',
    starRating: '4.5',
    pricePerNightPerTraveller: 90,
    availability: [
      { from: '2022-04-01 00:00', to: '2022-06-01 00:00' },
      { from: '2022-08-01 00:00', to: '2022-11-01 00:00' },
      { from: '2022-12-01 00:00', to: '2023-03-01 00:00' },
    ],
  },
  {
    id: 3,
    name: 'Luxury Retreat',
    starRating: '5',
    pricePerNightPerTraveller: 150,
    availability: [{ from: '2022-02-01 00:00', to: '2023-02-01 00:00' }],
  },
  {
    id: 4,
    name: 'Grand Palace',
    starRating: '5',
    pricePerNightPerTraveller: 250,
    availability: [
      { from: '2022-03-01 00:00', to: '2022-07-01 00:00' },
      { from: '2022-09-01 00:00', to: '2023-02-01 00:00' },
    ],
  },
];

const getHotels = async (): Promise<Hotel[]> => {
  return data.slice();
};

export const hotelRepository = (): HotelRepository => ({
  get: getHotels,
});
