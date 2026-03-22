import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="VideoEdit"
        component={VideoComposition}
        durationInFrames={300} // 10s @ 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoUrl: '',
          clips: [],
          effects: [],
        }}
      />
    </>
  );
};
