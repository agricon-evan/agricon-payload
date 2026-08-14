import { getPayload } from 'payload'

async function getTestPayload() {
  // The dev server has already synchronized the SQLite schema. Avoid a second
  // schema push during admin tests, which can race on generated indexes.
  process.env.PAYLOAD_PUSH_SCHEMA = 'false'
  const { default: config } = await import('../../src/payload.config.js')
  return getPayload({ config })
}

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getTestPayload()

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  await payload.create({
    collection: 'users',
    data: testUser,
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getTestPayload()

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
