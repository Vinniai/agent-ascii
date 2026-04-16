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

import (
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/Vinniai/agent-ascii/aic_package"
	"github.com/Vinniai/agent-ascii/internal/version"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	// Flags
	cfgFile        string
	complex        bool
	dimensions     []int
	width          int
	height         int
	saveTxtPath    string
	saveTxtHistory bool
	diffVsLast     bool
	diffLastFail   bool
	saveImagePath  string
	saveGifPath    string
	negative       bool
	formatsTrue    bool
	colored        bool
	colorBg        bool
	grayscale      bool
	customMap      string
	flipX          bool
	flipY          bool
	full           bool
	fontFile       string
	fontColor      []int
	saveBgColor    []int
	braille        bool
	threshold      int
	dither         bool
	layout         bool
	onlySave       bool

	// Root commands
	rootCmd = &cobra.Command{
		Use:     "agent-ascii [image paths/urls or piped stdin]",
		Short:   "Converts images and gifs into ascii art",
		Version: version.Version,
		Long:    "This tool converts images into ascii art and prints them on the terminal.\nFurther configuration can be managed with flags.",

		// Required so positional image paths still work after registering subcommands (e.g. diff).
		Args: cobra.ArbitraryArgs,

		// Not RunE since help text is getting larger and seeing it for every error impacts user experience
		Run: func(cmd *cobra.Command, args []string) {

			if checkInputAndFlags(args) {
				return
			}

			flags := buildFlags()

			if args[0] == "-" {
				if err := printAscii(args[0], flags); err != nil {
					if errors.Is(err, aic_package.ErrDiffLastChanged) {
						os.Exit(1)
					}
				}
				return
			}

			for _, imagePath := range args {
				if err := printAscii(imagePath, flags); err != nil {
					if errors.Is(err, aic_package.ErrDiffLastChanged) {
						os.Exit(1)
					}
					return
				}
			}
		},
	}
)

func printAscii(imagePath string, flags aic_package.Flags) error {

	asciiArt, err := aic_package.Convert(imagePath, flags)
	if err != nil {
		if errors.Is(err, aic_package.ErrDiffLastChanged) {
			return err
		}
		fmt.Printf("Error: %v\n", err)

		// Because this error will then be thrown for every image path/url passed
		// if save path is invalid
		if strings.HasPrefix(err.Error(), "can't save file") {
			fmt.Println()
			return err
		}
		return err
	}
	fmt.Printf("%s", asciiArt)
	if !onlySave {
		fmt.Println()
	}
	return nil
}

// Cobra configuration from here on

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.PersistentFlags().SortFlags = false
	rootCmd.Flags().SortFlags = false

	// rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.agent-ascii.yaml)")
	rootCmd.PersistentFlags().BoolVarP(&colored, "color", "C", false, "Display ascii art in original colors")
	rootCmd.PersistentFlags().BoolVar(&colorBg, "color-bg", false, "Use colors on character background instead of foreground")
	rootCmd.PersistentFlags().IntSliceVarP(&dimensions, "dimensions", "d", nil, "Set width and height in characters (e.g., 60,30)")
	rootCmd.PersistentFlags().IntVarP(&width, "width", "W", 0, "Set width in characters, maintains aspect ratio")
	rootCmd.PersistentFlags().IntVarP(&height, "height", "H", 0, "Set height in characters, maintains aspect ratio")
	rootCmd.PersistentFlags().StringVarP(&customMap, "map", "m", "", "Custom ASCII characters from darkest to lightest (e.g., \" .-+#@\")")
	rootCmd.PersistentFlags().BoolVarP(&braille, "braille", "b", false, "Use braille characters instead of ASCII")
	rootCmd.PersistentFlags().IntVar(&threshold, "threshold", 128, "Threshold for braille conversion (0-255, default: 128)")
	rootCmd.PersistentFlags().BoolVarP(&dither, "dither", "D", true, "Apply dithering for braille conversion (no-op without --braille; use --dither=false to disable)")
	rootCmd.PersistentFlags().BoolVar(&layout, "layout", false, "Optimize for UI/webpage layout inspection")
	rootCmd.PersistentFlags().BoolVarP(&grayscale, "grayscale", "g", false, "Convert to grayscale")
	rootCmd.PersistentFlags().BoolVarP(&complex, "complex", "c", false, "Use extended ASCII character range for higher quality")
	rootCmd.PersistentFlags().BoolVarP(&full, "full", "f", false, "Use maximum terminal width")
	rootCmd.PersistentFlags().BoolVarP(&negative, "negative", "n", false, "Invert colors")
	rootCmd.PersistentFlags().BoolVarP(&flipX, "flipX", "x", false, "Flip horizontally")
	rootCmd.PersistentFlags().BoolVarP(&flipY, "flipY", "y", false, "Flip vertically")
	rootCmd.PersistentFlags().StringVarP(&saveImagePath, "save-img", "s", "", "Save as PNG image (e.g., . for current directory)")
	rootCmd.PersistentFlags().StringVar(&saveTxtPath, "save-txt", "", "Save as text file")
	ci := os.Getenv("CI") != ""
	rootCmd.PersistentFlags().BoolVar(&saveTxtHistory, "save-txt-history", ci, "With --save-txt, keep timestamped snapshots and *-ascii-art-latest.txt (default on when CI is set)")
	rootCmd.PersistentFlags().BoolVar(&diffVsLast, "diff-vs-last", false, "With --save-txt-history, print unified diff vs previous snapshot to stderr")
	rootCmd.PersistentFlags().BoolVar(&diffLastFail, "diff-last-fail", false, "With --diff-vs-last, exit 1 when the diff is non-empty")
	rootCmd.PersistentFlags().StringVar(&saveGifPath, "save-gif", "", "Save GIF as ASCII art GIF")
	rootCmd.PersistentFlags().IntSliceVar(&saveBgColor, "save-bg", []int{0, 0, 0, 100}, "Background color for saved images (RGBA)")
	rootCmd.PersistentFlags().StringVar(&fontFile, "font", "", "Font file path for saved images (.ttf)")
	rootCmd.PersistentFlags().IntSliceVar(&fontColor, "font-color", []int{255, 255, 255}, "Font color for output (RGB)")
	rootCmd.PersistentFlags().BoolVar(&onlySave, "only-save", false, "Skip terminal output when saving files")
	rootCmd.PersistentFlags().BoolVar(&formatsTrue, "formats", false, "Show supported image formats")

	rootCmd.PersistentFlags().BoolP("help", "h", false, "Help for "+rootCmd.Name()+"\n")
	rootCmd.PersistentFlags().BoolP("version", "v", false, "Version for "+rootCmd.Name())

	rootCmd.SetVersionTemplate("{{printf \"v%s\" .Version}}\n")

	defaultUsageTemplate := rootCmd.UsageTemplate()
	rootCmd.SetUsageTemplate(defaultUsageTemplate + "\nCopyright © 2021 Zoraiz Hassan <hzoraiz8@gmail.com>\n" +
		"Distributed under the Apache License Version 2.0 (Apache-2.0)\n" +
		"For further details, visit https://github.com/Vinniai/agent-ascii\n")
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Find home directory.
		home, err := os.UserHomeDir()
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}

		// Search config in home directory with name ".agent-ascii" (without extension).
		viper.AddConfigPath(home)
		viper.SetConfigName(".agent-ascii")
	}

	viper.AutomaticEnv() // read in environment variables that match

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err == nil {
		fmt.Println("Using config file:", viper.ConfigFileUsed())
	}
}
