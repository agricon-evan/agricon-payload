import Image, { type ImageProps } from 'next/image'

interface MediaImageProps extends Omit<ImageProps, 'width' | 'height' | 'alt'> {
  alt: string
  width?: number
  height?: number
}

/**
 * Shared image primitive for catalog and editorial imagery.
 * Keeping sizing in one place prevents layout shift while preserving the
 * existing object-cover card layouts.
 */
export default function MediaImage({ alt, width = 1600, height = 1000, unoptimized: unoptimizedProp, ...props }: MediaImageProps) {
  const unoptimized = unoptimizedProp ?? (typeof props.src === 'string' && props.src.startsWith('/catalog/'))
  return <Image alt={alt} width={width} height={height} unoptimized={unoptimized} {...props} />
}
