
import { NewsItem, ExhibitionItem, WorkItem, AboutData, ContactData } from './types';

export const INITIAL_NEWS: NewsItem[] = [];

export const INITIAL_EXHIBITIONS: ExhibitionItem[] = [];

export const INITIAL_WORKS: WorkItem[] = [];

export const INITIAL_ABOUT: AboutData = {
  photo: '',
  text: '',
  birthDate: '',
  soloExhibitions: [],
  groupExhibitions: []
};

export const INITIAL_CONTACT: ContactData = {
  email: '',
  facebook: '',
  whatsapp: ''
};
