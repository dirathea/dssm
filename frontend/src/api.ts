// Use relative URLs since frontend and backend are served from same Worker
const API_BASE_URL = ''

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async registerStart(userId: string) {
    return this.request('/api/auth/register-start', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  }

  async registerFinish(userId: string, credential: any) {
    return this.request('/api/auth/register-finish', {
      method: 'POST',
      body: JSON.stringify({ userId, credential }),
    })
  }

  async loginStart(userId: string) {
    return this.request('/api/auth/login-start', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  }

  async loginFinish(userId: string, credential: any) {
    return this.request<{ success: boolean; token: string; userId: string; credentialId: string }>(
      '/api/auth/login-finish',
      {
        method: 'POST',
        body: JSON.stringify({ userId, credential }),
      }
    )
  }

  // Secret endpoints (require authentication)
  async getSecrets(token: string) {
    return this.request('/api/secrets', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async createSecret(token: string, name: string, encryptedValue: string, iv: string) {
    return this.request('/api/secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, encryptedValue, iv }),
    })
  }

  async updateSecret(
    token: string,
    secretId: number,
    data: { name?: string; encryptedValue?: string; iv?: string }
  ) {
    return this.request(`/api/secrets/${secretId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
  }

  async deleteSecret(token: string, secretId: number) {
    return this.request(`/api/secrets/${secretId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }
}

export const api = new ApiClient(API_BASE_URL)
