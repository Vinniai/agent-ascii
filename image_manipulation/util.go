/*
Copyright © 2021 Zoraiz Hassan <hzoraiz8@gmail.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package image_conversions

import (
	"fmt"
	"image"
	"image/color"
	"math"
	"sort"

	"github.com/Vinniai/agent-ascii/aic_package/winsize"
	"github.com/disintegration/imaging"
	gookitColor "github.com/gookit/color"
	"github.com/makeworld-the-better-one/dither/v2"
)

type LayoutHints struct {
	PreferDither   bool
	PreferNegative bool
	Profile        string
}

func ditherImage(img image.Image) image.Image {

	palette := []color.Color{
		color.Black,
		color.White,
	}

	d := dither.NewDitherer(palette)
	d.Matrix = dither.FloydSteinberg

	return d.DitherCopy(img)
}

func optimizeForLayout(img image.Image) (image.Image, LayoutHints) {
	bounds := img.Bounds()
	luminance := make([][]float64, bounds.Dy())
	allValues := make([]float64, 0, bounds.Dx()*bounds.Dy())

	meanLum := 0.0
	brightPixels := 0

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		row := make([]float64, bounds.Dx())
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			grayPixel := color.GrayModel.Convert(img.At(x, y))
			grayColor := grayPixel.(color.Gray)
			value := float64(grayColor.Y)
			row[x-bounds.Min.X] = value
			allValues = append(allValues, value)
			meanLum += value
			if value >= 232 {
				brightPixels++
			}
		}
		luminance[y-bounds.Min.Y] = row
	}

	meanLum = meanLum / float64(len(allValues))
	brightRatio := float64(brightPixels) / float64(len(allValues))
	brightDominant := meanLum >= 185 || brightRatio >= 0.65

	lowLum, highLum := percentileRange(allValues, brightDominant)
	rangeLum := highLum - lowLum
	if rangeLum < 1 {
		rangeLum = 1
	}

	normalizedLuminance := make([][]float64, bounds.Dy())
	for y := 0; y < bounds.Dy(); y++ {
		row := make([]float64, bounds.Dx())
		for x := 0; x < bounds.Dx(); x++ {
			center := luminance[y][x]
			if center < lowLum {
				center = lowLum
			}
			if center > highLum {
				center = highLum
			}
			row[x] = ((center - lowLum) / rangeLum) * 255
		}
		normalizedLuminance[y] = row
	}

	edgePixels := 0
	for y := 0; y < bounds.Dy(); y++ {
		for x := 0; x < bounds.Dx(); x++ {
			if gradientStrength(normalizedLuminance, x, y) >= 24 {
				edgePixels++
			}
		}
	}
	edgeRatio := float64(edgePixels) / float64(bounds.Dx()*bounds.Dy())

	profile := "content"
	if brightDominant && edgeRatio < 0.12 {
		profile = "skeleton"
	}

	normalizedImage := image.NewGray(bounds)
	for y := 0; y < bounds.Dy(); y++ {
		for x := 0; x < bounds.Dx(); x++ {
			normalizedImage.SetGray(bounds.Min.X+x, bounds.Min.Y+y, color.Gray{
				Y: uint8(normalizedLuminance[y][x]),
			})
		}
	}

	blurRadius := 2.4
	occupancyRadius := 1
	edgeWeight := 1.35
	detailWeight := 1.45
	blockWeight := 0.40
	darknessWeight := 0.28
	signalFloor := 18.0
	preferDither := !brightDominant
	preferNegative := brightDominant

	if profile == "skeleton" {
		blurRadius = 3.2
		occupancyRadius = 1
		edgeWeight = 1.45
		detailWeight = 1.35
		blockWeight = 0.08
		darknessWeight = 0.04
		signalFloor = 42
		preferDither = false
		preferNegative = true
	} else if brightDominant {
		blurRadius = 2.6
		occupancyRadius = 1
		edgeWeight = 1.45
		detailWeight = 1.55
		blockWeight = 0.34
		darknessWeight = 0.18
		signalFloor = 24
		preferDither = false
		preferNegative = true
	}

	blurredImage := imaging.Blur(normalizedImage, blurRadius)
	output := image.NewGray(bounds)

	for y := 0; y < bounds.Dy(); y++ {
		for x := 0; x < bounds.Dx(); x++ {
			center := normalizedLuminance[y][x]
			darkness := 255 - center
			blurred := sampleImageGray(blurredImage, x, y)
			darkDetail := math.Max(0, blurred-center)
			edgeStrength := gradientStrength(normalizedLuminance, x, y)
			blockSignal := neighborhoodDarkness(normalizedLuminance, x, y, occupancyRadius)

			layoutSignal := math.Max(edgeStrength*edgeWeight, darkDetail*detailWeight)
			layoutSignal = math.Max(layoutSignal, blockSignal*blockWeight)
			layoutSignal = math.Max(layoutSignal, darkness*darknessWeight)
			if profile == "skeleton" && center > 220 {
				layoutSignal = math.Max(layoutSignal, edgeStrength*1.85)
				if edgeStrength < 26 {
					layoutSignal *= 0.72
				}
			}
			if layoutSignal < signalFloor {
				layoutSignal = 0
			}
			if layoutSignal > 255 {
				layoutSignal = 255
			}

			output.SetGray(bounds.Min.X+x, bounds.Min.Y+y, color.Gray{
				Y: uint8(255 - layoutSignal),
			})
		}
	}

	return output, LayoutHints{
		PreferDither:   preferDither,
		PreferNegative: preferNegative,
		Profile:        profile,
	}
}

func sampleLuminance(luminance [][]float64, x, y int) float64 {
	if y < 0 {
		y = 0
	}
	if x < 0 {
		x = 0
	}
	if y >= len(luminance) {
		y = len(luminance) - 1
	}
	if x >= len(luminance[y]) {
		x = len(luminance[y]) - 1
	}
	return luminance[y][x]
}

func percentileRange(values []float64, brightDominant bool) (float64, float64) {
	sorted := append([]float64(nil), values...)
	sort.Float64s(sorted)

	lowIndex := int(float64(len(sorted)-1) * 0.05)
	highIndex := int(float64(len(sorted)-1) * 0.95)
	if brightDominant {
		lowIndex = int(float64(len(sorted)-1) * 0.10)
		highIndex = int(float64(len(sorted)-1) * 0.98)
	}

	low := sorted[lowIndex]
	high := sorted[highIndex]
	if high <= low {
		return sorted[0], sorted[len(sorted)-1]
	}
	return low, high
}

func sampleImageGray(img image.Image, x, y int) float64 {
	bounds := img.Bounds()
	if x < 0 {
		x = 0
	}
	if y < 0 {
		y = 0
	}
	if x >= bounds.Dx() {
		x = bounds.Dx() - 1
	}
	if y >= bounds.Dy() {
		y = bounds.Dy() - 1
	}
	grayPixel := color.GrayModel.Convert(img.At(bounds.Min.X+x, bounds.Min.Y+y))
	return float64(grayPixel.(color.Gray).Y)
}

func neighborhoodDarkness(normalized [][]float64, x, y, radius int) float64 {
	total := 0.0
	count := 0.0
	for dy := -radius; dy <= radius; dy++ {
		for dx := -radius; dx <= radius; dx++ {
			total += 255 - sampleLuminance(normalized, x+dx, y+dy)
			count++
		}
	}
	if count == 0 {
		return 0
	}
	return total / count
}

func gradientStrength(normalized [][]float64, x, y int) float64 {
	gx := -sampleLuminance(normalized, x-1, y-1) + sampleLuminance(normalized, x+1, y-1) -
		2*sampleLuminance(normalized, x-1, y) + 2*sampleLuminance(normalized, x+1, y) -
		sampleLuminance(normalized, x-1, y+1) + sampleLuminance(normalized, x+1, y+1)
	gy := sampleLuminance(normalized, x-1, y-1) + 2*sampleLuminance(normalized, x, y-1) + sampleLuminance(normalized, x+1, y-1) -
		sampleLuminance(normalized, x-1, y+1) - 2*sampleLuminance(normalized, x, y+1) - sampleLuminance(normalized, x+1, y+1)
	strength := math.Sqrt(gx*gx + gy*gy)
	if strength > 255 {
		return 255
	}
	return strength
}

func resizeImage(img image.Image, full, isBraille bool, dimensions []int, width, height int, layout bool) (image.Image, error) {

	var asciiWidth, asciiHeight int
	var smallImg image.Image

	imgWidth := float64(img.Bounds().Dx())
	imgHeight := float64(img.Bounds().Dy())
	aspectRatio := imgWidth / imgHeight

	if full {
		terminalWidth, _, err := winsize.GetTerminalSize()
		if err != nil {
			return nil, err
		}

		asciiWidth = terminalWidth - 1
		asciiHeight = int(float64(asciiWidth) / aspectRatio)
		asciiHeight = int(0.5 * float64(asciiHeight))

	} else if (width != 0 || height != 0) && len(dimensions) == 0 {
		// If either width or height is set and dimensions aren't given

		if width != 0 && height == 0 {
			// If width is set and height is not set, use width to calculate aspect ratio

			asciiWidth = width
			asciiHeight = int(float64(asciiWidth) / aspectRatio)
			asciiHeight = int(0.5 * float64(asciiHeight))

			if asciiHeight == 0 {
				asciiHeight = 1
			}

		} else if height != 0 && width == 0 {
			// If height is set and width is not set, use height to calculate aspect ratio

			asciiHeight = height
			asciiWidth = int(float64(asciiHeight) * aspectRatio)
			asciiWidth = int(2 * float64(asciiWidth))

			if asciiWidth == 0 {
				asciiWidth = 1
			}

		} else {
			return nil, fmt.Errorf("error: both width and height can't be set. Use dimensions instead")
		}

	} else if len(dimensions) == 0 {
		// This condition calculates aspect ratio according to terminal height

		if layout {
			switch {
			case aspectRatio <= 0.74:
				asciiWidth = 60
			case aspectRatio <= 1.1:
				asciiWidth = 80
			default:
				asciiWidth = 96
			}
			asciiHeight = int(float64(asciiWidth) / aspectRatio)
			asciiHeight = int(0.5 * float64(asciiHeight))

			if asciiHeight == 0 {
				asciiHeight = 1
			}
		} else {
			terminalWidth, terminalHeight, err := winsize.GetTerminalSize()
			if err != nil {
				return nil, err
			}

			asciiHeight = terminalHeight - 1
			asciiWidth = int(float64(asciiHeight) * aspectRatio)
			asciiWidth = int(2 * float64(asciiWidth))

			// If ascii width exceeds terminal width, change ratio with respect to terminal width
			if asciiWidth >= terminalWidth {
				asciiWidth = terminalWidth - 1
				asciiHeight = int(float64(asciiWidth) / aspectRatio)
				asciiHeight = int(0.5 * float64(asciiHeight))
			}
		}

	} else {
		// Else, set passed dimensions

		asciiWidth = dimensions[0]
		asciiHeight = dimensions[1]
	}

	// Because one braille character has 8 dots (4 rows and 2 columns)
	if isBraille {
		asciiWidth *= 2
		asciiHeight *= 4
	}
	smallImg = imaging.Resize(img, asciiWidth, asciiHeight, imaging.Lanczos)

	return smallImg, nil
}

func reverse(imgSet [][]AsciiPixel, flipX, flipY bool) [][]AsciiPixel {

	if flipX {
		for _, row := range imgSet {
			for i, j := 0, len(row)-1; i < j; i, j = i+1, j-1 {
				row[i], row[j] = row[j], row[i]
			}
		}
	}

	if flipY {
		for i, j := 0, len(imgSet)-1; i < j; i, j = i+1, j-1 {
			imgSet[i], imgSet[j] = imgSet[j], imgSet[i]
		}
	}

	return imgSet
}

var termColorLevel string = gookitColor.TermColorLevel().String()

// This functions calculates terminal color level between rgb colors and 256-colors
// and returns the character with escape codes appropriately
func getColoredCharForTerm(r, g, b uint8, char string, background bool) (string, error) {
	var coloredChar string

	if termColorLevel == "millions" {
		colorRenderer := gookitColor.RGB(uint8(r), uint8(g), uint8(b), background)
		coloredChar = colorRenderer.Sprintf("%v", char)

	} else if termColorLevel == "hundreds" {
		colorRenderer := gookitColor.RGB(uint8(r), uint8(g), uint8(b), background).C256()
		coloredChar = colorRenderer.Sprintf("%v", char)

	} else {
		return "", fmt.Errorf("your terminal supports neither 24-bit nor 8-bit colors. Other coloring options aren't available")
	}

	return coloredChar, nil
}
