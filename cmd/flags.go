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

package cmd

import "github.com/Vinniai/agent-ascii/aic_package"

func buildFlags() aic_package.Flags {
	return aic_package.Flags{
		Complex:             complex,
		Dimensions:          dimensions,
		Width:               width,
		Height:              height,
		SaveTxtPath:         saveTxtPath,
		SaveTxtHistory:      saveTxtHistory,
		DiffVsLast:          diffVsLast,
		DiffLastFail:        diffLastFail,
		SaveImagePath:       saveImagePath,
		SaveGifPath:         saveGifPath,
		Negative:            negative,
		Colored:             colored,
		CharBackgroundColor: colorBg,
		Grayscale:           grayscale,
		CustomMap:           customMap,
		FlipX:               flipX,
		FlipY:               flipY,
		Full:                full,
		FontFilePath:        fontFile,
		FontColor:           [3]int{fontColor[0], fontColor[1], fontColor[2]},
		SaveBackgroundColor: [4]int{saveBgColor[0], saveBgColor[1], saveBgColor[2], saveBgColor[3]},
		Braille:             braille,
		Threshold:           threshold,
		Dither:              dither,
		Layout:              layout,
		OnlySave:            onlySave,
	}
}

// buildFlagsForDiff returns flags for Convert() with save-related options cleared so diff
// never writes files or suppresses stdout.
func buildFlagsForDiff() aic_package.Flags {
	f := buildFlags()
	f.SaveTxtPath = ""
	f.SaveTxtHistory = false
	f.DiffVsLast = false
	f.DiffLastFail = false
	f.SaveImagePath = ""
	f.SaveGifPath = ""
	f.OnlySave = false
	return f
}
