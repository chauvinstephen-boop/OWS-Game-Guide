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
  //
  // Example entries (replace with actual coordinates):
  // "A1": { x: 10, y: 15 },
  // "A2": { x: 10, y: 25 },
  // "B1": { x: 20, y: 15 },
  // "B2": { x: 20, y: 25 },
};
