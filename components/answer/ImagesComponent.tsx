import { useState } from 'react';
import { IconPlus, IconClose, IconChevronUpDown } from '@/components/ui/icons';

interface Image {
    link: string;
    alt?: string;
}

interface ImagesComponentProps {
    images: Image[];
}

const ImagesComponent: React.FC<ImagesComponentProps> = ({ images }) => {
    const [showMore, setShowMore] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const ImagesSkeleton = () => (
        <>
            {Array.from({ length: showMore ? 9 : 3 }).map((_, index) => (
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

    return (
        <div className="bg-card-foreground/[3%] dark:bg-card-foreground/5 shadow-lg rounded-lg p-4 mt-4">
            <div className="flex items-center mb-4">
                <h2 className="text-lg font-semibold flex-grow text-black dark:text-white">Images</h2>
                {images.length > 3 && (
                    <div className="flex justify-center ml-2">
                        <button
                            className="text-black dark:text-white focus:outline-none"
                            onClick={() => setShowMore(!showMore)}>
                            {showMore ? <IconClose className="w-6 h-6" /> : <IconChevronUpDown className="w-6 h-6" />}
                        </button>
                    </div>
                )}
            </div>
            <div className={`grid grid-cols-3 gap-4 transition-all duration-500 ${showMore ? 'max-h-[1000px]' : 'max-h-[400px]'} overflow-hidden`}>
                {images.length === 0 ? (
                    <ImagesSkeleton />
                ) : (
                    images.slice(0, showMore ? 9 : 3).map((image, index) => (
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

            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
                    onClick={handleCloseModal}
                >
                    <div className="max-w-5xl max-h-full">
                        <img src={selectedImage} alt="Full size" className="max-w-full max-h-full" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImagesComponent;