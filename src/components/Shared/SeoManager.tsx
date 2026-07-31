import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ExhibitionItem, WorkItem } from '../../types';

const SITE_NAME = 'PAVLOKOVACH.ART';
const SITE_URL = 'https://pavlokovach.art';
const ARTIST_NAME = 'Pavlo Kovach';
const DEFAULT_DESCRIPTION = 'Portfolio of Pavlo Kovach, a Ukrainian artist and curator documenting memory, public space, and contemporary art practice.';

/**
 * Titles, descriptions and canonicals must match what public/index.php renders
 * server-side. If they drift, Google's rendered snapshot disagrees with the raw
 * HTML and the canonical signals get muddy.
 */

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

const absoluteUrl = (value?: string) => {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, SITE_URL).toString();
};

const summarize = (text: string, limit = 155) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  const cut = normalized.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—-]+$/, '')}…`;
};

const STATIC_ROUTES = new Set(['/', '/exhibitions', '/news', '/works', '/about', '/contact', '/admin']);

export const SeoManager = ({
  exhibitions,
  works,
  forceNoindex = false
}: {
  exhibitions: ExhibitionItem[];
  works: WorkItem[];
  forceNoindex?: boolean;
}) => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    const defaultImage = exhibitions.find((item) => item.photos?.[0]?.url)?.photos?.[0]?.url;

    let title = `${ARTIST_NAME} — Ukrainian Artist and Curator | ${SITE_NAME}`;
    let description = DEFAULT_DESCRIPTION;
    let robots = 'index,follow';
    let ogType = 'website';
    let image = defaultImage;
    let canonicalPath = path;

    if (path === '/' || path === '/exhibitions') {
      description = 'Selected exhibitions, installations, and documentation from the practice of Pavlo Kovach, Ukrainian artist and curator.';
      // Both paths render the same component with the same content — collapse
      // them onto one canonical instead of competing as duplicates.
      canonicalPath = '/';
    } else if (path === '/news') {
      title = `News — ${ARTIST_NAME} | ${SITE_NAME}`;
      description = 'Recent announcements, exhibitions, and press features about the artist Pavlo Kovach.';
    } else if (path === '/works') {
      title = `Works — ${ARTIST_NAME} | ${SITE_NAME}`;
      description = 'Artworks, installations, and moving-image projects by Pavlo Kovach.';
      image = works.find((item) => item.media?.[0]?.url)?.media?.[0]?.url ?? defaultImage;
    } else if (path === '/about') {
      title = `About — ${ARTIST_NAME} | ${SITE_NAME}`;
      description = 'Biography, exhibition history, and background of the Ukrainian artist and curator Pavlo Kovach.';
    } else if (path === '/contact') {
      title = `Contact — ${ARTIST_NAME} | ${SITE_NAME}`;
      description = 'Contact details for the artist Pavlo Kovach — email, WhatsApp, and social links.';
    } else if (path === '/admin') {
      title = `${SITE_NAME} | Admin`;
      description = 'Administrative access for content management.';
      robots = 'noindex,nofollow';
    } else if (path.startsWith('/works/')) {
      const work = works.find((item) => item.id === path.split('/').pop());

      if (work) {
        title = `${work.title} — ${ARTIST_NAME} | ${SITE_NAME}`;
        description = summarize(work.description || `Artwork by ${work.author || ARTIST_NAME}.`);
        image = work.media?.[0]?.url ?? defaultImage;
        ogType = 'article';
      } else {
        robots = 'noindex,follow';
        title = `Not found | ${SITE_NAME}`;
      }
    } else if (path.startsWith('/exhibition/')) {
      const exhibition = exhibitions.find((item) => item.id === path.split('/').pop());

      if (exhibition) {
        title = `${exhibition.title} — ${ARTIST_NAME} | ${SITE_NAME}`;
        description = summarize(exhibition.description || `Exhibition by ${exhibition.author || ARTIST_NAME}.`);
        image = exhibition.photos?.[0]?.url ?? defaultImage;
        ogType = 'article';
      } else {
        robots = 'noindex,follow';
        title = `Not found | ${SITE_NAME}`;
      }
    } else if (!STATIC_ROUTES.has(path)) {
      robots = 'noindex,follow';
      title = `Not found | ${SITE_NAME}`;
    }

    if (forceNoindex) {
      robots = 'noindex,follow';
    }

    const canonicalUrl = new URL(canonicalPath, SITE_URL).toString();
    const absoluteImage = absoluteUrl(image);

    document.title = title;
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', robots);
    upsertMeta('meta[name="author"]', 'name', 'author', ARTIST_NAME);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', 'en_US');
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', absoluteImage ? 'summary_large_image' : 'summary');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    if (absoluteImage) {
      upsertMeta('meta[property="og:image"]', 'property', 'og:image', absoluteImage);
      upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', absoluteImage);
    }

    upsertCanonical(canonicalUrl);
  }, [location.pathname, exhibitions, works, forceNoindex]);

  return null;
};
