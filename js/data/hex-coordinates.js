// Hex Coordinate Mapping
// This file maps hex identifiers to pixel positions on the gameboard image.
// Coordinates are percentages (0-100) to work with any image size.
// 
// To populate this mapping:
// 1. Open "Game board and more assets.pptx" to see the hex numbering
// 2. For each hex on the gameboard, determine its center position
// 3. Convert pixel positions to percentages based on the gameboard image dimensions
// 4. Add entries in the format: "HEX_ID": { x: percentage, y: percentage }
//
// Example:
// If hex "A1" is at pixel position (150, 200) on a 1000x800 image:
// "A1": { x: 15, y: 25 }  // (150/1000)*100 = 15, (200/800)*100 = 25

export const HEX_COORDINATES = {
  // TODO: Populate with actual hex coordinates from "Game board and more assets.pptx"
  // Format: "HEX_ID": { x: percentage (0-100), y: percentage (0-100) }
  "A1": { x: 10.63, y: 86.29 },
  "A2": { x: 28.40, y: 85.34 },
  "A3": { x: 45.64, y: 83.91 },
  "A4": { x: 63.41, y: 85.10 },
  "A5": { x: 80.66, y: 85.34 },
  "B1": { x: 20.21, y: 61.23 },
  "B2": { x: 36.76, y: 62.19 },
  "B3": { x: 54.36, y: 62.19 },
  "B4": { x: 72.47, y: 61.71 },
  "B5": { x: 90.07, y: 62.66 },
  "C1": { x: 10.45, y: 39.99 },
  "C2": { x: 28.05, y: 39.28 },
  "C3": { x: 45.64, y: 40.95 },
  "C4": { x: 63.07, y: 41.90 },
  "C5": { x: 80.84, y: 40.71 },
  "D1": { x: 19.34, y: 18.99 },
  "D2": { x: 37.11, y: 18.27 },
  "D3": { x: 54.53, y: 17.80 },
  "D4": { x: 72.47, y: 18.99 },
  "D5": { x: 89.02, y: 18.51 }
};
