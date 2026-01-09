import { useEffect, useRef, useState } from "react";
import { getAllThingsWithPrefix, removeThing, setThing } from "$db/things";
import toast from "react-simple-toasts";
import removeIcon from "$assets/trash.svg";
import autoAnimate from "@formkit/auto-animate";
import AudioInput from "$components/AudioInput";

const CustomBuzzerSounds = () => {
    const [buzzerSounds, setBuzzerSounds] = useState<string[]>([]);
    const buzzerSoundsRef = useRef<HTMLDivElement>(null);

    // Helper function to extract index from buzzer sound key
    const extractIndexFromKey = (key: string): number | null => {
        const match = key.match(/buzzerSound-(\d+)/);
        if (match) {
            const index = parseInt(match[1], 10);
            return isNaN(index) ? null : index;
        }
        return null;
    };

    // Initialize auto-animate
    useEffect(() => {
        if (buzzerSoundsRef.current) {
            autoAnimate(buzzerSoundsRef.current);
        }
    }, []);

    // Load existing buzzer sounds
    useEffect(() => {
        loadBuzzerSounds();
    }, []);

    const loadBuzzerSounds = () => {
        getAllThingsWithPrefix("buzzerSound-")
            .then((sounds) => {
                const sortedKeys = sounds
                    .map((s) => s.key)
                    .sort((a, b) => {
                        const numA = extractIndexFromKey(a);
                        const numB = extractIndexFromKey(b);
                        const aIsNaN = numA === null;
                        const bIsNaN = numB === null;
                        if (aIsNaN && bIsNaN) {
                            // Fallback to lexicographic order for malformed keys
                            return a.localeCompare(b);
                        }
                        if (aIsNaN) {
                            // Place malformed keys after well-formed ones
                            console.warn(`Malformed buzzer sound key detected: ${a}`);
                            return 1;
                        }
                        if (bIsNaN) {
                            // Place malformed keys after well-formed ones
                            console.warn(`Malformed buzzer sound key detected: ${b}`);
                            return -1;
                        }
                        return (numA || 0) - (numB || 0);
                    });
                setBuzzerSounds(sortedKeys);
            })
            .catch((error) => {
                console.error("Error loading buzzer sounds:", error);
                setBuzzerSounds([]);
            });
    };

    const getNextBuzzerSoundKey = () => {
        if (buzzerSounds.length === 0) return "buzzerSound-0";
        const maxIndex = buzzerSounds.reduce((max, key) => {
            const num = parseInt(key.replace("buzzerSound-", ""), 10);
            if (isNaN(num)) return max;
            return Math.max(max, num);
        }, -1);
        return `buzzerSound-${maxIndex + 1}`;
    };

    return (
        <div className="buzzerSounds" ref={buzzerSoundsRef}>
            {buzzerSounds.map((soundKey) => {
                // Extract the actual index from the key for display
                const keyIndex = extractIndexFromKey(soundKey);
                const displayNumber = keyIndex !== null ? keyIndex + 1 : "?";
                
                if (keyIndex === null) {
                    console.warn(`Unable to parse index from buzzer sound key: ${soundKey}`);
                }
                
                return (
                    <div className="sound" key={soundKey}>
                        <span className="soundLabel">
                            Buzzer-Sound #{displayNumber}
                        </span>
                        <button
                            className="remove"
                            aria-label={`Remove Buzzer-Sound #${displayNumber}`}
                            onClick={() =>
                                removeThing(soundKey)
                                    .then(() => {
                                        toast("🚮Buzzer sound removed");
                                        loadBuzzerSounds();
                                    })
                                    .catch(() =>
                                        toast("❌removing failed")
                                    )
                            }
                        >
                            <img src={removeIcon} alt="remove" />
                        </button>
                    </div>
                );
            })}
            <div className="sound addSound">
                <button>
                    <label htmlFor="addBuzzerSound">
                        + Add Buzzer Sound
                    </label>
                </button>
                <AudioInput
                    id="addBuzzerSound"
                    onChange={(file) => {
                        const newKey = getNextBuzzerSoundKey();
                        setThing(newKey, file)
                            .then(() => {
                                toast("✅sound saved");
                                loadBuzzerSounds();
                            })
                            .catch((e) => {
                                console.error(e);
                                toast("❌something went wrong");
                            });
                    }}
                />
            </div>
        </div>
    );
};

export default CustomBuzzerSounds;
