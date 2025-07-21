import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

interface SlideData {
  id: number;
  url: string;
  title: string;
  description: string;
  category: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    url: "https://images.pexels.com/photos/33085586/pexels-photo-33085586.jpeg",
    title: "Winter Serenity",
    description: "A picturesque winter sunset over snowy mountains and a serene lake, capturing nature's tranquil beauty.",
    category: "Nature"
  },
  {
    id: 2,
    url: "https://images.pexels.com/photos/33090358/pexels-photo-33090358.jpeg",
    title: "Urban Twilight",
    description: "Scenic view of a river ferry and an illuminated bridge in a vibrant cityscape at dusk.",
    category: "Urban"
  },
  {
    id: 3,
    url: "https://images.pexels.com/photos/33077852/pexels-photo-33077852.jpeg",
    title: "Coastal Paradise",
    description: "Crystal clear waters and pristine beaches create the perfect tropical escape.",
    category: "Travel"
  },
  {
    id: 4,
    url: "https://images.pexels.com/photos/33092349/pexels-photo-33092349.png",
    title: "Forest Depths",
    description: "Deep into the emerald embrace of ancient evergreen forests.",
    category: "Nature"
  },
  {
    id: 5,
    url: "https://images.pexels.com/photos/785744/pexels-photo-785744.jpeg",
    title: "Desert Dreams",
    description: "Traveler admiring Morocco's striking sand dunes under golden sunlight.",
    category: "Adventure"
  }
];

export default function ImageSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Image Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105"
            }`}
          >
            <img
              src={slide.url}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-end">
              <div className="p-4 sm:p-6 md:p-8 lg:p-16 max-w-4xl w-full">
                <div
                  className={`transform transition-all duration-1000 delay-300 ${
                    index === currentSlide
                      ? "translate-y-0 opacity-100"
                      : "translate-y-12 opacity-0"
                  }`}
                >
                  <span className="inline-block px-2 py-1 sm:px-3 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm font-medium rounded-full mb-2 sm:mb-4">
                    {slide.category}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-4 leading-tight">
                    {slide.title}
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-4 sm:mb-6 md:mb-8 max-w-2xl leading-relaxed">
                    {slide.description}
                  </p>
                  <button className="bg-white text-black px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold hover:bg-white/90 transition-colors duration-300">
                    Explore More
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <button
          onClick={goToPrevious}
          className="ml-2 sm:ml-4 md:ml-6 p-2 sm:p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-300 hover:scale-110"
        >
          <ChevronLeft size={20} className="sm:hidden" />
          <ChevronLeft size={24} className="hidden sm:block" />
        </button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={goToNext}
          className="mr-2 sm:mr-4 md:mr-6 p-2 sm:p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-300 hover:scale-110"
        >
          <ChevronRight size={20} className="sm:hidden" />
          <ChevronRight size={24} className="hidden sm:block" />
        </button>
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-4">
        <button
          onClick={togglePlayPause}
          className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-300"
        >
          {isPlaying ? (
            <>
              <Pause size={16} className="sm:hidden" />
              <Pause size={20} className="hidden sm:block" />
            </>
          ) : (
            <>
              <Play size={16} className="sm:hidden" />
              <Play size={20} className="hidden sm:block" />
            </>
          )}
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 sm:gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 sm:w-12 bg-white"
                  : "w-1.5 sm:w-2 bg-white/50 hover:bg-white/70"
              }`}
            >
              {index === currentSlide && isPlaying && (
                <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div
          className={`h-full bg-white transition-all duration-300 ${
            isPlaying ? "animate-pulse" : ""
          }`}
          style={{
            width: `${((currentSlide + 1) / slides.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
