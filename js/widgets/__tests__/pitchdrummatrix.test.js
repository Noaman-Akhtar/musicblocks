/**
 * MusicBlocks v3.6.2
 *
 * @author Lakshay
 *
 * @copyright 2026 Lakshay
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const PitchDrumMatrix = require("../pitchdrummatrix.js");
const ManagedTimer = require("../../utils/ManagedTimer.js");

// --- Global Mocks ---
global._ = msg => msg;
global.platformColor = {
    labelColor: "#90c100",
    selectorBackground: "#f0f0f0",
    selectorBackgroundHOVER: "#e0e0e0"
};
global.docById = jest.fn(() => ({
    style: {},
    innerHTML: "",
    insertRow: jest.fn(() => ({
        insertCell: jest.fn(() => ({
            style: {},
            innerHTML: "",
            setAttribute: jest.fn(),
            addEventListener: jest.fn(),
            appendChild: jest.fn()
        })),
        setAttribute: jest.fn(),
        style: {}
    })),
    appendChild: jest.fn(),
    setAttribute: jest.fn()
}));
global.getNote = jest.fn(() => ["C", "", 4]);
global.getDrumName = jest.fn(() => null);
global.getDrumIcon = jest.fn(() => "icon.svg");
global.getDrumSynthName = jest.fn(() => "kick");
global.normalizeNoteAccidentals = note => note;
global.MATRIXSOLFEHEIGHT = 30;
global.MATRIXSOLFEWIDTH = 80;
global.SOLFEGECONVERSIONTABLE = {};
global.Singer = {
    defaultBPMFactor: 0.5,
    RhythmActions: { getNoteValue: jest.fn(() => 0.25) }
};
global.ManagedTimer = ManagedTimer;

global.window = {
    innerWidth: 1200,
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            addButton: jest.fn().mockReturnValue({ onclick: null }),
            getWidgetBody: jest.fn().mockReturnValue({
                append: jest.fn(),
                appendChild: jest.fn(),
                style: {}
            }),
            sendToCenter: jest.fn(),
            onclose: null,
            onmaximize: null,
            destroy: jest.fn()
        })
    }
};

global.document = {
    createElement: jest.fn(() => ({
        style: {},
        innerHTML: "",
        appendChild: jest.fn(),
        append: jest.fn(),
        setAttribute: jest.fn(),
        addEventListener: jest.fn()
    }))
};

describe("PitchDrumMatrix Widget", () => {
    let pdm;

    beforeEach(() => {
        jest.useFakeTimers();
        pdm = new PitchDrumMatrix();
    });

    afterEach(() => {
        if (pdm) {
            pdm._clearPlaybackTimers();
            pdm._clearWidgetTimers();
        }
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    // --- Constructor Tests ---
    describe("constructor", () => {
        test("should initialize with empty rowLabels", () => {
            expect(pdm.rowLabels).toEqual([]);
        });

        test("should initialize with empty rowArgs", () => {
            expect(pdm.rowArgs).toEqual([]);
        });

        test("should initialize with empty drums", () => {
            expect(pdm.drums).toEqual([]);
        });

        test("should initialize _rests to 0", () => {
            expect(pdm._rests).toBe(0);
        });

        test("should initialize _playing to false", () => {
            expect(pdm._playing).toBe(false);
        });

        test("should initialize empty _rowBlocks", () => {
            expect(pdm._rowBlocks).toEqual([]);
        });

        test("should initialize empty _colBlocks", () => {
            expect(pdm._colBlocks).toEqual([]);
        });

        test("should initialize empty _blockMap", () => {
            expect(pdm._blockMap).toEqual([]);
        });
    });

    // --- Static Constants Tests ---
    describe("static constants", () => {
        test("should have correct BUTTONDIVWIDTH", () => {
            expect(PitchDrumMatrix.BUTTONDIVWIDTH).toBe(295);
        });

        test("should have correct DRUMNAMEWIDTH", () => {
            expect(PitchDrumMatrix.DRUMNAMEWIDTH).toBe(50);
        });

        test("should have correct OUTERWINDOWWIDTH", () => {
            expect(PitchDrumMatrix.OUTERWINDOWWIDTH).toBe(128);
        });

        test("should have correct INNERWINDOWWIDTH", () => {
            expect(PitchDrumMatrix.INNERWINDOWWIDTH).toBe(50);
        });

        test("should have correct BUTTONSIZE", () => {
            expect(PitchDrumMatrix.BUTTONSIZE).toBe(53);
        });

        test("should have correct ICONSIZE", () => {
            expect(PitchDrumMatrix.ICONSIZE).toBe(32);
        });
    });

    // --- Data Management Tests ---
    describe("data management", () => {
        test("should store row labels", () => {
            pdm.rowLabels.push("C");
            pdm.rowLabels.push("D");
            pdm.rowLabels.push("E");
            expect(pdm.rowLabels).toEqual(["C", "D", "E"]);
        });

        test("should store row args (octaves)", () => {
            pdm.rowArgs.push(4);
            pdm.rowArgs.push(4);
            pdm.rowArgs.push(5);
            expect(pdm.rowArgs).toEqual([4, 4, 5]);
        });

        test("should store drums", () => {
            pdm.drums.push("kick drum");
            pdm.drums.push("snare drum");
            expect(pdm.drums).toHaveLength(2);
        });

        test("should count rests", () => {
            pdm._rests = 0;
            pdm._rests += 1;
            pdm._rests += 1;
            expect(pdm._rests).toBe(2);
        });

        test("should store row block numbers", () => {
            pdm._rowBlocks.push(10);
            pdm._rowBlocks.push(20);
            expect(pdm._rowBlocks).toEqual([10, 20]);
        });

        test("should store column block numbers", () => {
            pdm._colBlocks.push(30);
            pdm._colBlocks.push(40);
            expect(pdm._colBlocks).toEqual([30, 40]);
        });

        test("should store block map entries", () => {
            pdm._blockMap.push([0, 1]);
            pdm._blockMap.push([1, 0]);
            expect(pdm._blockMap).toHaveLength(2);
            expect(pdm._blockMap[0]).toEqual([0, 1]);
        });
    });

    // --- Playing State Tests ---
    describe("playing state", () => {
        test("should toggle playing state", () => {
            expect(pdm._playing).toBe(false);
            pdm._playing = !pdm._playing;
            expect(pdm._playing).toBe(true);
            pdm._playing = !pdm._playing;
            expect(pdm._playing).toBe(false);
        });
    });

    describe("timer lifecycle", () => {
        test("tracks and clears widget-owned timeouts", () => {
            const callback = jest.fn();

            pdm._setWidgetTimeout(callback, 500);

            expect(pdm._timerManager.activeTimeoutCount).toBe(1);
            expect(pdm._clearWidgetTimers()).toBe(1);

            jest.advanceTimersByTime(500);

            expect(callback).not.toHaveBeenCalled();
            expect(pdm._timerManager.activeTimeoutCount).toBe(0);
        });

        test("tracks and clears playback-owned timeouts", () => {
            const callback = jest.fn();

            pdm._setPlaybackTimeout(callback, 500);

            expect(pdm._playbackTimerManager.activeTimeoutCount).toBe(1);
            expect(pdm._clearPlaybackTimers()).toBe(1);

            jest.advanceTimersByTime(500);

            expect(callback).not.toHaveBeenCalled();
            expect(pdm._playbackTimerManager.activeTimeoutCount).toBe(0);
        });

        test("routes manual drum preview delay through widget timers", () => {
            const trigger = jest.fn();
            pdm.activity = {
                errorMsg: jest.fn(),
                logo: {
                    synth: {
                        trigger
                    }
                },
                turtles: {
                    ithTurtle: jest.fn(() => ({
                        singer: {
                            keySignature: "C"
                        }
                    }))
                }
            };

            global.docById.mockImplementation(id => {
                if (id === "pdmTable") {
                    return {
                        rows: [
                            {
                                cells: [
                                    {
                                        innerHTML: "C",
                                        style: {}
                                    }
                                ]
                            }
                        ]
                    };
                }

                if (id === "pdmDrumTable") {
                    return {
                        rows: [
                            {
                                cells: [
                                    {
                                        querySelector: jest.fn(() => ({ title: "kick drum" }))
                                    }
                                ]
                            }
                        ]
                    };
                }

                return {};
            });

            pdm._setPairCell(0, 0, {}, true);

            expect(trigger).toHaveBeenCalledTimes(1);
            expect(pdm._timerManager.activeTimeoutCount).toBe(1);
            expect(pdm._playbackTimerManager.activeTimeoutCount).toBe(0);

            pdm._clearWidgetTimers();
            jest.advanceTimersByTime(Singer.defaultBPMFactor * 1000 * 0.25);

            expect(trigger).toHaveBeenCalledTimes(1);
        });

        test("routes playback drum preview delay through playback timers", () => {
            const trigger = jest.fn();
            pdm._playing = true;
            pdm.activity = {
                errorMsg: jest.fn(),
                logo: {
                    synth: {
                        trigger
                    }
                },
                turtles: {
                    ithTurtle: jest.fn(() => ({
                        singer: {
                            keySignature: "C"
                        }
                    }))
                }
            };

            global.docById.mockImplementation(id => {
                if (id === "pdmTable") {
                    return {
                        rows: [
                            {
                                cells: [
                                    {
                                        innerHTML: "C",
                                        style: {}
                                    }
                                ]
                            }
                        ]
                    };
                }

                if (id === "pdmDrumTable") {
                    return {
                        rows: [
                            {
                                cells: [
                                    {
                                        querySelector: jest.fn(() => ({ title: "kick drum" }))
                                    }
                                ]
                            }
                        ]
                    };
                }

                return {};
            });

            pdm._setPairCell(0, 0, {}, true);

            expect(trigger).toHaveBeenCalledTimes(1);
            expect(pdm._timerManager.activeTimeoutCount).toBe(0);
            expect(pdm._playbackTimerManager.activeTimeoutCount).toBe(1);

            pdm._clearPlaybackTimers();
            jest.advanceTimersByTime(Singer.defaultBPMFactor * 1000 * 0.25);

            expect(trigger).toHaveBeenCalledTimes(1);
        });
    });

    // --- Save Lock Tests ---
    describe("save lock", () => {
        test("should initialize _save_lock as undefined before init", () => {
            // _save_lock is set in init, not constructor
            expect(pdm._save_lock).toBeUndefined();
        });
    });
});
