/**
 * API client for communicating with the FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiError {
  detail: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Important for cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: 'An unexpected error occurred',
      }));
      throw new Error(error.detail);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  async signup(email: string, password: string) {
    return this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request<User>('/api/auth/me');
  }

  // Level endpoints
  async getLevels() {
    return this.request<LevelListItem[]>('/api/levels');
  }

  async getLevel(slug: string) {
    return this.request<Level>(`/api/levels/${slug}`);
  }

  async getLevelById(id: number) {
    return this.request<Level>(`/api/levels/by-id/${id}`);
  }

  // Progress endpoints
  async getProgress() {
    return this.request<UserProgressSummary[]>('/api/progress');
  }

  async getLevelProgress(levelId: number) {
    return this.request<Progress | null>(`/api/progress/${levelId}`);
  }

  async incrementAttempts(levelId: number) {
    return this.request<Progress>('/api/progress/attempt', {
      method: 'POST',
      body: JSON.stringify({ level_id: levelId }),
    });
  }

  async submitCompletion(levelId: number, runData: RunData) {
    return this.request<SubmitCompletionResponse>('/api/progress/complete', {
      method: 'POST',
      body: JSON.stringify({ level_id: levelId, run_data: runData }),
    });
  }

  // Admin endpoints
  async createLevel(data: CreateLevelData) {
    return this.request<Level>('/api/levels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLevel(slug: string, data: UpdateLevelData) {
    return this.request<Level>(`/api/levels/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLevel(slug: string) {
    return this.request<void>(`/api/levels/${slug}`, {
      method: 'DELETE',
    });
  }
}

// Types
export interface User {
  id: number;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}

export interface LevelListItem {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  order_index: number;
}

export interface LevelJsonData {
  gridWidth: number;
  gridHeight: number;
  startPosition: { x: number; y: number };
  goals: Array<{ x: number; y: number }>;
  walls: Array<{ x: number; y: number }>;
  coins: Array<{ x: number; y: number }>;
  hazards: Array<{
    x: number;
    y: number;
    pattern: string;
    activeFrames: number[];
    type: string;
  }>;
  allowedMethods: string[];
  instructions: string;
  starterCode: string;
  winConditions: {
    reachGoal: boolean;
    collectAllCoins: boolean;
  };
}

export interface Level extends LevelListItem {
  json_data: LevelJsonData;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  id: number;
  user_id: number;
  level_id: number;
  attempts: number;
  completed_at: string | null;
  best_run_json: RunData | null;
}

export interface UserProgressSummary {
  level_id: number;
  level_slug: string;
  level_title: string;
  order_index: number;
  attempts: number;
  is_completed: boolean;
  is_unlocked: boolean;
}

export interface RunData {
  action_count: number;
  time_taken?: number;
  coins_collected?: number;
}

export interface SubmitCompletionResponse {
  success: boolean;
  message: string;
  progress: Progress;
}

export interface CreateLevelData {
  slug: string;
  title: string;
  description?: string;
  order_index: number;
  json_data: LevelJsonData;
}

export interface UpdateLevelData {
  title?: string;
  description?: string;
  order_index?: number;
  json_data?: LevelJsonData;
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
