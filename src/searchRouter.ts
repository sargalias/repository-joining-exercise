import express from 'express';
import { Hotel, hotelRepository } from './repositories/hotelRepository';
import { differenceInBusinessDays, isAfter, isBefore, isEqual } from 'date-fns';
import {
  SearchOrder,
  SearchRequest,
  SearchResultHotel,
  SearchResultOffer,
} from './search';
import {
  Experience,
  experienceRepository,
} from './repositories/experienceRepository';
import { Offer, offerRepository } from './repositories/offerRepository';

const _hotelRepository = hotelRepository();
const _experienceRepository = experienceRepository();
const _offerRepository = offerRepository();

const router = express.Router();

router.post('', async (req, res) => {
  const { from, to, travellers, orderBy }: SearchRequest = req.body;

  const hotels = await _hotelRepository.get();
  const experiences = await _experienceRepository.get();
  const offers = await _offerRepository.get();

  const filteredHotels = filterHotels({ from, to }, hotels);
  const withExperiences = filteredHotels.map((hotel) =>
    addExperiences(hotel, experiences),
  );
  const withOffers = withExperiences.map((hotel) =>
    addOffers(hotel, travellers, from, to, offers),
  );
  const withCostsAndDiscounts = withOffers.map((hotel) =>
    addCostsAndDiscounts(hotel, travellers, from, to),
  );

  const viewModelResults = withCostsAndDiscounts.map((hotel) =>
    toViewModel(hotel),
  );

  const sorter = createSorter(orderBy);
  const sorted = viewModelResults.sort(sorter);

  res.send(sorted);
});

const filterHotels = (
  filters: { from: string; to: string },
  hotels: Hotel[],
): Hotel[] => {
  const { from, to } = filters;
  const results = hotels.filter((hotel) => {
    return hotel.availability.some((availability) => {
      return (
        (isEqual(from, availability.from) ||
          isAfter(from, availability.from)) &&
        (isEqual(from, availability.from) || isBefore(to, availability.to))
      );
    });
  });

  return results;
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
  return {
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
