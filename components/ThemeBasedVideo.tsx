import React from 'react';

const ThemeBasedVideo = () => {
  const videoSource = '/videos/grey_mars_c_blue_1920.mp4';

  return (
    <div className="fixed inset-0 w-full h-full -z-10">
      <div className="absolute inset-0 bg-black/30" /> {/* Optional overlay for better contrast */}
      <video 
        preload="none"
        autoPlay 
        loop  
        muted 
        playsInline
        className="w-full h-full object-cover"
      >
        <source src={videoSource} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default ThemeBasedVideo;