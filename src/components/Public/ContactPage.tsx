import React from 'react';
import { ContactData } from '../../types';

export const ContactPage = ({ data }: { data: ContactData }) => (
  <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 h-[70vh] flex items-center justify-center">
    <div className="w-full max-w-lg border border-gray-200 p-12 md:p-16 shadow-sm bg-white relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-black group-hover:bg-[#b20000] transition-colors duration-500"></div>
      
      <div className="mb-12">
        <h2 className="text-2xl font-bold tracking-tighter uppercase mb-1">Pavlo Kovach</h2>
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Artist / Curator</p>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Electronic Mail</span>
          <a 
            href={`mailto:${data.email}`} 
            className="text-base md:text-lg font-medium hover:text-[#b20000] transition-colors duration-300 lowercase"
          >
            {data.email}
          </a>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Mobile / WhatsApp</span>
          <a 
            href={`tel:${data.whatsapp}`} 
            className="text-base md:text-lg font-medium hover:text-[#b20000] transition-colors duration-300"
          >
            {data.whatsapp}
          </a>
        </div>
      </div>
      
      <div className="mt-16 pt-8 border-t border-gray-100 flex justify-end items-end">
        <div className="text-[8px] uppercase font-bold text-gray-300 tracking-tighter">Lviv, Ukraine</div>
      </div>
    </div>
  </div>
);
