// types/svg.d.ts (or src/types/svg.d.ts)
declare module '*.svg' {
  import * as React from 'react';
    import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
