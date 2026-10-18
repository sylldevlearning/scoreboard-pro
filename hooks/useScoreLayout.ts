import { createContext, useContext } from "react";
import { useWindowDimensions } from "react-native";

export const HEADER_H = 44;

// Vertical space taken in landscape by everything that isn't the score:
// team name + info line, eraser and the line under the score.
const LANDSCAPE_CHROME_H = 150;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Size of the area the screens are rendered in, measured by the root layout.
 * It excludes the ad banner, which the window dimensions don't.
 */
export const ContentSizeContext = createContext<{ width: number; height: number } | null>(null);

/**
 * Orientation + score font size for the score screens. In landscape the score
 * sits next to the controls instead of above them, so it can use more height.
 */
export function useScoreLayout() {
  const window = useWindowDimensions();
  const content = useContext(ContentSizeContext);
  const isLandscape = window.width > window.height;
  // The measured size lags one layout behind a rotation: ignore it until it
  // matches the new orientation.
  const { width, height } =
    content && content.width > 0 && (content.width > content.height) === isLandscape
      ? content
      : window;

  const scoreFont = isLandscape
    ? clamp(Math.min((height - HEADER_H - LANDSCAPE_CHROME_H) * 0.95, width * 0.13), 48, 150)
    : clamp(Math.min((height - HEADER_H) * 0.28, width * 0.25), 48, 120);

  return { width, height, isLandscape, isPortrait: !isLandscape, scoreFont };
}
