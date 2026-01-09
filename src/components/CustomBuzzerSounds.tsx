import { useEffect, useRef, useState } from "react";
import { getAllThingsWithPrefix, removeThing, setThing } from "$db/things";
import toast from "react-simple-toasts";
import removeIcon from "$assets/trash.svg";
import autoAnimate from "@formkit/auto-animate";
import AudioInput from "$components/AudioInput";

const CustomBuzzerSounds = () => {
    const [buzzerSounds, setBuzzerSounds] = useState<string[]>([]);
    const buzzerSoundsRef = useRef<HTMLDivElement>(null);

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
                        const numA = parseInt(a.replace("buzzerSound-", ""), 10);
                        const numB = parseInt(b.replace("buzzerSound-", ""), 10);
                        if (isNaN(numA) || isNaN(numB)) return 0;
                        return numA - numB;
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
            {buzzerSounds.map((soundKey, i) => (
                <div className="sound" key={soundKey}>
                    <span className="soundLabel">
                        Buzzer-Sound #{i + 1}
                    </span>
                    <button
                        className="remove"
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
            ))}
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
