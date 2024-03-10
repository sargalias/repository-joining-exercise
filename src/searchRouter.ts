import express from 'express';
import { Hotel, hotelRepository } from './repositories/hotelRepository';
import { differenceInBusinessDays, isAfter, isBefore, isEqual } from 'date-fns';
import { SearchOrder, SearchRequest, SearchResultHotel } from './search';
import {
  Experience,
  experienceRepository,
} from './repositories/experienceRepository';
import { Offer, offerRepository } from './repositories/offerRepository';
import { append, compose, filter, flip, map, transduce } from 'ramda';

const _hotelRepository = hotelRepository();
const _experienceRepository = experienceRepository();
const _offerRepository = offerRepository();

const router = express.Router();

router.post('', async (req, res) => {
  const { from, to, travellers, orderBy }: SearchRequest = req.body;

  const hotels = await _hotelRepository.get();
  const experiences = await _experienceRepository.get();
  const offers = await _offerRepository.get();

  const filteredHotels = filter((hotel: Hotel): boolean =>
    filterHotel({ from, to }, hotel),
  )(hotels);

  // @ts-ignore due to tranducing, the functions will run in the wrong order, so this completely messes up the typings
  const transducer: (arg: readonly Hotel[]) => SearchResultHotel[] = compose(
    map(
      (hotel: Hotel): HotelWithExperiences =>
        addExperiences(hotel, experiences),
    ),
    map(
      (hotel: HotelWithExperiences): HotelWithOffers =>
        addOffers(hotel, travellers, from, to, offers),
    ),
    map(
      (hotel: HotelWithOffers): HotelWithPrices =>
        addCostsAndDiscounts(hotel, travellers, from, to),
    ),
    map((hotel: HotelWithPrices): SearchResultHotel => toViewModel(hotel)),
  );

  const results = <SearchResultHotel[]>(
    transduce(transducer, flip(append), [], filteredHotels)
  );

  const sorter = createSorter(orderBy);
  const sorted = results.sort(sorter);

  res.send(sorted);
});

const filterHotel = (
  filters: { from: string; to: string },
  hotel: Hotel,
): boolean => {
  const { from, to } = filters;
  return hotel.availability.some((availability) => {
    return (
      (isEqual(from, availability.from) || isAfter(from, availability.from)) &&
      (isEqual(from, availability.from) || isBefore(to, availability.to))
    );
  });
};

type HotelWithExperiences = Hotel & { experiences: string[] };

const addExperiences = (
  hotel: Hotel,
  experiences: Experience[],
): HotelWithExperiences => {
  const { id } = hotel;
  const relevantExperiences = experiences.filter((experience) => {
    return experience.hotels.includes(id);
  });
  const relevantExperienceIds = relevantExperiences.map((experience) =>
    experience.id.toString(),
  );
  return { ...hotel, experiences: relevantExperienceIds };
};

type HotelWithOffers = HotelWithExperiences & { offers: Offer[] };

const addOffers = (
  hotel: HotelWithExperiences,
  travellers: number,
  from: string,
  to: string,
  offers: Offer[],
): HotelWithOffers => {
  const result = {
    ...hotel,
    offers: offers.filter((offer) => {
      return (
        offer.hotels.includes(hotel.id) &&
        offer.minTravellers <= travellers &&
        (isEqual(from, offer.dates.from) || isAfter(from, offer.dates.from)) &&
        (isEqual(to, offer.dates.to) || isBefore(to, offer.dates.to))
      );
    }),
  };
  return result;
};

type HotelWithPrices = HotelWithOffers & {
  basePrice: number;
  discountedPrice: number;
};

const addCostsAndDiscounts = (
  hotel: HotelWithOffers,
  travellers: number,
  from: string,
  to: string,
): HotelWithPrices => {
  const bookedDayCount = differenceInBusinessDays(to, from);
  const basePrice =
    hotel.pricePerNightPerTraveller * travellers * bookedDayCount;
  const bestOffer = hotel.offers.reduce((acc: Offer, current: Offer) => {
    return current.discountPercentage > acc.discountPercentage ? current : acc;
  });
  const discountedPrice =
    ((100 - bestOffer.discountPercentage) / 100) * basePrice;
  return {
    ...hotel,
    basePrice,
    discountedPrice,
  };
};

const toViewModel = (hotel: HotelWithPrices): SearchResultHotel => {
  return {
    hotelName: hotel.name,
    starRating: Number(hotel.starRating),
    basePrice: hotel.basePrice,
    discountedPrice: hotel.discountedPrice,
    offers: hotel.offers.map((offer) => ({
      name: offer.name,
      discountPercentage: offer.discountPercentage,
    })),
    experiences: hotel.experiences,
  };
};

const createSorter = (searchOrder: SearchOrder) => {
  const sorter = (a: SearchResultHotel, b: SearchResultHotel): number => {
    switch (searchOrder) {
      case SearchOrder.Price:
        return a.basePrice - b.basePrice;
      case SearchOrder.DiscountAmount:
        return (
          b.basePrice - b.discountedPrice - (a.basePrice - a.discountedPrice)
        );
      case SearchOrder.AlphabeticalAsc:
        return a.hotelName < b.hotelName ? -1 : 1;
      case SearchOrder.AlphabeticalDesc:
        return a.hotelName < b.hotelName ? 1 : -1;
      default:
        return 0;
    }
  };
  return sorter;
};

export default router;
