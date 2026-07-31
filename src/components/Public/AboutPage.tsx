import React from 'react';
import { AboutData } from '../../types';
import { MetadataLabel } from '../Shared/SharedUI';

export const AboutPage = ({ data }: { data: AboutData }) => (
  <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mt-4">
      <div className="md:col-span-4">
        {data.photo ? (
          <img src={data.photo} alt="Pavlo Kovach" loading="lazy" className="w-full grayscale mb-3" />
        ) : (
          <div className="w-full aspect-[4/5] bg-gray-50 border border-gray-200 mb-3 flex items-center justify-center text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">
            Portrait Coming Soon
          </div>
        )}
        <div className="border-t border-black pt-3">
          {data.birthDate && <MetadataLabel label="Born" value={data.birthDate} />}
        </div>
      </div>
      <div className="md:col-span-8">
        <h1 className="sr-only">About Pavlo Kovach</h1>
        <div className="text-lg md:text-xl text-black leading-relaxed space-y-6 whitespace-pre-wrap font-medium border-b border-black pb-12 mb-12">
          {data.text || 'Biography and exhibition history will be published soon.'}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold uppercase mb-6">/ Solo Exhibitions</h2>
            {data.soloExhibitions.length > 0 ? (
              <ul className="space-y-3">
                {data.soloExhibitions.map((item, idx) => (
                  <li key={idx} className="text-xs uppercase leading-tight font-medium border-l-2 border-[#b20000] pl-4 py-1">{item.replace(/-/g, '—')}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs uppercase text-gray-400 font-medium">No solo exhibitions published yet.</p>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold uppercase mb-6">/ Group Exhibitions</h2>
            {data.groupExhibitions.length > 0 ? (
              <ul className="space-y-3">
                {data.groupExhibitions.map((item, idx) => (
                  <li key={idx} className="text-xs uppercase leading-tight font-medium border-l-2 border-black pl-4 py-1">{item.replace(/-/g, '—')}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs uppercase text-gray-400 font-medium">No group exhibitions published yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
