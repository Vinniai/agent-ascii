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
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/pmezard/go-difflib/difflib"
)

const asciiArtTxtSuffix = "-ascii-art.txt"

// Legacy append format (older agent-ascii): parse last block if present.
const (
	legacySnapshotBeginPrefix = "---BEGIN agent-ascii "
	legacySnapshotBeginMid    = "---\n"
	legacySnapshotEndMarker   = "---END agent-ascii---\n"
)

var ansiEscapeReHistory = regexp.MustCompile(`\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07`)

func stripANSIFromSaved(s string) string {
	return ansiEscapeReHistory.ReplaceAllString(s, "")
}

func historyDotFileName(stem string) string {
	return "." + stem + "-ascii-art.history"
}

func unifiedDiffAgainstPrevious(prevPath, prevText, newText, stem string) (string, error) {
	left := stripANSIFromSaved(prevText)
	right := stripANSIFromSaved(newText)
	if left == right {
		return "", nil
	}
	from := "previous"
	if prevPath != "" {
		from = filepath.Base(prevPath)
	}
	ud := difflib.UnifiedDiff{
		A:        difflib.SplitLines(left),
		B:        difflib.SplitLines(right),
		FromFile: from,
		ToFile:   stem + "-ascii-art (new)",
		Context:  3,
	}
	return difflib.GetUnifiedDiffString(ud)
}

// legacyLastSnapshotFromHistory returns the body of the last block in an old append-only history file.
func legacyLastSnapshotFromHistory(data string) (string, bool) {
	lastEnd := strings.LastIndex(data, legacySnapshotEndMarker)
	if lastEnd < 0 {
		return "", false
	}
	block := data[:lastEnd]
	lastBegin := strings.LastIndex(block, legacySnapshotBeginPrefix)
	if lastBegin < 0 {
		return "", false
	}
	afterPrefix := block[lastBegin+len(legacySnapshotBeginPrefix):]
	headerClose := strings.Index(afterPrefix, legacySnapshotBeginMid)
	if headerClose < 0 {
		return "", false
	}
	content := afterPrefix[headerClose+len(legacySnapshotBeginMid):]
	return strings.TrimSuffix(content, "\n"), true
}

// readSnapshotFromHistoryFile interprets a dotfile: current format is plain text (one prior run);
// older installs may still have appended BEGIN/END blocks — take the last block if present.
func readSnapshotFromHistoryFile(data string) (string, bool) {
	if strings.Contains(data, legacySnapshotBeginPrefix) {
		if snap, ok := legacyLastSnapshotFromHistory(data); ok {
			return snap, true
		}
	}
	if data == "" {
		return "", false
	}
	return strings.TrimSuffix(data, "\n"), true
}

// writeHistorySnapshot overwrites the per-stem dotfile with the previous snapshot (same name each run).
func writeHistorySnapshot(dir, stem, prevText string) error {
	path := filepath.Join(dir, historyDotFileName(stem))
	return os.WriteFile(path, []byte(prevText), 0o600)
}

// findPreviousHistoryContent locates the most recent prior snapshot for the same stem:
// *-ascii-art-latest.txt, then legacy numbered *-ascii-art-<id>.txt, then legacy *-ascii-art.txt,
// then the dotfile (plain text or legacy append format).
func findPreviousHistoryContent(dir, stem string) (prevPath string, prevText string, ok bool) {
	latest := filepath.Join(dir, stem+"-ascii-art-latest.txt")
	if b, err := os.ReadFile(latest); err == nil {
		return latest, string(b), true
	}

	var bestID int64 = -1
	var bestPath string
	prefix := stem + "-ascii-art-"
	suffix := ".txt"

	entries, err := os.ReadDir(dir)
	if err == nil {
		for _, e := range entries {
			if e.IsDir() {
				continue
			}
			name := e.Name()
			if !strings.HasPrefix(name, prefix) || !strings.HasSuffix(name, suffix) {
				continue
			}
			if name == stem+"-ascii-art-latest.txt" {
				continue
			}
			mid := strings.TrimPrefix(name, prefix)
			mid = strings.TrimSuffix(mid, suffix)
			if mid == "" || mid == "latest" {
				continue
			}
			id, err := strconv.ParseInt(mid, 10, 64)
			if err != nil {
				continue
			}
			if id > bestID {
				bestID = id
				bestPath = filepath.Join(dir, name)
			}
		}
	}

	if bestPath != "" {
		b, err := os.ReadFile(bestPath)
		if err == nil {
			return bestPath, string(b), true
		}
	}

	legacy := filepath.Join(dir, stem+asciiArtTxtSuffix)
	if b, err := os.ReadFile(legacy); err == nil {
		return legacy, string(b), true
	}

	histPath := filepath.Join(dir, historyDotFileName(stem))
	if b, err := os.ReadFile(histPath); err == nil {
		if snap, ok := readSnapshotFromHistoryFile(string(b)); ok {
			return histPath, snap, true
		}
	}

	return "", "", false
}

func saveAsciiArtWithHistory(savePath, saveFileName string, onlySave bool, content string) error {
	stem := strings.TrimSuffix(saveFileName, asciiArtTxtSuffix)
	if stem == saveFileName {
		return fmt.Errorf("unexpected save file name %q", saveFileName)
	}

	dir := filepath.Clean(savePath)
	latestName := stem + "-ascii-art-latest.txt"

	prevPath, prevText, hadPrev := findPreviousHistoryContent(dir, stem)

	if hadPrev {
		diffOut, err := unifiedDiffAgainstPrevious(prevPath, prevText, content, stem)
		if err != nil {
			return err
		}
		if diffOut != "" {
			if diffVsLast {
				fmt.Fprintf(os.Stderr, "%s", diffOut)
			}
			if diffLastFail {
				return ErrDiffLastChanged
			}
		}
	}

	if hadPrev {
		if err := writeHistorySnapshot(dir, stem, prevText); err != nil {
			return err
		}
	}

	latestPath := filepath.Join(dir, latestName)
	if err := os.WriteFile(latestPath, []byte(content), 0o666); err != nil {
		return err
	}

	if onlySave {
		fmt.Println("Saved " + latestPath)
		if hadPrev {
			fmt.Println("Wrote prior snapshot (overwrite) to " + filepath.Join(dir, historyDotFileName(stem)))
		}
	}
	return nil
}
