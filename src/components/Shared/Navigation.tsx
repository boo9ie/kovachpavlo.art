import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const NAV_ITEMS = [
  { name: 'Home', path: '/' },
  { name: 'Publications', path: '/publications' },
  { name: 'Works', path: '/works' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' }
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="sticky top-0 bg-white z-50 border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 uppercase text-[11px] font-bold tracking-widest">
          <Link 
            to="/" 
            className="w-full md:w-auto mb-4 md:mb-0 text-2xl md:text-xl font-bold text-black uppercase mr-auto tracking-normal block md:inline-block"
          >
            PAVLO KOVACH
          </Link>
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`${location.pathname === item.path ? 'underline decoration-2 underline-offset-4' : ''} ${item.color || 'hover:text-gray-500'}`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};
