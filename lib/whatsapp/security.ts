import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export function hashCode(value: string) { return createHash('sha256').update(value).digest('hex') }

export function signInternal(secret: string, path: string, timestamp: string, nonce: string, body: string) {
  return createHmac('sha256', secret).update(`${timestamp}\n${nonce}\nPOST\n${path}\n${body}`).digest('hex')
}

export function verifyInternal(secret: string, path: string, headers: Headers, body: string, now = Date.now()) {
  const timestamp = headers.get('x-financia-timestamp') ?? ''
  const nonce = headers.get('x-financia-nonce') ?? ''
  const signature = headers.get('x-financia-signature') ?? ''
  if (!secret || !/^\d{13}$/.test(timestamp) || Math.abs(now - Number(timestamp)) > 300_000 ||
      !/^[a-f0-9-]{32,36}$/i.test(nonce) || !/^[a-f0-9]{64}$/i.test(signature)) return null
  const expected = signInternal(secret, path, timestamp, nonce, body)
  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex')) ? nonce : null
}
