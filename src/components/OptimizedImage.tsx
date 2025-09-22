import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  ImageStyle,
  ViewStyle,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../services/themeManager';
import { imageCacheManager } from '../utils/performanceOptimizations';

const { width: screenWidth } = Dimensions.get('window');

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: ImageStyle | ViewStyle;
  fallbackIcon?: string;
  fallbackIconSize?: number;
  showLoading?: boolean;
  loadingSize?: 'small' | 'large';
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  lazy?: boolean;
  threshold?: number;
  cache?: boolean;
  placeholder?: React.ReactElement;
  onLoad?: () => void;
  onError?: (error: any) => void;
  quality?: 'low' | 'medium' | 'high';
  progressive?: boolean;
  blurRadius?: number;
  borderRadius?: number;
  aspectRatio?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  fallbackIcon = 'image-outline',
  fallbackIconSize = 24,
  showLoading = true,
  loadingSize = 'small',
  resizeMode = 'cover',
  lazy = false,
  threshold = 100,
  cache = true,
  placeholder,
  onLoad,
  onError,
  quality = 'medium',
  progressive = true,
  blurRadius,
  borderRadius,
  aspectRatio,
}) => {
  const { currentTheme } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const containerRef = useRef<View>(null);

  // Get optimized image source
  const getOptimizedSource = useCallback(() => {
    if (typeof source === 'number') return source;
    
    let uri = source.uri;
    
    // Add quality parameters for external images
    if (uri.startsWith('http')) {
      const url = new URL(uri);
      
      // Add quality and format parameters based on the service
      if (url.hostname.includes('unsplash.com')) {
        url.searchParams.set('q', quality === 'low' ? '50' : quality === 'medium' ? '75' : '90');
        url.searchParams.set('fm', 'webp');
        url.searchParams.set('auto', 'format');
      } else if (url.hostname.includes('cloudinary.com')) {
        // Cloudinary optimization
        const parts = uri.split('/upload/');
        if (parts.length === 2) {
          const qualityMap = { low: 'q_50', medium: 'q_75', high: 'q_90' };
          uri = `${parts[0]}/upload/f_auto,${qualityMap[quality]}/${parts[1]}`;
        }
      }
      
      return { uri: url.toString() };
    }
    
    return { uri };
  }, [source, quality]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    onLoad?.();
  }, [fadeAnim, onLoad]);

  // Handle image error
  const handleError = useCallback((err: any) => {
    setLoading(false);
    setError(true);
    onError?.(err);
  }, [onError]);

  // Get image dimensions for aspect ratio
  useEffect(() => {
    if (typeof source === 'number' || !aspectRatio) return;
    
    Image.getSize(
      source.uri,
      (width, height) => {
        setImageDimensions({ width, height });
      },
      () => {
        // Failed to get dimensions, ignore
      }
    );
  }, [source, aspectRatio]);

  // Calculate container style with aspect ratio
  const containerStyle = React.useMemo(() => {
    const baseStyle: ViewStyle = {
      backgroundColor: currentTheme.colors.border,
      borderRadius,
      overflow: 'hidden',
      ...StyleSheet.flatten(style),
    };

    if (aspectRatio && imageDimensions) {
      const { width: imgWidth, height: imgHeight } = imageDimensions;
      const calculatedAspectRatio = imgWidth / imgHeight;
      
      if (calculatedAspectRatio !== aspectRatio) {
        baseStyle.aspectRatio = aspectRatio;
      }
    } else if (aspectRatio) {
      baseStyle.aspectRatio = aspectRatio;
    }

    return baseStyle;
  }, [style, borderRadius, currentTheme.colors.border, aspectRatio, imageDimensions]);

  // Lazy loading intersection observer effect
  useEffect(() => {
    if (!lazy || inView) return;

    const checkInView = () => {
      if (containerRef.current) {
        containerRef.current.measure((x, y, width, height, pageX, pageY) => {
          const isVisible = 
            pageY + height >= -threshold &&
            pageY <= screenWidth + threshold;
          
          if (isVisible && !inView) {
            setInView(true);
          }
        });
      }
    };

    const timer = setInterval(checkInView, 100);
    return () => clearInterval(timer);
  }, [lazy, inView, threshold]);

  // Render loading state
  const renderLoading = () => {
    if (!showLoading || !loading) return null;
    
    if (placeholder) return placeholder;
    
    return (
      <View style={[styles.centerContent, StyleSheet.absoluteFill]}>
        <ActivityIndicator 
          size={loadingSize} 
          color={currentTheme.colors.primary} 
        />
      </View>
    );
  };

  // Render error state
  const renderError = () => {
    if (!error) return null;
    
    return (
      <View style={[styles.centerContent, StyleSheet.absoluteFill]}>
        <Ionicons 
          name={fallbackIcon as any} 
          size={fallbackIconSize} 
          color={currentTheme.colors.textTertiary} 
        />
      </View>
    );
  };

  // Don't render image if lazy loading and not in view
  if (lazy && !inView) {
    return (
      <View ref={containerRef} style={containerStyle}>
        {renderLoading()}
      </View>
    );
  }

  return (
    <View ref={containerRef} style={containerStyle}>
      {inView && (
        <Animated.Image
          source={getOptimizedSource()}
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: fadeAnim,
              borderRadius,
            },
          ]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          blurRadius={blurRadius}
          progressiveRenderingEnabled={progressive}
          cache={cache ? 'force-cache' : 'reload'}
        />
      )}
      
      {renderLoading()}
      {renderError()}
    </View>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OptimizedImage;