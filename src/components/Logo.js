import React from 'react';
import logoSvg from '../assets/logo.svg';

const Logo = ({ className = "w-8 h-8", ...props }) => {
  return (
    <img 
      src={logoSvg}
      alt="StartLinker Logo"
      className={className}
      {...props}
    />
  );
};

export default Logo;