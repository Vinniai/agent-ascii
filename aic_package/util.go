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

package aic_package

import (
	"fmt"
	"image"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
	"strings"

	imgManip "github.com/Vinniai/agent-ascii/image_manipulation"
)

func saveAsciiArt(asciiSet [][]imgManip.AsciiChar, imagePath, savePath, urlImgName string, onlySave bool) error {
	// To make sure uncolored ascii art is the one saved as .txt
	saveAscii := flattenAscii(asciiSet, false, true)

	saveFileName, err := createSaveFileName(imagePath, urlImgName, "-ascii-art.txt")
	if err != nil {
		return err
	}

	savePathLastChar := string(savePath[len(savePath)-1])

	// Check if path is closed with appropriate path separator (depending on OS)
	if savePathLastChar != string(os.PathSeparator) {
		savePath += string(os.PathSeparator)
	}

	// If path exists
	if _, err := os.Stat(savePath); os.IsNotExist(err) {
		return fmt.Errorf("save path %v does not exist", savePath)
	}

	content := strings.Join(saveAscii, "\n")
	if saveTxtHistory {
		dir := filepath.Clean(strings.TrimRight(savePath, string(os.PathSeparator)))
		return saveAsciiArtWithHistory(dir, saveFileName, onlySave, content)
	}

	if err = os.WriteFile(savePath+saveFileName, []byte(content), 0o666); err != nil {
		return err
	}
	if onlySave {
		fmt.Println("Saved " + savePath + saveFileName)
	}
	return nil
}

// Returns new image file name along with extension
func createSaveFileName(imagePath, urlImgName, label string) (string, error) {
	if urlImgName != "" {
		currExt := path.Ext(urlImgName)
		newName := urlImgName[:len(urlImgName)-len(currExt)] // e.g. Grabs myImage from myImage.jpeg

		return newName + label, nil
	}

	if imagePath == "-" {
		if inputIsGif {
			return "piped-gif" + label, nil
		}
		return "piped-img" + label, nil
	}

	fileInfo, err := os.Stat(imagePath)
	if err != nil {
		return "", err
	}

	currName := fileInfo.Name()
	currExt := path.Ext(currName)
	newName := currName[:len(currName)-len(currExt)] // e.g. Grabs myImage from myImage.jpeg

	return newName + label, nil
}

// flattenAscii flattens a two-dimensional grid of ascii characters into a one dimension
// of lines of ascii
func flattenAscii(asciiSet [][]imgManip.AsciiChar, colored, toSaveTxt bool) []string {
	var ascii []string

	for _, line := range asciiSet {
		var tempAscii string

		for _, char := range line {
			if toSaveTxt {
				tempAscii += char.Simple
				continue
			}

			if colored {
				tempAscii += char.OriginalColor
			} else if fontColor != [3]int{255, 255, 255} {
				tempAscii += char.SetColor
			} else {
				tempAscii += char.Simple
			}
		}

		ascii = append(ascii, tempAscii)
	}

	return ascii
}

// Returns path with the file name concatenated to it
func getFullSavePath(imageName, saveFilePath string) (string, error) {
	savePathLastChar := string(saveFilePath[len(saveFilePath)-1])

	// Check if path is closed with appropriate path separator (depending on OS)
	if savePathLastChar != string(os.PathSeparator) {
		saveFilePath += string(os.PathSeparator)
	}

	// If path exists
	if _, err := os.Stat(saveFilePath); !os.IsNotExist(err) {
		return saveFilePath + imageName, nil
	} else {
		return "", err
	}
}

func isURL(urlString string) bool {
	if len(urlString) < 8 {
		return false
	} else if urlString[:7] == "http://" || urlString[:8] == "https://" {
		return true
	}
	return false
}

// Following is for clearing screen when showing gif
var clear map[string]func()

func init() {
	clear = make(map[string]func())
	clear["linux"] = func() {
		cmd := exec.Command("clear")
		cmd.Stdout = os.Stdout
		cmd.Run()
	}
	clear["windows"] = func() {
		cmd := exec.Command("cmd", "/c", "cls")
		cmd.Stdout = os.Stdout
		cmd.Run()
	}
	clear["darwin"] = clear["linux"]
}

func clearScreen() {
	value, ok := clear[runtime.GOOS]
	if ok {
		value()
	} else {
		fmt.Println("Error: your platform is unsupported, terminal can't be cleared")
		os.Exit(0)
	}
}

func isInputFromPipe() bool {
	fileInfo, _ := os.Stdin.Stat()
	return fileInfo.Mode()&os.ModeCharDevice == 0
}

func shouldUseLayoutAutoWidth() bool {
	return layout && len(dimensions) == 0 && width == 0 && height == 0 && !full
}

func getLayoutAutoWidth(img image.Image) int {
	aspectRatio := float64(img.Bounds().Dx()) / float64(img.Bounds().Dy())

	switch {
	case aspectRatio >= 1.6:
		return 120
	case aspectRatio >= 1.15:
		return 96
	case aspectRatio <= 0.75:
		return 64
	default:
		return 80
	}
}
