
import { NewsItem, ExhibitionItem, WorkItem, AboutData, ContactData } from './types';

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Repeat After Me at the 60th Venice Biennale',
    date: '20.04.2024',
    photo: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80',
    url: 'https://pavilionofukraine2024.com/'
  },
  {
    id: '2',
    title: 'Open Group: Archive of Public Space',
    date: '12.11.2023',
    photo: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80',
    url: 'http://open-group.org.ua/'
  }
];

export const INITIAL_EXHIBITIONS: ExhibitionItem[] = [
  {
    id: '1',
    title: 'Temporary Gallery',
    author: 'Pavlo Kovach jr.',
    date: '15.05.2023',
    description: 'An experimental spatial installation exploring the boundaries of institutional visibility. The project consists of several interconnected rooms that question how art is perceived within white cube environments.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1554941068-a252680d25d9?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Ihor Okuniev' },
      { url: 'https://images.unsplash.com/photo-1493335129889-32853c099863?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Yana Kononova' },
      { url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Ihor Okuniev' }
    ],
    location: 'Temporary Gallery, Germany, Cologne'
  },
  {
    id: '2',
    title: 'The Room with No View',
    author: 'Pavlo Kovach jr.',
    date: '02.10.2022',
    description: 'Minimalist intervention in a brutalist architectural space. This work reflects on the isolation and the internal landscape of the artist during the period of transformation.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1505238680356-667803448bb6?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Max Robinson' },
      { url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Max Robinson' },
      { url: 'https://images.unsplash.com/photo-1482160549442-2d79128c7185?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Yulianna Kovach' }
    ],
    location: 'Detenpyla Gallery, Ukraine, Lviv'
  }
];

export const INITIAL_WORKS: WorkItem[] = [
  {
    id: '1',
    title: 'Repeat After Me',
    author: 'Open Group (Pavlo Kovach jr. et al.)',
    date: '2024',
    description: 'A multi-channel video installation featuring people who survived the war in Ukraine, reproducing the sounds of various weapons and alarms. The project was presented at the Pavilion of Ukraine at the 60th Venice Biennale.',
    media: [
      { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', type: 'video' },
      { url: 'https://images.unsplash.com/photo-1515405299443-f71bb768a795?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Venice Biennale Press' },
      { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Open Group' }
    ]
  },
  {
    id: '2',
    title: '1000-km View',
    author: 'Pavlo Kovach jr.',
    date: '2022',
    description: 'A study of landscape perception from a distance. The video documents the process of looking through a telescope at a point located 1000 kilometers away, reflecting on the impossibility of truly seeing what is happening in the distance.',
    media: [
      { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', type: 'video' },
      { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Pavlo Kovach jr.' }
    ]
  },
  {
    id: '3',
    title: 'Archive of Public Space',
    author: 'Open Group',
    date: '2023',
    description: 'A long-term project documenting ephemeral interventions in urban spaces. The archive consists of photographs, maps, and objects gathered from various European cities.',
    media: [
      { url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Open Group Archive' },
      { url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Ihor Okuniev' },
      { url: 'https://images.unsplash.com/photo-1493335129889-32853c099863?auto=format&fit=crop&w=1200&q=80', type: 'image', photographer: 'Yana Kononova' }
    ]
  },
  {
    id: '4',
    title: 'Untitled (Measure)',
    author: 'Pavlo Kovach jr.',
    date: '2021',
    description: 'Mixed media installation. Iron, light, sound. The measure of distance becomes the measure of experience.',
    media: [
      { url: 'https://images.unsplash.com/photo-1515405299443-f71bb768a795?auto=format&fit=crop&w=800&q=80', type: 'image', photographer: 'Artem Humilevskyi' },
      { url: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80', type: 'image', photographer: 'Artem Humilevskyi' }
    ]
  }
];

export const INITIAL_ABOUT: AboutData = {
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  text: `Pavlo Kovach (junior) is a Ukrainian artist, curator, and member of the Open Group. Born in 1987 in Uzhhorod. His practice focuses on the documentation of the invisible, collective memory, and the tension between the individual and the system. He lives and works in Lviv.`,
  birthDate: '04.11.1987',
  soloExhibitions: [
    '2023 - Temporary Gallery, Cologne, Germany',
    '2022 - The Room with No View, Detenpyla, Lviv',
    '2020 - Horizon Line, National Art Museum, Kyiv'
  ],
  groupExhibitions: [
    '2024 - 60th Venice Biennale, Ukraine Pavilion',
    '2023 - Archive of Public Space, Kunstraum, Berlin',
    '2022 - Ukrainian Art Now, Museum of Contemporary Art, Warsaw'
  ]
};

export const INITIAL_CONTACT: ContactData = {
  email: 'pavlo@kovachpavlo.art',
  facebook: 'pavlo.kovach',
  whatsapp: '+380639407881'
};
