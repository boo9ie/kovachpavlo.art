import React from 'react';
import { Link } from 'react-router-dom';
import { ExhibitionItem } from '../../types';
import { MediaPreview, MetadataLabel, ExpandableText } from '../Shared/SharedUI';
import { formatDate } from '../../utils/formatDate';

export const Home = ({ items }: { items: ExhibitionItem[] }) => {
  const sortedItems = [...items].sort((a, b) => {
    const dateA = a.date.split('.').reverse().join('-');
    const dateB = b.date.split('.').reverse().join('-');
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      {/* The design carries no visible page title, but every page needs exactly
          one h1 — and it must match public/_prerender.php. */}
      <h1 className="sr-only">Pavlo Kovach — exhibitions by the Ukrainian artist and curator</h1>
      <div className="space-y-32">
        {sortedItems.map((item) => (
          <div key={item.id} className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-gray-100 pb-24 last:border-0 last:pb-0">
            <div className="lg:col-span-8">
              <Link to={`/exhibition/${item.id}`} className="block group overflow-hidden bg-gray-100 border border-gray-200 relative aspect-[16/10]">
                <MediaPreview item={(item.photos || [])[0]} isHovered={false} disableMonochrome />
              </Link>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-end">
              <div className="border-t-2 border-black pt-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <MetadataLabel label="Date" value={formatDate(item.date)} />
                  <MetadataLabel label="Location" value={item.location} />
                </div>
              </div>
              <Link to={`/exhibition/${item.id}`} className="group inline-block">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-none tracking-normal group-hover:text-[#b20000] transition-colors">
                  {item.title}
                </h2>
              </Link>
              <ExpandableText text={item.description} limit={160} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
