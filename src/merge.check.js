// Self-check for pairing certificates with trainings. Run: npm run check
import { strict as assert } from 'node:assert';
import { certificateStatus, mergeResults } from './merge.js';

const cert = (course, enrollId) => ({ course, enrollId, revalidationDate: '2030-01-01', fraudulent: false });
const training = (courseName, enrollId) => ({ courseName, enrollId, competent: true, manuals: [{}] });

// Different names, same enrolment → one card, titled by the certificate.
let cards = mergeResults(
  [cert('Fall Arrest and Basic Rescue Technician', 'e1')],
  [training('Fall Arrest and Basic Rescue', 'e1')]
);
assert.equal(cards.length, 1, 'pairs by enrolment, not by name');
assert.equal(cards[0].courseName, 'Fall Arrest and Basic Rescue Technician');
assert.ok(cards[0].training);

// Same name, different enrolments → not paired.
cards = mergeResults([cert('Rope Rigging', 'e1')], [training('Rope Rigging', 'e2')]);
assert.equal(cards.length, 2, 'a name match alone does not pair');

// A certificate with no enrolment link, and a training with no certificate.
cards = mergeResults([cert('Old course', null)], [training('Tower Erector', 'e3')]);
assert.equal(cards.length, 2);
assert.equal(cards[0].training, null, 'an unlinked certificate stands alone');
assert.equal(cards[1].certificate, null, 'a training without a certificate still shows');

// Nothing at all.
assert.deepEqual(mergeResults([], []), []);

const now = new Date('2026-10-14T10:00:00Z');
const status = (revalidationDate, fraudulent = false) => certificateStatus({ revalidationDate, fraudulent }, now);
assert.deepEqual(status('2026-10-20'), { kind: 'expiring', daysLeft: 6 });
assert.deepEqual(status('2027-01-12'), { kind: 'expiring', daysLeft: 90 }, 'day 90 counts as expiring, as in the reminder job');
assert.equal(status('2027-01-13').kind, 'valid');
assert.deepEqual(status('2026-10-14'), { kind: 'expiring', daysLeft: 0 }, 'expiring today is not yet expired');
assert.equal(status('2026-10-13').kind, 'expired');
assert.equal(status('2030-01-01', true).kind, 'fraudulent', 'fraud outranks any date');
assert.equal(status('').kind, 'valid', 'no date on record is shown as valid, as before');

console.log('merge checks passed');
