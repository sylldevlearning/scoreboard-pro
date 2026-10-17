import { useWindowDimensions } from "react-native";

export const HEADER_H = 44;

// Vertical space taken in landscape by everything that isn't the score:
// team name + info line, ad banner and the rotation button in the root layout.
const LANDSCAPE_CHROME_H = 150;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Orientation + score font size for the score screens. In landscape the score
 * sits next to the controls instead of above them, so it can use more height.
 */
export function useScoreLayout() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const scoreFont = isLandscape
    ? clamp(Math.min((height - HEADER_H - LANDSCAPE_CHROME_H) * 0.95, width * 0.13), 48, 150)
    : clamp(Math.min((height - HEADER_H) * 0.28, width * 0.25), 48, 120);

  return { width, height, isLandscape, isPortrait: !isLandscape, scoreFont };
}
