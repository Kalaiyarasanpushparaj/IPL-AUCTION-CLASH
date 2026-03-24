import type { SVGProps } from 'react';

export const CricketBallIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 12a4.5 4.5 0 0 0-4.5-4.5" />
    <path d="M12 12a4.5 4.5 0 0 1-4.5 4.5" />
    <path d="M12 12a4.5 4.5 0 0 0 4.5 4.5" />
    <path d="M12 12a4.5 4.5 0 0 1 4.5-4.5" />
    <path d="M2.5 9.5l4 2.5" />
    <path d="M17.5 12l4-2.5" />
    <path d="M6.5 14.5l-4 2.5" />
    <path d="M21.5 9.5l-4 2.5" />
  </svg>
);
