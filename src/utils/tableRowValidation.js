export function hasCellValue(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object') return Object.values(value).some(hasCellValue);
  return true;
}

export function incompleteTableRows(field, rows = []) {
  if (!field.requireCompleteRows) return [];
  const columns = (field.columns || []).filter(c => c.type !== 'computed' && c.active !== false);
  return rows.flatMap((row, index) => {
    if (!columns.some(c => hasCellValue(row[c.name]))) return [];
    const missing = columns.filter(c => {
      const value = row[c.name];
      if (c.type === 'conditionalText') {
        return !hasCellValue(value?.choice) ||
          (value.choice === (c.triggerValue || 'Other') && !hasCellValue(value.extra));
      }
      return !hasCellValue(value);
    }).map(c => c.name);
    return missing.length ? [{ row: index + 1, missing }] : [];
  });
}
