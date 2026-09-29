/** A timeout is ambiguous. Only an explicit rejection can be retried automatically. */
export function deliveryOutcome(httpOk: boolean, body: any) {
  if (httpOk && typeof body?.messages?.[0]?.id === 'string') {
    return { status: 'accepted' as const, messageId: body.messages[0].id as string }
  }
  if (body?.error && (body.error.is_transient === true || [4, 80007, 130429, 131056].includes(body.error.code))) {
    return { status: 'retryable' as const, messageId: null }
  }
  return { status: body?.error ? 'failed' as const : 'unknown' as const, messageId: null }
}
