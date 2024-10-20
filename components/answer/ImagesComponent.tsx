import { useState } from 'react';
import { IconPlus, IconClose, IconChevronUpDown } from '@/components/ui/icons';
import { performWebSearch, performImageSearch, performVideoSearch } from '@/app/tools/Providers';

interface Image {
    link: string;
    alt?: string;
}

interface ImagesComponentProps {
    images: Image[];
}

const ImagesComponent: React.FC<ImagesComponentProps> = ({ images }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [visibleImages, setVisibleImages] = useState(3);
    const [expandedVisibleImages, setExpandedVisibleImages] = useState(9);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const ImagesSkeleton = () => (
        <>
            {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="aspect-square w-full">
                    <div className="w-full h-full bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
            ))}
        </>
    );

    const handleImageClick = (link: string) => {
        setSelectedImage(link);
    };

    const handleCloseModal = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            setSelectedImage(null);
        }
    };

    const handleExpand = () => {
        setIsExpanded(!isExpanded);
        if (!isExpanded) {
            setVisibleImages(expandedVisibleImages);
        } else {
            setVisibleImages(3);
        }
    };

    const handleShowMore = () => {
        const newVisibleImages = Math.min(visibleImages + 9, images.length);
        setVisibleImages(newVisibleImages);
        setExpandedVisibleImages(newVisibleImages);
    };

    return (
        <div className="bg-card-foreground/[3%] dark:bg-card-foreground/5 shadow-lg rounded-lg p-4 mt-4">
            <div className="flex items-center mb-4">
                <h2 className="text-lg font-semibold flex-grow text-black  dark:text-gray-400">Images</h2>
                <div className="flex justify-center ml-2">
                    <button
                        className="text-black  dark:text-gray-400 focus:outline-none"
                        onClick={handleExpand}>
                        {isExpanded ? <IconClose className="w-6 h-6" /> : <IconChevronUpDown className="w-6 h-6" />}
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {images.length === 0 ? (
                    <ImagesSkeleton />
                ) : (
                    images.slice(0, visibleImages).map((image, index) => (
                        <div
                            key={index}
                            className="aspect-square w-full transition ease-in-out hover:scale-105 duration-200 cursor-pointer"
                            onClick={() => handleImageClick(image.link)}
                        >
                            <div className="w-full h-full overflow-hidden">
                                <img
                                    src={image.link}
                                    alt={image.alt || `Image ${index}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isExpanded && visibleImages < images.length && (
                <div className="flex justify-center mt-4">
                    <button
                        className="py-2 text-center text-xs sm:text-sm text-gray-400 dark:text-gray-400"
                        onClick={handleShowMore}
                    >
                        Show More
                    </button>
                </div>
            )}

{selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
                    onClick={handleCloseModal}
                >
                    <div className="max-w-5xl max-h-full relative">
                        <img src={selectedImage} alt="Full size" className="max-w-full max-h-full" />
                        <button
                            className="absolute top-4 right-4 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 focus:outline-none"
                            onClick={() => setSelectedImage(null)}
                        >
                            <IconClose className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImagesComponent;