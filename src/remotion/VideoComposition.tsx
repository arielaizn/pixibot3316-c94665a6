import { AbsoluteFill, Video, useCurrentFrame, interpolate } from 'remotion';

interface Clip {
  id: string;
  start: number;
  duration: number;
  videoUrl: string;
  transform?: {
    x?: number;
    y?: number;
    scale?: number;
    rotate?: number;
  };
  effects?: {
    filters?: {
      blur?: number;
      brightness?: number;
      contrast?: number;
      saturate?: number;
    };
    transition?: {
      type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'zoomIn';
      duration: number;
    };
  };
}

interface Props {
  videoUrl: string;
  clips: Clip[];
  effects: any[];
}

export const VideoComposition: React.FC<Props> = ({ videoUrl, clips }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className="bg-black">
      {clips.map((clip) => {
        const isVisible = frame >= clip.start && frame < clip.start + clip.duration;
        if (!isVisible) return null;

        const clipFrame = frame - clip.start;
        const transform = clip.transform || {};
        const effects = clip.effects || {};
        const filters = effects.filters || {};
        const transition = effects.transition;

        // Apply transitions
        let opacity = 1;
        let transitionScale = 1;
        let transitionX = 0;

        if (transition) {
          const { type, duration } = transition;

          if (type === 'fadeIn' && clipFrame < duration) {
            opacity = interpolate(clipFrame, [0, duration], [0, 1]);
          }

          if (type === 'fadeOut' && clipFrame > clip.duration - duration) {
            opacity = interpolate(clipFrame, [clip.duration - duration, clip.duration], [1, 0]);
          }

          if (type === 'zoomIn' && clipFrame < duration) {
            transitionScale = interpolate(clipFrame, [0, duration], [0.5, 1]);
          }

          if (type === 'slideIn' && clipFrame < duration) {
            transitionX = interpolate(clipFrame, [0, duration], [-1920, 0]);
          }
        }

        // Build filter string
        const filterString = `
          blur(${filters.blur || 0}px)
          brightness(${filters.brightness || 100}%)
          contrast(${filters.contrast || 100}%)
          saturate(${filters.saturate || 100}%)
        `.trim();

        const style: React.CSSProperties = {
          transform: `
            translate(${(transform.x || 0) + transitionX}px, ${transform.y || 0}px)
            scale(${(transform.scale || 1) * transitionScale})
            rotate(${transform.rotate || 0}deg)
          `,
          opacity,
          filter: filterString !== 'blur(0px) brightness(100%) contrast(100%) saturate(100%)' ? filterString : undefined,
        };

        return (
          <AbsoluteFill key={clip.id} style={style}>
            <Video
              src={clip.videoUrl}
              startFrom={Math.max(0, clipFrame)}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
