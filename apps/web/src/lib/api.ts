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

  // Quest Map endpoints
  async getQuestMap() {
    return this.request<QuestMapResponse>('/api/quests/map');
  }

  async getQuestDetail(questId: number) {
    return this.request<QuestDetailResponse>(`/api/quests/${questId}`);
  }

  async completeQuest(questId: number, actionCount: number, coinsCollected: number = 0) {
    return this.request<CompleteQuestResponse>('/api/quests/complete', {
      method: 'POST',
      body: JSON.stringify({
        quest_id: questId,
        action_count: actionCount,
        coins_collected: coinsCollected,
      }),
    });
  }

  // Progression endpoints
  async getProgression() {
    return this.request<PlayerProgression>('/api/progression/me');
  }

  // Character endpoints
  async getCharacters() {
    return this.request<Character[]>('/api/characters');
  }

  async selectCharacter(characterId: number) {
    return this.request<{ success: boolean; selected_character_id: number }>(
      '/api/characters/select',
      {
        method: 'POST',
        body: JSON.stringify({ character_id: characterId }),
      }
    );
  }

  async purchaseCharacter(characterId: number) {
    return this.request<{ success: boolean; remaining_coins: number }>(
      '/api/characters/purchase',
      {
        method: 'POST',
        body: JSON.stringify({ character_id: characterId }),
      }
    );
  }

  // Dev endpoints
  async resetProgress() {
    return this.request<{ success: boolean; message: string }>(
      '/api/dev/reset-progress',
      { method: 'POST' }
    );
  }
}

// Quest Map Types
export interface QuestNode {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string;
  xp_reward: number;
  coin_reward: number;
  node_x: number;
  node_y: number;
  level_requirement: number;
  prerequisite_quests: number[];
  level_id: number | null;
}

export interface QuestMapItem {
  quest: QuestNode;
  status: 'locked' | 'unlocked' | 'completed';
  stars_earned: number;
  attempts: number;
  is_playable: boolean;
}

export interface QuestMapResponse {
  quests: QuestMapItem[];
  connections: [number, number][];
}

export interface QuestDetailResponse {
  quest: QuestNode;
  status: string;
  stars_earned: number;
  best_action_count: number | null;
  attempts: number;
  completed_at: string | null;
  level_slug: string | null;
}

export interface PlayerProgression {
  player_level: number;
  current_xp: number;
  xp_to_next_level: number;
  coins: number;
  selected_character_id: number | null;
}

export interface Character {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  sprite_key: string;
  level_required: number;
  quests_required: number[];
  coin_cost: number;
  is_unlocked: boolean;
  is_selected: boolean;
  unlock_reason: string | null;
}

export interface CompleteQuestResponse {
  success: boolean;
  stars_earned: number;
  xp_gained: number;
  coins_gained: number;
  leveled_up: boolean;
  new_level: number | null;
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
