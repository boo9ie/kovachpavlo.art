
export interface NewsItem {
  id: string;
  title: string;
  date: string;
  photo: string;
  url: string;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  photographer?: string;
}

export interface ExhibitionItem {
  id: string;
  title: string;
  author: string;
  date: string;
  description: string;
  photos: MediaItem[];
  location: string;
}

export interface WorkItem {
  id: string;
  title: string;
  author: string;
  date: string;
  description: string;
  media: MediaItem[];
}

export interface AboutData {
  photo: string;
  text: string;
  birthDate: string;
  soloExhibitions: string[];
  groupExhibitions: string[];
}

export interface ContactData {
  email: string;
  facebook: string;
  whatsapp: string;
}

export type SectionType = 'news' | 'exhibitions' | 'works' | 'about';
