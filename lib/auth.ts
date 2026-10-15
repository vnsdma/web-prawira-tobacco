import jwt from "jsonwebtoken"

export interface JwtUserPayload {
  userId: number
  email: string
}

/**
 * Returns JWT secret or throws an error.
 * Prevents application from running with fallback or empty secret.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.trim() === "" || secret === "fallback-secret") {
    throw new Error("CRITICAL SECURITY CONFIGURATION: JWT_SECRET must be configured with a strong secret.")
  }
  return secret
}

/**
 * Signs payload into a JWT
 */
export function signAuthToken(payload: JwtUserPayload, expiresIn: string = "7d"): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: expiresIn as any })
}

/**
 * Verifies JWT token and returns payload, or throws error
 */
export function verifyAuthToken(token: string): JwtUserPayload {
  return jwt.verify(token, getJwtSecret()) as JwtUserPayload
}

/**
 * Extracts Bearer token from Authorization header or Request
 */
export function extractBearerToken(headerOrRequest: Request | string | null): string | null {
  let authHeader: string | null = null

  if (typeof headerOrRequest === "string") {
    authHeader = headerOrRequest
  } else if (headerOrRequest && "headers" in headerOrRequest) {
    authHeader = headerOrRequest.headers.get("authorization")
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7).trim()
  return token || null
}
