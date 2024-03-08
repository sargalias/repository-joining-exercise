import { Availability } from './hotelRepository';

export interface Offer {
  id: number;
  name: string;
  discountPercentage: number;
  hotels: number[];
  dates: Availability;
  minTravellers: number;
}

export interface OfferRepository {
  get: () => Promise<Offer[]>;
}

const data: Offer[] = [
  {
    id: 1,
    name: 'Spring Break Special',
    discountPercentage: 20,
    hotels: [1, 2, 3, 4],
    dates: { from: '2022-03-01 00:00', to: '2022-04-01 00:00' },
    minTravellers: 1,
  },
  {
    id: 2,
    name: 'Summer Escape',
    discountPercentage: 10,
    hotels: [1, 2],
    dates: { from: '2022-07-01 00:00', to: '2022-09-01 00:00' },
    minTravellers: 1,
  },
  {
    id: 3,
    name: 'Holiday Extravaganza',
    discountPercentage: 15,
    hotels: [3, 4],
    dates: { from: '2022-12-01 00:00', to: '2023-01-01 00:00' },
    minTravellers: 1,
  },
  {
    id: 4,
    name: 'Group Getaway Deal',
    discountPercentage: 30,
    hotels: [1, 2, 3, 4],
    dates: { from: '2022-03-01 00:00', to: '2023-03-01 00:00' },
    minTravellers: 4,
  },
];

const getOffers = async (): Promise<Offer[]> => {
  return data.slice();
};

export const offerRepository = (): OfferRepository => ({
  get: getOffers,
});
