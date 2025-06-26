import React, { useState, useCallback, useEffect } from 'react';
import './ImageWithFallback.css';

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  placeholderSrc?: string;
  className?: string;
  loading?: boolean;
  onError?: () => void;
  onLoad?: () => void;
  style?: React.CSSProperties;
  aspectRatio?: '1:1' | '4:3' | '16:9' | 'auto';
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  placeholderSrc,
  className = '',
  loading = false,
  onError,
  onLoad,
  style,
  aspectRatio = '1:1'
}) => {
  const [imageError, setImageError] = useState(false);
  // Only show loading for explicit loading prop or when there's no real image
  const [imageLoading, setImageLoading] = useState(false);

  const shouldShowPlaceholder = !src || src === 'USE_PLACEHOLDER' || imageError;

  // Reset states when src changes
  useEffect(() => {
    setImageError(false);
    // Only set loading for explicit loading prop
    setImageLoading(loading);
  }, [src, loading]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    if (onLoad) onLoad();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
    if (onError) onError();
  }, [onError]);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '1:1': return 'aspect-square';
      case '4:3': return 'aspect-4-3';
      case '16:9': return 'aspect-16-9';
      default: return 'aspect-auto';
    }
  };

  // Generate a simple gradient based on the alt text for visual variety
  const generatePlaceholderGradient = (text: string) => {
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const hue = Math.abs(hash) % 60 + 30; // Keep hues in earth tones (30-90)
    return `linear-gradient(135deg, hsl(${hue}, 20%, 85%) 0%, hsl(${hue}, 25%, 75%) 50%, hsl(${hue}, 30%, 65%) 100%)`;
  };

  // Get appropriate icon and text based on product type
  const getPlaceholderContent = (alt: string) => {
    const lowerAlt = alt.toLowerCase();
    
    if (lowerAlt.includes('ceramic') || lowerAlt.includes('pottery') || lowerAlt.includes('bowl') || lowerAlt.includes('vase')) {
      return { icon: '🏺', text: 'Ceramic Art' };
    } else if (lowerAlt.includes('textile') || lowerAlt.includes('fabric') || lowerAlt.includes('weaving')) {
      return { icon: '🧶', text: 'Textile Art' };
    } else if (lowerAlt.includes('wood') || lowerAlt.includes('carving')) {
      return { icon: '🪵', text: 'Wood Craft' };
    } else if (lowerAlt.includes('jewelry') || lowerAlt.includes('silver') || lowerAlt.includes('gold')) {
      return { icon: '💎', text: 'Fine Jewelry' };
    } else if (lowerAlt.includes('leather')) {
      return { icon: '👜', text: 'Leather Craft' };
    } else if (lowerAlt.includes('metal') || lowerAlt.includes('bronze') || lowerAlt.includes('copper')) {
      return { icon: '⚒️', text: 'Metalwork' };
    } else {
      return { icon: '🎨', text: 'Artisan Craft' };
    }
  };

  if (shouldShowPlaceholder) {
    return (
      <div 
        className={`image-placeholder ${getAspectRatioClass()} ${className}`}
        style={{
          ...style,
          background: generatePlaceholderGradient(alt)
        }}
        role="img"
        aria-label={alt}
      >
        {loading || imageLoading ? (
          <div className="placeholder-loading">
            <div className="shimmer-animation"></div>
          </div>
        ) : (
          <div className="placeholder-content">
            <div className="placeholder-icon">{getPlaceholderContent(alt).icon}</div>
            <span className="placeholder-text">{getPlaceholderContent(alt).text}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`image-container ${getAspectRatioClass()} ${className}`} style={style}>
      {loading && (
        <div className="image-loading-overlay">
          <div className="shimmer-animation"></div>
        </div>
      )}
      <img
        src={placeholderSrc && imageError ? placeholderSrc : src}
        alt={alt}
        className={`fallback-image ${imageLoading ? 'loading' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

export default ImageWithFallback; 