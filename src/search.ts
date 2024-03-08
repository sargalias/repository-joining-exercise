export interface SearchRequest {
  from: string;
  to: string;
  travellers: number;
  orderBy: SearchOrder;
  experiences?: number[];
}

export enum SearchOrder {
  Price = 'price',
  DiscountAmount = 'discount-amount',
  AlphabeticalAsc = 'alphabetical-asc',
  AlphabeticalDesc = 'alphabetical-desc',
}

export type SearchResults = SearchResultHotel[];

export interface SearchResultHotel {
  hotelName: string;
  starRating: number;
  basePrice: number;
  discountedPrice: number;
  offers: SearchResultOffer[];
  experiences: string[];
}

export interface SearchResultOffer {
  name: string;
  discountPercentage: number;
}
