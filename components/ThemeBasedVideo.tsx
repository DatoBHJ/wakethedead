import React from 'react';

const ThemeBasedVideo = () => {
  const videoSource = '/videos/grey_mars_c_blue_1920.mp4';

  // const [showDescription, setShowDescription] = useState(false);

  // const handleClick = () => {
  //   setShowDescription(!showDescription);
  // };

  return (
    <div className='flex relative justify-center sm:block'>
      <div 
        className="border-none relative"
        // onClick={handleClick}
      >
        <video 
          preload="none"
          autoPlay 
          loop  
          muted 
          playsInline
          className="w-full h-full object-cover rounded-full non-selectable"
        >
          <source src={videoSource} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* {showDescription && (
          <div className="absolute inset-0 bg-black bg-opacity-70 rounded-full flex items-center justify-center p-4">
            <p className="text-white text-center text-xs pb-10">
              Paste your link, generate handwritten-style notes
              Learn and explore with shared content via chat!<br/>🌍🤖<br/>
              Share knowledge in seconds - paste a link or click links from chat responses!<br/><br/>
              Join our quick, fun learning revolution! 🚀📚
            </p>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ThemeBasedVideo;