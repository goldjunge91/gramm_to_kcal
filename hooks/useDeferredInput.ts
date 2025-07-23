import { useCallback, useEffect, useState } from "react";

interface UseDeferredInputOptions<T> {
    initialValue: T;
    onCommit: (value: T) => void;
    validator?: (value: T) => boolean;
    formatter?: (value: string) => T;
}

interface UseDeferredInputReturn {
    displayValue: string;
    isDirty: boolean;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleBlur: () => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    reset: () => void;
}

export function useDeferredInput<T>({
    initialValue,
    onCommit,
    validator = () => true,
    formatter,
}: UseDeferredInputOptions<T>): UseDeferredInputReturn {
    const [displayValue, setDisplayValue] = useState(String(initialValue));
    const [committedValue, setCommittedValue] = useState(initialValue);
    const [isDirty, setIsDirty] = useState(false);

    // Update display value when initial value changes from outside
    useEffect(() => {
        setDisplayValue(String(initialValue));
        setCommittedValue(initialValue);
        setIsDirty(false);
    }, [initialValue]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setDisplayValue(newValue);
            setIsDirty(String(committedValue) !== newValue);
        },
        [committedValue],
    );

    const commitValue = useCallback(() => {
        if (!isDirty)
            return;

        let parsedValue: T;

        if (formatter) {
            parsedValue = formatter(displayValue);
        }
        else {
            // Default parsing for numbers
            const numValue = Number.parseFloat(displayValue);
            parsedValue = (
                Number.isNaN(numValue) ? committedValue : numValue
            ) as T;
        }

        if (validator(parsedValue)) {
            onCommit(parsedValue);
            setCommittedValue(parsedValue);
            setIsDirty(false);
        }
        else {
            // Reset to last valid value if validation fails
            setDisplayValue(String(committedValue));
            setIsDirty(false);
        }
    }, [displayValue, isDirty, committedValue, validator, onCommit, formatter]);

    const handleBlur = useCallback(() => {
        commitValue();
    }, [commitValue]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault();
                commitValue();
                (e.target as HTMLInputElement).blur();
            }
            else if (e.key === "Escape") {
                e.preventDefault();
                setDisplayValue(String(committedValue));
                setIsDirty(false);
                (e.target as HTMLInputElement).blur();
            }
        },
        [commitValue, committedValue],
    );

    const reset = useCallback(() => {
        setDisplayValue(String(committedValue));
        setIsDirty(false);
    }, [committedValue]);

    return {
        displayValue,
        isDirty,
        handleChange,
        handleBlur,
        handleKeyDown,
        reset,
    };
}
