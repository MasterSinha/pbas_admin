import test from 'node:test';
import assert from 'node:assert/strict';
import { incompleteTableRows } from './tableRowValidation.js';

const field = { requireCompleteRows: true, columns: [
  { name: 'Title', type: 'text' }, { name: 'Marks', type: 'number' },
  { name: 'Confirmed', type: 'checkbox' }, { name: 'Total', type: 'computed' },
] };
test('empty rows are ignored and partially filled rows identify missing cells', () => {
  assert.deepEqual(incompleteTableRows(field, [{}, { Title: '   ' }]), []);
  assert.deepEqual(incompleteTableRows(field, [{ Title: 'Research' }]),
    [{ row: 1, missing: ['Marks', 'Confirmed'] }]);
});
test('zero and explicit false complete a row without computed values', () => {
  assert.deepEqual(incompleteTableRows(field, [{ Title: 'Research', Marks: 0, Confirmed: false }]), []);
});
test('disabled and legacy configurations allow partial rows', () => {
  assert.deepEqual(incompleteTableRows({ ...field, requireCompleteRows: false }, [{ Title: 'Research' }]), []);
  assert.deepEqual(incompleteTableRows({ columns: field.columns }, [{ Title: 'Research' }]), []);
});
test('conditional columns require extra text only for their trigger choice', () => {
  const conditional = { requireCompleteRows: true, columns: [{ name: 'Kind', type: 'conditionalText', triggerValue: 'Other' }] };
  assert.equal(incompleteTableRows(conditional, [{ Kind: { choice: 'Other', extra: ' ' } }]).length, 1);
  assert.deepEqual(incompleteTableRows(conditional, [{ Kind: { choice: 'Other', extra: 'Custom' } }]), []);
  assert.deepEqual(incompleteTableRows(conditional, [{ Kind: { choice: 'Research' } }]), []);
});
test('inactive columns are excluded and documents are required in a started row', () => {
  const table = { requireCompleteRows: true, columns: [
    { name: 'Title', type: 'text' }, { name: 'Attachment', type: 'file' },
    { name: 'Hidden', type: 'text', active: false },
  ] };
  assert.deepEqual(incompleteTableRows(table, [{ Title: 'Research' }]), [{ row: 1, missing: ['Attachment'] }]);
  assert.deepEqual(incompleteTableRows(table, [{ Title: 'Research', Attachment: { name: 'proof.pdf', url: 'blob:preview' } }]), []);
});
