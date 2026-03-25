import React from 'react';
import { AboutData } from '../../types';
import { MetadataLabel } from '../Shared/SharedUI';

export const AboutPage = ({ data }: { data: AboutData }) => (
  <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mt-4">
      <div className="md:col-span-4">
        <img src={data.photo} alt="Pavlo Kovach" loading="lazy" className="w-full grayscale border border-black p-1 mb-3" />
        <div className="border-t border-black pt-3">
          <MetadataLabel label="Born" value={data.birthDate} />
          <p className="text-[11px] font-bold uppercase mt-3 text-gray-400">Education</p>
          <p className="text-xs uppercase font-medium">Uzhhorod College of Arts</p>
          <p className="text-xs uppercase font-medium">Lviv National Academy of Arts</p>
        </div>
      </div>
      <div className="md:col-span-8">
        <div className="text-lg md:text-xl text-black leading-relaxed space-y-6 whitespace-pre-wrap font-medium border-b border-black pb-12 mb-12">
          {data.text}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-6 tracking-widest">/ Solo Exhibitions</h3>
            <ul className="space-y-3">
              {data.soloExhibitions.map((item, idx) => (
                <li key={idx} className="text-xs uppercase leading-tight font-medium border-l-2 border-[#b20000] pl-4 py-1">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-6 tracking-widest">/ Group Exhibitions</h3>
            <ul className="space-y-3">
              {data.groupExhibitions.map((item, idx) => (
                <li key={idx} className="text-xs uppercase leading-tight font-medium border-l-2 border-black pl-4 py-1">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);
