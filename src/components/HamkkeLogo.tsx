import React from 'react';

// 함께하는 HR 로고 SVG 컴포넌트
const HamkkeLogo: React.FC<{ size?: number | string }> = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="함께하는 HR 로고"
  >
    <circle cx="36" cy="36" r="24" fill="#29EF96" />
    <circle cx="84" cy="36" r="24" fill="#29EF96" />
    <path d="M18 66c0-13.255 16.215-20.074 26.143-11.49l32.095 22.52c9.927 8.584 4.857 24.97-8.398 24.97H44.16c-13.255 0-18.16-16.386-8.16-25z" fill="#29EF96" />
    <path d="M102 66c0-13.255-16.215-20.074-26.143-11.49l-32.095 22.52c-9.927 8.584-4.857 24.97 8.398 24.97h23.68c13.255 0 18.16-16.386 8.16-25z" fill="#29EF96" />
  </svg>
);

export default HamkkeLogo;
