const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const vm = require('node:vm')
const exportsObject = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/trial.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsObject })
const { hasPlatformAccess, getEffectiveTrialEndsAt, getTrialTotalMs } = exportsObject
const expiry = '2026-10-23T05:00:00.000Z'
const at = Date.parse(expiry)

test('new trials last 30 days', () => {
  assert.equal(getTrialTotalMs(), 30 * 24 * 60 * 60 * 1000)
})
test('trial access stops exactly at expiry, including pending subscriptions', () => {
  for (const subscription_status of ['trial', 'free', 'pending', 'cancelled', 'paused']) {
    const p = { trial_ends_at: expiry, subscription_status, current_plan: 'financia_monthly' }
    assert.equal(hasPlatformAccess(p, at - 1), true)
    assert.equal(hasPlatformAccess(p, at), false)
    assert.equal(hasPlatformAccess(p, at + 1), false)
  }
})
test('year-end benefit includes all December 31 in Colombia', () => {
  const p = { trial_ends_at: '2027-01-01T05:00:00.000Z' }
  assert.equal(hasPlatformAccess(p, Date.parse('2026-12-31T23:59:59.999-05:00')), true)
  assert.equal(hasPlatformAccess(p, Date.parse('2027-01-01T00:00:00-05:00')), false)
})
test('paid plans and administrators retain access after trial expiry', () => {
  for (const current_plan of ['financia_monthly', 'financia_annual']) {
    assert.equal(hasPlatformAccess({ current_plan, subscription_status: 'active', trial_ends_at: expiry }, at), true)
  }
  assert.equal(hasPlatformAccess({ is_super_user: true }, at), true)
  assert.equal(hasPlatformAccess({ current_plan: 'free', subscription_status: 'active' }, at), false)
})
test('missing and malformed profiles never grant access', () => {
  for (const p of [null, {}, { trial_ends_at: 'invalid' }, { trial_ends_at: null }]) {
    assert.equal(hasPlatformAccess(p, at), false)
  }
  assert.equal(getEffectiveTrialEndsAt(expiry, at), null)
})
