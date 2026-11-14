// The photo being turned into pixel art or saved as an idea. Kept in memory only, between picking it and saving.
let current = null;

// file: from a file input. purpose: 'pixel' or 'idea'.
export function setPhoto(file, purpose) {
  current = file ? { file, purpose } : null;
}

export const getPhoto = (purpose) => (current && current.purpose === purpose ? current.file : null);
