export interface Experience {
  id: number;
  name: string;
  hotels: number[];
}

const data: Experience[] = [
  { id: 1, name: 'Mountain Biking', hotels: [1, 4] },
  { id: 2, name: 'Scuba Diving', hotels: [1, 2] },
  { id: 3, name: 'Snowboarding', hotels: [3, 4] },
  { id: 4, name: 'Fine Dining', hotels: [3, 4] },
  { id: 5, name: 'Sunset at the Beach', hotels: [1, 2] },
  { id: 6, name: 'Golfing', hotels: [3, 4] },
  { id: 7, name: 'Live Performances', hotels: [2] },
  { id: 8, name: 'Art Exhibitions', hotels: [1] },
];

export interface ExperienceRepository {
  get: () => Promise<Experience[]>;
}

const getExperiences = async (): Promise<Experience[]> => {
  return data.slice();
};

export const experienceRepository = (): ExperienceRepository => ({
  get: getExperiences,
});
