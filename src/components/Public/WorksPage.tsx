import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatDate';
import { WorkItem } from '../../types';
import { MediaPreview, ExpandableText } from '../Shared/SharedUI';

export const WorksPage = ({ items }: { items: WorkItem[] }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-8">
        {items.map((item) => (
          <Link 
            key={item.id} 
            to={`/work/${item.id}`}
            className="flex flex-col group"
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="aspect-square bg-gray-50 mb-6 border border-gray-200 overflow-hidden relative shadow-sm">
              <MediaPreview 
                item={(item.media || [])[0]} 
                isHovered={hoveredId === item.id} 
              />
            </div>
            <div className="border-t border-black pt-4">
               <div className="flex justify-between items-start">
                 <h3 className="text-xl font-bold leading-tight group-hover:text-[#b20000] transition-colors">{item.title}</h3>
                 <span className="text-xs font-bold text-black">{formatDate(item.date)}</span>
               </div>
               <ExpandableText 
                  text={item.description} 
                  limit={90} 
                  className="text-xs text-gray-700 mt-4 leading-relaxed" 
               />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
