import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface TagInputProps {
    initialTags?: string[];
    maxTags?: number;
    onTagsChange: (tags: string[]) => void;
    disabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
    initialTags = [],
    maxTags = 3,
    onTagsChange,
    disabled = false,
}) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState("");
    const [tags, setTags] = useState<string[]>(initialTags);
    const [isMaxTagsReached, setIsMaxTagsReached] = useState(false);

    const normalizeTag = (tag: string): string => {
        const cleanedTag = tag.replace(/[^a-zA-Z0-9#]/g, '');
        const trimmed = cleanedTag.trim().toLowerCase();
        return `#${trimmed.replace(/^#+/, '')}`;
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        if (["Enter", "Tab", ","].includes(e.key)) {
            e.preventDefault();
            addTags();
        } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const addTags = () => {
        if (isMaxTagsReached || !inputValue.trim()) return;

        const newTags = inputValue
            .split(/[,\s]+/)
            .map(tag => normalizeTag(tag))
            .filter(tag =>
                tag.length > 1 && !tags.includes(tag) && tag.length <= 12);

        if (newTags.length > 0) {
            const updatedTags = [...tags, ...newTags].slice(0, maxTags);
            setTags(updatedTags);
            onTagsChange(updatedTags);
            setInputValue("");
        }
    };

    useEffect(() => {
        setIsMaxTagsReached(tags.length >= maxTags);
    }, [tags, maxTags]);

    const removeTag = (index: number) => {
        const newTags = [...tags];
        newTags.splice(index, 1);
        setTags(newTags);
        onTagsChange(newTags);
    };

    return (
        <div className="mb-3">
            <label htmlFor="postTags" className="form-label">
                {t("create.postTags")}
                <small className="text-muted"> ({t("create.tagsHint")})</small>
            </label>
            <input
                type="text"
                className="form-control"
                id="postTags"
                placeholder={
                    isMaxTagsReached
                        ? t("create.tagsMaxReached")
                        : t("create.tagsPlaceholderOptional")
                }
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onBlur={addTags}
                disabled={disabled || isMaxTagsReached}
            />
            {tags.length > maxTags ? (
                <div className="form-text text-danger">
                    {t("create.tagsMaxError", { max: maxTags })}
                </div>
            ) : (
                <div className="form-text text-muted">
                </div>
            )}
            <div className="d-flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                    <span key={index} className="badge bg-primary d-flex align-items-center">
                        {tag}
                        {!disabled && (
                            <button
                                type="button"
                                className="btn-close btn-close-white ms-2"
                                aria-label="Remove"
                                onClick={() => removeTag(index)}
                                style={{ fontSize: '0.5rem' }}
                            />
                        )}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default TagInput;