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
    // Note: Only supports new format 'buzzerSound-{index}'
    // Legacy format 'buzzerSound{index}' will return null
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
                        const aIsInvalid = numA === null;
                        const bIsInvalid = numB === null;
                        if (aIsInvalid && bIsInvalid) {
                            // Fallback to lexicographic order for keys without valid indices
                            // (could be legacy format or truly malformed)
                            return a.localeCompare(b);
                        }
                        if (aIsInvalid) {
                            // Place keys without valid indices after well-formed ones
                            console.warn(`Buzzer sound key with unrecognized format: ${a}`);
                            return 1;
                        }
                        if (bIsInvalid) {
                            // Place keys without valid indices after well-formed ones
                            console.warn(`Buzzer sound key with unrecognized format: ${b}`);
                            return -1;
                        }
                        return numA - numB;
                    });
                setBuzzerSounds(sortedKeys);
            })
            .catch((error) => {
                console.error("Error loading buzzer sounds:", error);
                setBuzzerSounds([]);
            });
    };

    const [isReordering, setIsReordering] = useState(false);

    const getNextBuzzerSoundKey = () => {
        // Keys are always sequential, so next key is just the length
        return `buzzerSound-${buzzerSounds.length}`;
    };

    const reorderBuzzerSounds = async (soundKeyToRemove: string) => {
        if (isReordering) {
            toast("⏳Please wait for previous operation to complete");
            return;
        }
        
        setIsReordering(true);
        
        try {
            // Get all sounds with their values
            const allSounds = await getAllThingsWithPrefix("buzzerSound-");
            
            // Sort by index and filter out the one to remove
            const sortedSounds = allSounds
                .map(s => ({ key: s.key, value: s.value, index: extractIndexFromKey(s.key) }))
                .filter(s => s.index !== null && s.key !== soundKeyToRemove)
                .sort((a, b) => a.index! - b.index!);
            
            // Store backup in case we need to rollback
            const backup = allSounds;
            
            try {
                // Delete all existing buzzer sounds
                await Promise.all(
                    allSounds.map(s => removeThing(s.key))
                );
                
                // Re-add them with sequential indices
                await Promise.all(
                    sortedSounds.map((sound, newIndex) => 
                        setThing(`buzzerSound-${newIndex}`, sound.value)
                    )
                );
                
                toast("🚮Buzzer sound removed");
            } catch (error) {
                // Attempt to restore from backup
                console.error("Error during reordering, attempting rollback:", error);
                try {
                    await Promise.all(
                        backup.map(s => setThing(s.key, s.value))
                    );
                    toast("❌Operation failed, but data was recovered");
                } catch (rollbackError) {
                    console.error("Rollback failed:", rollbackError);
                    toast("❌Critical error: data may be lost");
                }
                throw error;
            }
            
            loadBuzzerSounds();
        } catch (error) {
            console.error("Error reordering buzzer sounds:", error);
        } finally {
            setIsReordering(false);
        }
    };

    return (
        <div className="buzzerSounds" ref={buzzerSoundsRef}>
            {buzzerSounds.map((soundKey, index) => {
                // Display uses array index since keys are always sequential
                const displayNumber = index + 1;
                
                return (
                    <div className="sound" key={soundKey}>
                        <span className="soundLabel">
                            Buzzer-Sound #{displayNumber}
                        </span>
                        <button
                            className="remove"
                            aria-label={`Remove Buzzer-Sound #${displayNumber}`}
                            onClick={() => reorderBuzzerSounds(soundKey)}
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
                        if (isReordering) {
                            toast("⏳Please wait for reordering to complete");
                            return;
                        }
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
