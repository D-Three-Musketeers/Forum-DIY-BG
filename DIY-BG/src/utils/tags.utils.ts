/**
 * Processes a string of comma or space-separated tags into a validated array.
 * Enforces a maximum of 3 tags and ensures each tag starts with '#'.
 *
 * @param {string} tagsInput - The raw input string of tags
 * @returns {string[]} - An array of validated tags
 */
export const processTagsInput = (tagsInput: string): string[] => {
    return tagsInput
        .split(/[\s,]+/)
        .map(tag => tag.trim())
        .filter(tag => tag !== '' && !tag.includes(' ')) 
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`) 
        .slice(0, 4);
};

/**
 * Validates an array of tags to ensure they start with '#' and don't contain spaces.
 * It also limits the array to a maximum of 3 tags.
 *
 * @param {string[] | undefined} rawTags - An array of raw tag strings.
 * @returns {string[]} - An array of validated tags.
 */
export const validateAndTrimTags = (rawTags: string[] | undefined): string[] => {
    if (!rawTags || !Array.isArray(rawTags)) {
        return [];
    }

    return rawTags
        .filter(tag => typeof tag === 'string' && tag.startsWith('#') && !tag.includes(' '))
        .slice(0, 3);
};