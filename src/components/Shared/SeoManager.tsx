import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ExhibitionItem, WorkItem } from '../../types';

const SITE_NAME = 'PAVLOKOVACH.ART';
const SITE_URL = 'https://pavlokovach.art';
const DEFAULT_DESCRIPTION = 'Portfolio of Pavlo Kovach, a Ukrainian artist and curator documenting memory, public space, and contemporary art practice.';

const upsertMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

const upsertCanonical = (href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
};

export const SeoManager = ({ exhibitions, works }: { exhibitions: ExhibitionItem[]; works: WorkItem[] }) => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const defaultImage = exhibitions.find((item) => item.photos?.[0]?.url)?.photos?.[0]?.url;

    let title = SITE_NAME;
    let description = DEFAULT_DESCRIPTION;
    let robots = 'index,follow';
    let ogType = 'website';
    let image = defaultImage;
    let canonicalPath = path || '/';

    if (path === '/' || path === '/exhibitions') {
      title = `${SITE_NAME} | Exhibitions`;
      description = 'Selected exhibitions, installations, and documentation from the practice of Pavlo Kovach.';
      canonicalPath = '/';
    } else if (path === '/news') {
      title = `${SITE_NAME} | News`;
      description = 'Recent announcements, exhibitions, and external features related to Pavlo Kovach.';
      canonicalPath = '/news';
    } else if (path === '/works') {
      title = `${SITE_NAME} | Works`;
      description = 'Browse artworks, moving-image projects, and documentation from Pavlo Kovach.';
      image = works.find((item) => item.media?.[0]?.url)?.media?.[0]?.url ?? defaultImage;
    } else if (path === '/about') {
      title = `${SITE_NAME} | About`;
      description = 'Biography, exhibitions, and background information about Pavlo Kovach.';
    } else if (path === '/contact') {
      title = `${SITE_NAME} | Contact`;
      description = 'Contact details for Pavlo Kovach, including email, WhatsApp, and social links.';
    } else if (path === '/admin') {
      title = `${SITE_NAME} | Admin`;
      description = 'Administrative access for content management.';
      robots = 'noindex,nofollow';
    } else if (path.startsWith('/works/')) {
      const workId = path.split('/').pop();
      const work = works.find((item) => item.id === workId);

      if (work) {
        title = `${work.title} | ${SITE_NAME}`;
        description = work.description || `Artwork by ${work.author} on ${SITE_NAME}.`;
        image = work.media?.[0]?.url ?? defaultImage;
        ogType = 'article';
        canonicalPath = `/works/${work.id}`;
      }
    } else if (path.startsWith('/exhibition/')) {
      const exhibitionId = path.split('/').pop();
      const exhibition = exhibitions.find((item) => item.id === exhibitionId);

      if (exhibition) {
        title = `${exhibition.title} | ${SITE_NAME}`;
        description = exhibition.description || `Exhibition by ${exhibition.author} on ${SITE_NAME}.`;
        image = exhibition.photos?.[0]?.url ?? defaultImage;
        ogType = 'article';
      }
    }

    const canonicalUrl = new URL(canonicalPath, SITE_URL).toString();
    document.title = title;
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', robots);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    if (image) {
      upsertMeta('meta[property="og:image"]', 'property', 'og:image', image);
      upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    }

    upsertCanonical(canonicalUrl);
  }, [location.pathname, exhibitions, works]);

  return null;
};
