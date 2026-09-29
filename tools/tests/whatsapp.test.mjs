import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeWhatsApp, recipientFields, linkCode, usernameChoice, phoneIdentity, safeLoginDestination } from '../../lib/whatsapp/identity.ts'
import { signInternal, verifyInternal } from '../../lib/whatsapp/security.ts'
import { deliveryOutcome } from '../../lib/whatsapp/delivery.ts'

const base = { metadata: { phone_number_id: '681184581749789', display_phone_number: '573227031301' } }
test('legacy phone and contacts fallback', () => {
  const { messages } = normalizeWhatsApp({ ...base, contacts: [{ wa_id: '573001112233' }], messages: [{ id: 'm1', type: 'text', text: { body: 'Hola' } }] })
  assert.equal(messages[0].phone, '573001112233'); assert.equal(messages[0].whatsapp_user_id, null)
})
test('BSUID-only, preserving username, business number never becomes user', () => {
  const event = normalizeWhatsApp({ ...base, contacts: [{ user_id: 'CO.123', profile: { username: 'CLIENTE' } }], messages: [{ id: 'm2', from_user_id: 'CO.123', type: 'text', text: { body: 'Hola' } }] }).messages[0]
  assert.equal(event.phone, null); assert.equal(event.whatsapp_username, 'CLIENTE')
  assert.deepEqual(recipientFields(event), { recipient: 'CO.123' })
  assert.equal(normalizeWhatsApp({ ...base, messages: [{ id: 'm', type: 'text' }] }).messages.length, 0)
})
test('batch matches contacts by identity, preserves media and buttons', () => {
  const events = normalizeWhatsApp({ entry: [{ changes: [{ value: { ...base,
    contacts: [{ wa_id: '573009998877', profile: { name: 'B' } }, { wa_id: '573001112233', profile: { name: 'A' } }],
    messages: [{ id: 'a', from: '573001112233', type: 'audio', audio: { id: 'audio' } }, { id: 'b', from: '573009998877', type: 'interactive', interactive: { button_reply: { id: 'Aceptar', title: 'Si' } } }],
  } }] }] }).messages
  assert.deepEqual(events.map(e => e.name), ['A','B']); assert.equal(events[0].audio.id, 'audio'); assert.equal(events[1].interactive.button_reply.title, 'Si')
})
test('conflicting contact identity is rejected', () => {
  assert.equal(normalizeWhatsApp({ ...base, contacts: [{ wa_id: '573001112233', user_id: 'CO.OTHER' }],
    messages: [{ id: 'm', from: '573001112233', from_user_id: 'CO.REAL' }] }).messages.length, 0)
})
test('statuses are not financial messages; unsafe types rejected', () => {
  assert.equal(normalizeWhatsApp({ ...base, statuses: [{ id: 's', status: 'delivered' }] }).messages.length, 0)
  assert.equal(phoneIdentity('CO.1304568901678151'), null)
  assert.throws(() => recipientFields({ phone: 'CO.123' }))
})
test('username is declaration, explicit no username and code validation', () => {
  assert.deepEqual(usernameChoice({ hasUsername: false, username: '@old' }), { hasUsername: false, username: null })
  assert.deepEqual(usernameChoice({ hasUsername: true, username: '@name' }), { hasUsername: true, username: 'name' })
  assert.throws(() => usernameChoice({ hasUsername: null }))
  assert.equal(linkCode('VINCULAR '+'a'.repeat(32)), 'a'.repeat(32)); assert.equal(linkCode('VINCULAR 1234'), null)
})
test('HMAC binds body, path, nonce, timestamp, rejecting replay windows', () => {
  const now = Date.now(), ts = String(now), nonce = 'a'.repeat(32), body = '{"payload":{}}', path = '/api/internal/whatsapp/resolve'
  const h = new Headers({ 'x-financia-timestamp': ts, 'x-financia-nonce': nonce, 'x-financia-signature': signInternal('secret', path, ts, nonce, body) })
  assert.equal(verifyInternal('secret', path, h, body, now), nonce)
  assert.equal(verifyInternal('secret', path, h, body+' ', now), null)
  assert.equal(verifyInternal('secret', path+'/other', h, body, now), null)
  assert.equal(verifyInternal('secret', path, h, body, now+300_001), null)
})
test('delivery does not confuse acceptance, rejection and uncertain timeout', () => {
  assert.equal(deliveryOutcome(true, { messages: [{ id: 'wamid' }] }).status, 'accepted')
  assert.equal(deliveryOutcome(false, { error: { code: 130429 } }).status, 'retryable')
  assert.equal(deliveryOutcome(false, { error: { code: 131062 } }).status, 'failed')
  assert.equal(deliveryOutcome(true, {}).status, 'unknown')
})
test('login deep link cannot redirect outside the app', () => {
  assert.equal(safeLoginDestination('/dashboard#whatsapp'), '/dashboard#whatsapp')
  assert.equal(safeLoginDestination('//evil.example'), '/dashboard')
})

test('delivery receipts retain authoritative receiver scope, ignoring supplied scope', () => {
  const receipt = normalizeWhatsApp({ ...base, statuses: [null, { id: 's', status: 'delivered', business_phone_number_id: 'forged' }] }).statuses[0]
  assert.equal(receipt.business_phone_number_id, base.metadata.phone_number_id)
  assert.equal(normalizeWhatsApp({ statuses: [{ id: 's', status: 'delivered' }] }).statuses.length, 0)
})

test('malformed batch members do not discard valid messages', () => {
  const result = normalizeWhatsApp({ entry: [null, { changes: {} }, { changes: [null, { value: {
    ...base, contacts: [null], messages: [null, { id: 'valid', from: '573001112233', type: 'text' }],
  } }] }] })
  assert.equal(result.messages.length, 1)
  assert.equal(result.messages[0].message_id, 'valid')
})

test('blank identity fields fall back to the matching singleton contact', () => {
  const result = normalizeWhatsApp({ ...base, contacts: [{ user_id: 'CO.123', wa_id: '573001112233' }],
    messages: [{ id: 'valid', from: '', from_user_id: '', type: 'text' }] })
  assert.equal(result.messages[0].phone, '573001112233')
  assert.equal(result.messages[0].whatsapp_user_id, 'CO.123')
})
