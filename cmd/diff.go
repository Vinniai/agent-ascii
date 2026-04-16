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
	"fmt"
	"os"
	"regexp"

	"github.com/Vinniai/agent-ascii/aic_package"
	"github.com/pmezard/go-difflib/difflib"
	"github.com/spf13/cobra"
)

var diffAsText bool

// Matches common SGR and similar escape sequences used for terminal colors (including truecolor).
var ansiEscapeRe = regexp.MustCompile(`\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07`)

func stripANSI(s string) string {
	return ansiEscapeRe.ReplaceAllString(s, "")
}

func runDiff(args []string) int {
	if formatsTrue {
		fmt.Fprintf(os.Stderr, "Error: --formats is not supported with diff\n\n")
		return 2
	}

	if checkInputAndFlagsEx(args, validationOpts{
		allowMultipleGifs:  true,
		allowGifWithNonGif: true,
		ignoreOnlySave:     true,
	}) {
		return 2
	}

	var left, right string
	var err error

	if diffAsText {
		var bL, bR []byte
		bL, err = os.ReadFile(args[0])
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading left file: %v\n", err)
			return 2
		}
		bR, err = os.ReadFile(args[1])
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading right file: %v\n", err)
			return 2
		}
		left = string(bL)
		right = string(bR)
	} else {
		flags := buildFlagsForDiff()
		left, err = aic_package.Convert(args[0], flags)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error converting left: %v\n", err)
			return 2
		}
		right, err = aic_package.Convert(args[1], flags)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error converting right: %v\n", err)
			return 2
		}
	}

	leftStrip := stripANSI(left)
	rightStrip := stripANSI(right)

	if left != right && leftStrip == rightStrip {
		fmt.Fprintf(os.Stderr, "agent-ascii: outputs differ only in terminal styling (ANSI color codes); stripped text is identical\n")
	}

	if leftStrip == rightStrip {
		return 0
	}

	ud := difflib.UnifiedDiff{
		A:        difflib.SplitLines(leftStrip),
		B:        difflib.SplitLines(rightStrip),
		FromFile: "left",
		ToFile:   "right",
		Context:  3,
	}
	out, err := difflib.GetUnifiedDiffString(ud)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error building diff: %v\n", err)
		return 2
	}
	fmt.Print(out)
	return 1
}

var diffCmd = &cobra.Command{
	Use:   "diff <left> <right>",
	Short: "Unified diff of two ASCII outputs (convert two inputs, or compare two text files with --text)",
	Long: `Compare two rendered ASCII results using a unified diff (like git diff).

Without --text, each argument is passed to the same conversion path as the main command
(save flags are ignored). With --text, both arguments are read as UTF-8 text files.

Escape sequences are stripped before diffing so ANSI colors do not overwhelm the comparison.
If raw outputs differ but stripped text matches, a notice is printed to stderr.

Exit codes: 0 same (after stripping ANSI), 1 different, 2 error.`,
	Args: cobra.ExactArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		os.Exit(runDiff(args))
	},
}

func init() {
	diffCmd.Flags().BoolVar(&diffAsText, "text", false, "Read both operands as UTF-8 text files instead of converting images")
	rootCmd.AddCommand(diffCmd)
}
