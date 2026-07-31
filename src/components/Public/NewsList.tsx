import React from 'react';
import { NewsItem } from '../../types';
import { formatDate } from '../../utils/formatDate';

const isExternalUrl = (value: string) => /^https?:\/\//i.test(value.trim());

export const NewsList = ({ items }: { items: NewsItem[] }) => (
  <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-12">
    <h1 className="sr-only">News and press about Pavlo Kovach</h1>
    <div className="space-y-16">
      {[...items].sort((a, b) => {
          const dateA = a.date.split('.').reverse().join('-');
          const dateB = b.date.split('.').reverse().join('-');
          return dateB.localeCompare(dateA);
      }).map((item) => {
        const hasExternalUrl = isExternalUrl(item.url);
        const content = (
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 aspect-video overflow-hidden bg-gray-100">
              <img src={item.photo} alt={item.title} loading="lazy" className={`w-full h-full object-cover transition-all duration-500 ${hasExternalUrl ? 'grayscale group-hover:grayscale-0' : 'grayscale'}`} />
            </div>
            <div className="w-full md:w-2/3 border-t border-black pt-4">
              <div className="text-[10px] uppercase font-bold text-black mb-2">/ {formatDate(item.date)}</div>
              <h2 className={`text-3xl font-bold underline-offset-8 ${hasExternalUrl ? 'group-hover:underline' : ''}`}>{item.title}</h2>
              <div className="mt-4 text-[11px] uppercase tracking-widest text-gray-500">
                {hasExternalUrl ? 'External Link →' : 'Link unavailable'}
              </div>
            </div>
          </div>
        );

        if (!hasExternalUrl) {
          return <div key={item.id}>{content}</div>;
        }

        return (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="block group">
            {content}
          </a>
        );
      })}
    </div>
  </div>
);
